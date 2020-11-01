import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';
import { UsersRatings } from '../users/usersRatings.entity';
import { CreateMovieDto } from './movie.create.dto';
import { UpdateMovieDto } from './movie.update.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

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

  async bestMovies(allMovies: Movie[]): Promise<Movie[]> {
    const ratings = this.countWeightedRatings(allMovies);
    ratings.sort((a, b) => b.rating - a.rating);
    return ratings.slice(0, 20).map(o => {
      delete o.movie.ratings;
      return o.movie;
    });
  }

  async popularMovies(allMovies: Movie[]): Promise<Movie[]> {
    const moviesWithNumOfVotes: { movie: Movie; votes: number }[] = [];
    for (const movie of allMovies) {
      moviesWithNumOfVotes.push({ movie, votes: movie.ratings.length });
    }
    moviesWithNumOfVotes.sort((a, b) => b.votes - a.votes);
    return moviesWithNumOfVotes.slice(0, 20).map(o => {
      delete o.movie.ratings;
      return o.movie;
    });
  }

  async findSimilarMovies(movie: Movie, movies: Movie[]): Promise<Movie[]> {
    const similarMovies = await this.findSimilarMoviesWithSimilarities(
      movie,
      movies,
    );

    return similarMovies.map(o => {
      delete o.movie.ratings;
      return o.movie;
    });
  }

  async findSimilarMoviesWithSimilarities(
    myMovie: Movie,
    movies: Movie[],
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
    similarMoviesWithSimilarities = similarMoviesWithSimilarities.slice(0, 10);

    return similarMoviesWithSimilarities;
  }

  async cosineSimilarity(movie1: Movie, movie2: Movie): Promise<number> {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;

    for (const element1 of movie1.ratings) {
      for (const element2 of movie2.ratings) {
        if (element1.user.id == element2.user.id) {
          const movie1Rating = Number(element1.rating);
          const movie2Rating = Number(element2.rating);
          dotproduct +=
            (movie1Rating -
              (await this.usersService.calculateAverageForUserId(
                element1.user.id,
              ))) *
            (movie2Rating -
              (await this.usersService.calculateAverageForUserId(
                element2.user.id,
              )));
          mA += Math.pow(movie1Rating, 2);
          mB += Math.pow(movie2Rating, 2);
        }
      }
    }
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    return dotproduct / (mA * mB);
  }

  calculateAverageForMovie(movie: Movie): number {
    let sumMovieRatings = 0;
    movie.ratings.forEach(element1 => {
      sumMovieRatings += Number(element1.rating);
    });
    return sumMovieRatings / movie.ratings.length;
  }

  async predictRatingsByUser(
    myUser: User,
    allMovies: Movie[],
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const userAverageRating = this.usersService.calculateAverageForUser(myUser);

    const result: { movie: Movie; predictedRating: number }[] = [];

    for (const movie of allMovies) {
      let up = 0;
      let down = 0;
      console.log(myUser.id + ' ' + movie.title);
      if (!(await this.usersService.checkIfRatedByUser(myUser, movie))) {
        const similaritiesAndMovies = await this.findSimilarMoviesWithSimilarities(
          movie,
          allMovies,
        );

        console.log(similaritiesAndMovies);

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
