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
          const avgForUser = await this.usersService.calculateAverageForUserId(
            userId,
          );
          const normalized1Rating = movie1Rating - avgForUser;
          const normalized2Rating = movie2Rating - avgForUser;
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
            movie1Rating - (await this.calculateAverageForMovieId(movie1.id));
          const normalized2Rating =
            movie2Rating - (await this.calculateAverageForMovieId(movie2.id));
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
  ): Promise<
    { similarity: number; movie: Movie; ratingsMap: Map<number, number> }[]
  > {
    const scoresAndMovies: {
      similarity: number;
      movie: Movie;
      ratingsMap: Map<number, number>;
    }[] = [];

    for (const movie of movies) {
      if (movie.id != myMovie.id) {
        const ratingsMap = new Map<number, number>();
        movie.ratings.forEach(r => ratingsMap.set(r.user.id, Number(r.rating)));
        scoresAndMovies.push({
          similarity: await this.pearsonCorrelation(myMovie, movie),
          movie: movie,
          ratingsMap,
        });
      }
    }

    const similarMoviesWithSimilarities = scoresAndMovies.sort((el1, el2) => {
      return el2.similarity - el1.similarity;
    });
    let counterOfSimilar = 0;
    similarMoviesWithSimilarities.forEach(o => {
      if (Number(o.similarity) > 0.05) {
        counterOfSimilar++;
      }
    });
    if (counterOfSimilar < numOfMovies) {
      return similarMoviesWithSimilarities.slice(0, counterOfSimilar);
    } else {
      return similarMoviesWithSimilarities.slice(0, numOfMovies);
    }
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
    // console.log(similarMovies);

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
    const { avg } = await this.usersRatingsRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.movieId = :id', { id })
      .getRawOne();
    return avg;
  }

  // /**
  //  * @requires myUser.rating.movie
  //  */

  async predictUserRatingForMovieWithSim(
    myUser: User,
    movie: Movie,
    similaritiesAndMovies: {
      similarity: number;
      movie: Movie;
      ratingsMap: Map<number, number>;
    }[],
  ): Promise<number> {
    let down = 0;
    let up = 0;

    for (const o of similaritiesAndMovies) {
      if (!o.ratingsMap.has(myUser.id)) {
        continue;
      }
      const movieRating = Number(o.ratingsMap.get(myUser.id));

      const r = Number(movieRating);
      down += Math.abs(o.similarity);
      up += o.similarity * Number(r);
    }
    if (isNaN(down) || down == 0) {
      return await this.calculateAverageForMovieId(movie.id);
    }
    return up / down;
  }

  async predictUserRatingForMovie(myUser: User, movie: Movie): Promise<number> {
    const userMovies: Movie[] = [];
    for (const rating of myUser.ratings) {
      const ratedMovie = await this.moviesRepository.findOne({
        where: { id: rating.movie.id },
        relations: ['ratings', 'ratings.user'],
      });
      userMovies.push(ratedMovie);
    }

    const similaritiesAndMovies = await this.findSimilarMoviesWithSimilarities(
      movie,
      userMovies,
      10,
    );
    return this.predictUserRatingForMovieWithSim(
      myUser,
      movie,
      similaritiesAndMovies,
    );
  }

  async predictRatingsByUser(
    myUser: User,
    allMovies: Movie[],
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const result: { movie: Movie; predictedRating: number }[] = [];

    const setOfUserMovies = new Set<number>();
    const notSeenByUser = new Map<number, Movie>();

    myUser.ratings.forEach(element => {
      setOfUserMovies.add(element.movie.id);
    });

    for (const element of allMovies) {
      if (!setOfUserMovies.has(element.id)) {
        if (notSeenByUser.size < 20) {
          notSeenByUser.set(element.id, element);
        } else {
          break;
        }
      }
    }

    if (notSeenByUser.size == 0) {
      return result;
    }

    for (const movie of notSeenByUser.values()) {
      const predicted = await this.predictUserRatingForMovie(myUser, movie);
      delete movie.ratings;
      result.push({
        movie,
        predictedRating: Number(predicted),
      });
    }
    return result;
    // console.log('HEJKA1');

    // for (const rating of myUser.ratings) {
    //   console.log('HEJKA2');
    //   let up = 0;
    //   let down = 0;

    //   const similaritiesAndMovies = await this.findSimilarMoviesWithSimilarities(
    //     rating.movie,
    //     allMovies.slice(0, 100),
    //     10,
    //   );
    //   console.log('HEJKA3');
    //   for (const o of similaritiesAndMovies) {
    //     if (!o.ratingsMap.has(myUser.id)) {
    //       continue;
    //     }
    //     console.log('HEJKA4');
    //     const movieRating = Number(o.ratingsMap.get(myUser.id));
    //     const r = Number(movieRating);
    //     down += Math.abs(o.similarity);
    //     up += o.similarity * r;
    //   }
    //   if (isNaN(up / down)) {
    //     result.push({
    //       movie: rating.movie,
    //       predictedRating: await this.calculateAverageForMovieId(
    //         rating.movie.id,
    //       ),
    //     });
    //   } else {
    //     result.push({
    //       movie: rating.movie,
    //       predictedRating: up / down,
    //     });
    //   }
    // }
    // return result;
  }
}
