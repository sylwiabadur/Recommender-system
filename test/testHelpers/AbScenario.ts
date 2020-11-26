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
  mae: number;
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
    const percentage = Math.ceil(numOfUsers * 1);
    console.log(percentage);
    const users = await this.usersRepository.find({
      relations: [
        'ratings',
        'ratings.movie',
        'ratings.movie.ratings',
        'ratings.movie.ratings.user',
      ],
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
          console.log(estimate.predictedRating);
          resultsToCompare.push({
            predicted: estimate.predictedRating,
            real: realVal.rating,
          });
        }
      }
    }
    return resultsToCompare;
  }

  public countMseAndRmseAndMAE(
    result: { movie: Movie; predictedRating: number }[],
    deletedValues: UsersRatings[],
  ): ComputedErrorTestResult {
    let mseSum = 0;
    let maeSum = 0;
    let diff = 0;
    const n = deletedValues.length;
    for (const estimate of result) {
      for (const realVal of deletedValues) {
        if (estimate.movie.id == realVal.movie.id) {
          diff = Math.abs(
            Number(estimate.predictedRating) - Number(realVal.rating),
          );
          maeSum += diff;
          mseSum += Math.pow(diff, 2);
        }
      }
    }
    const mse = mseSum / n;
    const mae = maeSum / n;
    const rmse = Math.sqrt(mse);
    return { mse, rmse, mae };
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
      relations: [
        'ratings',
        'ratings.movie',
        'ratings.movie.ratings',
        'ratings.movie.ratings.user',
      ],
    });
    const allMoviesWithRelations = await moviesRepoHelper.getManyMoviesWithRatingsRelation();
    const partMoviesWithRelations = allMoviesWithRelations.slice(0, 10);
    return await moviesService.predictRatingsByUser(
      userAfterReduce,
      partMoviesWithRelations,
    );
  }

  public async fillRepos(
    jsonMovies: JsonMovie[],
    jsonUsers: JsonUser[],
    jsonRatings: JsonRating[],
  ): Promise<void> {
    const categories = new Map<string, Category>();
    const movies: Movie[] = [];
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
    const savedMovies = await this.moviesRepository.save(movies);
    const movieMap = new Map<number, Movie>();
    savedMovies.forEach(movie => {
      movieMap.set(movie.externalId, movie);
    });

    const users: User[] = [];
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
          preferredCategories: prefCategories,
        }),
      );
    }
    const savedUsers = await this.usersRepository.save(users);
    const userMap = new Map<number, User>();
    savedUsers.forEach(user => {
      userMap.set(user.externalId, user);
    });

    await this.usersRatingsRepository.query('SET FOREIGN_KEY_CHECKS=0');
    const ratings = [];
    for (const ratingElem of jsonRatings) {
      const rating = this.usersRatingsRepository.create({
        user: { id: userMap.get(ratingElem.userId).id },
        movie: { id: movieMap.get(ratingElem.movieId).id },
        rating: ratingElem.rating,
      });
      ratings.push(rating);
    }
    await this.usersRatingsRepository.save(ratings, { chunk: 10000 });
    await this.usersRatingsRepository.query('SET FOREIGN_KEY_CHECKS=1');
  }
}
