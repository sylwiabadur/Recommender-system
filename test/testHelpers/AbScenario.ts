import { Injectable } from '@nestjs/common';
import { Category } from '../../src/categories/category.entity';
import { Movie } from '../../src/movies/movie.entity';
import { User } from '../../src/users/user.entity';
import { UsersRatings } from '../../src/users/usersRatings.entity';
import { Repository } from 'typeorm';
import { JsonMovie } from './JsonMoviesInterface';
import { JsonRating } from './JsonRatingsInterface';
import { JsonUser } from './JsonUserInterface';
import { UsersRepoHelperService } from 'src/users/usersRepoHelper.service';
import { UsersService } from 'src/users/users.service';
import { MoviesService } from 'src/movies/movies.service';
import { MoviesRepoHelperService } from 'src/movies/moviesRepoHelper.service';

interface MovieTestResult {
  predicted: number;
  real: number;
}

interface ComputedErrorTestResult {
  mse: number;
  rmse: number;
}

export interface UserTestResult extends ComputedErrorTestResult {
  movieTestResults: MovieTestResult[];
  reducedByNumber: number;
  reducedByPercentage: number;
}

@Injectable()
export class AbScenario {
  constructor(
    private usersRepository: Repository<User>,
    private usersRatingsRepository: Repository<UsersRatings>,
    private moviesRepository: Repository<Movie>,
    private categoriesRepository: Repository<Category>,
  ) {}

  public async clearRepos(): Promise<void> {
    await this.usersRatingsRepository.delete({});
    await this.usersRepository.delete({});
    await this.moviesRepository.delete({});
    await this.categoriesRepository.delete({});
  }

  public async getUsersPercentage(): Promise<User[]> {
    const numOfUsers = await this.usersRepository.count();
    const percentage = Math.ceil(numOfUsers * 0.5);
    const users = await this.usersRepository.find({
      relations: ['ratings', 'ratings.movie'],
      take: percentage,
    });
    return users;
  }

  public async reduceUserRatings(
    user: User,
    by: number,
  ): Promise<UsersRatings[]> {
    const toDelete = user.ratings.splice(0, by);
    await this.usersRatingsRepository.delete(toDelete.map(r => r.id));
    return toDelete;
  }

  public getEstimateAndValueToCompare(
    result: { movie: Movie; predictedRating: number }[],
    deletedValues: UsersRatings[],
  ): MovieTestResult[] {
    const resultsToCompare: MovieTestResult[] = [];
    for (const estimate of result) {
      for (const realVal of deletedValues) {
        if (estimate.movie.id == realVal.movie.id) {
          resultsToCompare.push({
            predicted: estimate.predictedRating,
            real: realVal.rating,
          });
        }
      }
    }
    return resultsToCompare;
  }

  public countMseAndRmse(
    result: { movie: Movie; predictedRating: number }[],
    deletedValues: UsersRatings[],
  ): ComputedErrorTestResult {
    let mseSum = 0;
    let rmseSum = 0;
    const n = deletedValues.length;
    for (const estimate of result) {
      for (const realVal of deletedValues) {
        if (estimate.movie.id == realVal.movie.id) {
          mseSum += Math.abs(
            Number(estimate.predictedRating) - Number(realVal.rating),
          );
          rmseSum += Math.pow(mseSum, 2);
        }
      }
    }
    const mse = mseSum / n;
    const rmse = Math.sqrt(rmseSum / n);
    return { mse, rmse };
  }

  public async getPredictedRatingsFromOneUserWhenUU(
    user: User,
    usersRepoHelper: UsersRepoHelperService,
    usersService: UsersService,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const userAfterReduce = await this.usersRepository.findOne(user.id, {
      relations: ['ratings', 'ratings.movie'],
    });
    const allUsersWithRelations = await usersRepoHelper.getManyUsersWithRatingsRelation();
    return await usersService.predictRatingsByUser(
      userAfterReduce,
      allUsersWithRelations,
    );
  }

  public async getPredictedRatingsFromOneUserWhenII(
    user: User,
    moviesRepoHelper: MoviesRepoHelperService,
    moviesService: MoviesService,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const userAfterReduce = await this.usersRepository.findOne(user.id, {
      relations: ['ratings', 'ratings.movie'],
    });
    const allMoviesWithRelations = await moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return await moviesService.predictRatingsByUser(
      userAfterReduce,
      allMoviesWithRelations,
    );
  }

  public async fillRepos(
    jsonMovies: JsonMovie[],
    jsonUsers: JsonUser[],
    jsonRatings: JsonRating[],
  ): Promise<void> {
    const categories = new Map<string, Category>();
    const movies = [];
    for (const element of jsonMovies) {
      const movieCategories = [];
      for (const categoryName of element.genres.split('|')) {
        if (categories.has(categoryName)) {
          movieCategories.push(categories.get(categoryName));
        } else {
          const cat = await this.categoriesRepository.save(
            this.categoriesRepository.create({
              name: categoryName,
            }),
          );
          movieCategories.push(cat);
          categories.set(categoryName, cat);
        }
      }
      movies.push(
        this.moviesRepository.create({
          title: element.title,
          externalId: element.movieId,
          categories: movieCategories,
        }),
      );
    }
    await this.moviesRepository.save(movies);

    const users = [];
    for (const element of jsonUsers) {
      const prefCategories = [];
      for (const categoryName of element.genres.split('|')) {
        if (categories.has(categoryName)) {
          prefCategories.push(categories.get(categoryName));
        } else {
          const cat = await this.categoriesRepository.save(
            this.categoriesRepository.create({
              name: categoryName,
            }),
          );
          prefCategories.push(cat);
          categories.set(categoryName, cat);
        }
      }
      users.push(
        this.usersRepository.create({
          name: element.name,
          surname: element.surname,
          externalId: element.userId,
          preferedCategories: prefCategories,
        }),
      );
    }
    await this.usersRepository.save(users);

    const ratings = [];
    for (const ratingElem of jsonRatings) {
      const rating = this.usersRatingsRepository.create({
        user: await this.usersRepository.findOne({
          where: { externalId: ratingElem.userId },
        }),
        movie: await this.moviesRepository.findOne({
          where: { externalId: ratingElem.movieId },
        }),
        rating: ratingElem.rating,
      });
      ratings.push(rating);
    }
    await this.usersRatingsRepository.save(ratings);
  }
}
