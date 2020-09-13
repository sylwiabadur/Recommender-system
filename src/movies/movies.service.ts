import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';
import { UsersRatings } from '../users/usersRatings.entity';
import { CreateMovieDto } from './movie.create.dto';
import { UpdateMovieDto } from './movie.update.dto';

@Injectable()
export class MoviesService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  findAll(): Promise<Movie[]> {
    return this.moviesRepository.find();
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
  async calculateAverageRate(id: number): Promise<number> {
    const movie = await this.moviesRepository.findOne(id, {
      relations: ['ratings'],
    });

    return this.sumOfRatings(movie.ratings) / movie.ratings.length;
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

  async bestMovies(): Promise<Movie[]> {
    const allMovies = await this.moviesRepository.find({
      relations: ['ratings'],
    });
    const ratings = this.countWeightedRatings(allMovies);
    ratings.sort((a, b) => b.rating - a.rating);
    return ratings.slice(0, 20).map(o => {
      delete o.movie.ratings;
      return o.movie;
    });
  }

  async popularMovies(): Promise<Movie[]> {
    const allMovies = await this.moviesRepository.find({
      relations: ['ratings'],
    });
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
}
