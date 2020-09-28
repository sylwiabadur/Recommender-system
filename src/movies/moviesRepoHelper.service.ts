import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './movie.entity';
import { UsersRatings } from '../users/usersRatings.entity';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class MoviesRepoHelperService {
  constructor(
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsersRatings)
    private usersRatingsRepository: Repository<UsersRatings>,
    @Inject(UsersService)
    private usersService: UsersService,
  ) {}

  async getMovieWithRatingsRelation(id: number): Promise<Movie> {
    const myMovie = await this.moviesRepository.findOne(id, {
      relations: ['ratings', 'ratings.movie', 'ratings.user'],
    });

    if (!myMovie) {
      throw new NotFoundException();
    }
    return myMovie;
  }

  async getManyMoviesWithRatingsRelation(): Promise<Movie[]> {
    const myMovies = await this.moviesRepository.find({
      relations: ['ratings', 'ratings.movie', 'ratings.user'],
    });

    if (!myMovies) {
      throw new NotFoundException();
    }
    return myMovies;
  }
}
