import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';

@Injectable()
export class MoviesRepoHelperService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async getMovieWithRatingsRelation(id: number): Promise<Movie> {
    const myMovie = await this.moviesRepository.findOne(id, {
      relations: ['ratings', 'ratings.user'],
    });

    if (!myMovie) {
      throw new NotFoundException();
    }
    return myMovie;
  }

  async getManyMoviesWithRatingsRelation(): Promise<Movie[]> {
    const myMovies = await this.moviesRepository.find({
      relations: ['ratings', 'ratings.user'],
    });

    if (!myMovies) {
      throw new NotFoundException();
    }
    return myMovies;
  }
}
