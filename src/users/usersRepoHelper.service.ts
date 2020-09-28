import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Movie } from '../movies/movie.entity';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UsersRatings } from './usersRatings.entity';

@Injectable()
export class UsersRepoHelperService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsersRatings)
    private usersRatingsRepository: Repository<UsersRatings>,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}

  async getUserWithRatingsRelation(id: number): Promise<User> {
    const myUser = await this.usersRepository.findOne(id, {
      relations: ['ratings', 'ratings.movie'],
    });

    if (!myUser) {
      throw new NotFoundException();
    }
    return myUser;
  }

  async getManyUsersWithRatingsRelation(): Promise<User[]> {
    const myUsers = await this.usersRepository.find({
      relations: ['ratings', 'ratings.movie'],
    });

    if (!myUsers) {
      throw new NotFoundException();
    }
    return myUsers;
  }

  async getRatingWhereMovieAndUser(
    movie: Movie,
    user: User,
  ): Promise<UsersRatings> {
    const userRating = await this.usersRatingsRepository.findOne({
      where: { movie, user },
    });

    if (!userRating) {
      throw new NotFoundException();
    }
    return userRating;
  }

  async getMovieWhere(id: number): Promise<Movie> {
    return this.moviesRepository.findOne({
      where: {
        id,
      },
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async getOneUser(id: number): Promise<User> {
    return this.usersRepository.findOne(id);
  }
}
