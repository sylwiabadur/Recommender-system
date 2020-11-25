import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';
import { UsersRatings } from '../users/usersRatings.entity';
import { CreateMovieDto } from './movie.create.dto';
import { UpdateMovieDto } from './movie.update.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { max } from 'class-validator';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
    @InjectRepository(UsersRatings)
    private usersRatingsRepository: Repository<UsersRatings>,
    @Inject(UsersService)
    private usersService: UsersService,
  ) {}

  findAll(): Promise<Movie[]> {
    return this.moviesRepository.find({ relations: ['categories'] });
  }

  findOne(id: number): Promise<Movie> {
    return this.moviesRepository.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.moviesRepository.delete(id);
  }

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const createdObj = this.moviesRepository.create(createMovieDto);
    return await this.moviesRepository.save(createdObj);
  }

  async update(id: number, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const updatedObj = await this.findOne(id);
    if (!updatedObj) {
      throw new NotFoundException();
    }
    this.moviesRepository.merge(updatedObj, updateMovieDto);
    return await this.moviesRepository.save(updatedObj);
  }

  sumOfRatings(ratings: UsersRatings[]): number {
    let sum = 0;
    for (const userRating of ratings) {
      sum += Number(userRating.rating);
    }
    return sum;
  }

  countWeightedRatings(movies: Movie[]): { movie: Movie; rating: number }[] {
    const moviesWithWeightedRatings: { movie: Movie; rating: number }[] = [];
    for (const movie of movies) {
      const numOfVotes = movie.ratings.length;
      const minimumVotes = 50;
      const average = this.sumOfRatings(movie.ratings) / numOfVotes;
      const meanVote = 3.0;
      const weightedRating =
        (numOfVotes / (numOfVotes + minimumVotes)) * average +
        (minimumVotes / (minimumVotes + numOfVotes)) * meanVote;
      moviesWithWeightedRatings.push({
        movie,
        rating: weightedRating,
      });
    }
    return moviesWithWeightedRatings;
  }

  async bestMovies(allMovies: Movie[], numOfMovies: number): Promise<Movie[]> {
    const ratings = this.countWeightedRatings(allMovies);
    ratings.sort((a, b) => b.rating - a.rating);
    return ratings.slice(0, numOfMovies).map(o => {
      delete o.movie.ratings;
      return o.movie;
    });
  }

  async lastInserted(numOfMovies: number): Promise<Movie[]> {
    const movies = await this.moviesRepository.find({
      take: numOfMovies,
      order: { id: 'DESC' },
    });
    return movies;
  }

  async popularMovies(
    allMovies: Movie[],
    numOfMovies: number,
  ): Promise<Movie[]> {
    const moviesWithNumOfVotes: { movie: Movie; votes: number }[] = [];
    for (const movie of allMovies) {
      moviesWithNumOfVotes.push({ movie, votes: movie.ratings.length });
    }
    moviesWithNumOfVotes.sort((a, b) => b.votes - a.votes);
    return moviesWithNumOfVotes.slice(0, numOfMovies).map(o => {
      delete o.movie.ratings;
      return o.movie;
    });
  }

  async cosineSimilarity(movie1: Movie, movie2: Movie): Promise<number> {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for (const element1 of movie1.ratings) {
      for (const element2 of movie2.ratings) {
        if (element1.user.id == element2.user.id) {
          const userId = element1.user.id;
          const movie1Rating = Number(element1.rating);
          const movie2Rating = Number(element2.rating);
          const normalized1Rating =
            movie1Rating -
            (await this.usersService.calculateAverageForUserId(userId));
          const normalized2Rating =
            movie2Rating -
            (await this.usersService.calculateAverageForUserId(userId));
          dotproduct += normalized1Rating * normalized2Rating;
          mA += Math.pow(normalized1Rating, 2);
          mB += Math.pow(normalized2Rating, 2);
        }
      }
    }
    if (Math.sqrt(mA * mB) == 0) {
      return 0.05;
    }
    const similarity = dotproduct / (Math.sqrt(mA) * Math.sqrt(mB));
    return similarity;
  }

  async pearsonCorrelation(movie1: Movie, movie2: Movie): Promise<number> {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    for (const element1 of movie1.ratings) {
      for (const element2 of movie2.ratings) {
        if (element1.user.id == element2.user.id) {
          const movie1Rating = Number(element1.rating);
          const movie2Rating = Number(element2.rating);
          const normalized1Rating =
            movie1Rating -
            (await this.calculateAverageForMovieId(element1.movie.id));
          const normalized2Rating =
            movie2Rating -
            (await this.calculateAverageForMovieId(element2.movie.id));
          dotproduct += normalized1Rating * normalized2Rating;
          mA += Math.pow(normalized1Rating, 2);
          mB += Math.pow(normalized2Rating, 2);
        }
      }
    }
    const result = dotproduct / Math.sqrt(mA * mB);
    return result;
  }

  async findSimilarMoviesWithSimilarities(
    myMovie: Movie,
    movies: Movie[],
    numOfMovies: number,
  ): Promise<{ similarity: number; movie: Movie }[]> {
    const scoresAndMovies: { similarity: number; movie: Movie }[] = [];

    for (const movie of movies) {
      if (movie.id != myMovie.id) {
        scoresAndMovies.push({
          similarity: await this.cosineSimilarity(myMovie, movie),
          movie: movie,
        });
      }
    }

    let similarMoviesWithSimilarities = scoresAndMovies.sort((el1, el2) => {
      return el2.similarity - el1.similarity;
    });
    similarMoviesWithSimilarities = similarMoviesWithSimilarities.slice(
      0,
      numOfMovies,
    );
    return similarMoviesWithSimilarities;
  }

  async findSimilarMovies(
    movie: Movie,
    movies: Movie[],
    numOfMovies: number,
  ): Promise<Movie[]> {
    const similarMovies = await this.findSimilarMoviesWithSimilarities(
      movie,
      movies,
      numOfMovies,
    );

    return similarMovies.map(o => {
      delete o.movie.ratings;
      return o.movie;
    });
  }

  calculateAverageForMovie(movie: Movie): number {
    let sumMovieRatings = 0;
    movie.ratings.forEach(element1 => {
      sumMovieRatings += Number(element1.rating);
    });
    return sumMovieRatings / movie.ratings.length;
  }

  async calculateAverageForMovieId(id: number): Promise<number> {
    const myMovie = await this.moviesRepository.findOne(id, {
      relations: ['ratings', 'ratings.movie', 'ratings.user'],
    });
    return this.calculateAverageForMovie(myMovie);
  }

  async predictRatingsByUser(
    myUser: User,
    allMovies: Movie[],
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const userAverageRating = this.usersService.calculateAverageForUser(myUser);

    const result: { movie: Movie; predictedRating: number }[] = [];

    // const topRatingsBestRatedByUser = this.usersService.findBestRatedByUser(
    //   myUser,
    //   30,
    // );
    // const topMoviesBestRatedByUser = topRatingsBestRatedByUser.map(o => {
    //   return o.movie;
    // });

    // for (const movie of topMoviesBestRatedByUser) {
    //   let up = 0;
    //   let down = 0;
    //   if (!(await this.usersService.checkIfRatedByUser(myUser, movie))) {
    //     const similaritiesAndMovies = await this.findSimilarMoviesWithSimilarities(
    //       movie,
    //       allMovies,
    //       10,
    //     );

    //     for (const o of similaritiesAndMovies) {
    //       const movieRating = await this.usersRatingsRepository.findOne({
    //         where: { movie: o.movie, user: myUser },
    //       });
    //       if (!movieRating) {
    //         continue;
    //       }

    //       const r =
    //         Number(movieRating.rating) - this.calculateAverageForMovie(o.movie);

    //       down += Math.abs(o.similarity);
    //       up += o.similarity * r;
    //     }
    //   } else {
    //     continue;
    //   }
    //   result.push({ movie, predictedRating: up / down + userAverageRating });
    // }

    for (const movie of allMovies) {
      let up = 0;
      let down = 0;
      if (!(await this.usersService.checkIfRatedByUser(myUser, movie))) {
        const similaritiesAndMovies = await this.findSimilarMoviesWithSimilarities(
          movie,
          allMovies,
          10,
        );
        for (const o of similaritiesAndMovies) {
          const movieRating = await this.usersRatingsRepository.findOne({
            where: { movie: o.movie, user: myUser },
          });
          if (!movieRating) {
            continue;
          }

          const r =
            Number(movieRating.rating) - this.calculateAverageForMovie(o.movie);

          down += Math.abs(o.similarity);
          up += o.similarity * r;
        }
      } else {
        continue;
      }
      result.push({ movie, predictedRating: up / down + userAverageRating });
    }
    return result;
  }
}
