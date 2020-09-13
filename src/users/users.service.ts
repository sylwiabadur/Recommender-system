import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './user.update.dto';
import { CreateUserDto } from './user.create.dto';
import { UsersRatings } from './usersRatings.entity';
import { CreateUsersRatingDto } from './usersRatings.create.dto';
import { UpdateUsersRatingDto } from './usersRatings.update.dto';
import { Movie } from 'src/movies/movie.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsersRatings)
    private usersRatingsRepository: Repository<UsersRatings>,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOne(id: number): Promise<User> {
    return this.usersRepository.findOne(id);
  }

  findRating(id: number): Promise<UsersRatings> {
    return this.usersRatingsRepository.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdObj = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(createdObj);
  }

  async createRating(
    id: number,
    createUsersRatingDto: CreateUsersRatingDto,
  ): Promise<UsersRatings> {
    const createdObj = this.usersRatingsRepository.create({
      user: { id },
      ...createUsersRatingDto,
    });
    return await this.usersRatingsRepository.save(createdObj);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedObj = await this.findOne(id);
    if (!updatedObj) {
      throw new NotFoundException();
    }
    this.usersRepository.merge(updatedObj, updateUserDto);
    return await this.usersRepository.save(updatedObj);
  }

  async updateRating(
    id: number,
    ratingId: number,
    updateUsersRatingDto: UpdateUsersRatingDto,
  ): Promise<UsersRatings> {
    const updatedRating = await this.findRating(ratingId);
    if (!updatedRating) {
      throw new NotFoundException();
    }
    this.usersRatingsRepository.merge(updatedRating, {
      user: { id },
      ...updateUsersRatingDto,
    });
    return await this.usersRatingsRepository.save(updatedRating);
  }

  async findSimilarUsers(id: number): Promise<User[]> {
    const scoresAndUsers = [];
    const myUser = await this.usersRepository.findOne(id, {
      relations: ['ratings', 'ratings.movie'],
    });
    if (!myUser) {
      throw new NotFoundException();
    }
    const users = await this.usersRepository.find({
      relations: ['ratings', 'ratings.movie'],
    });

    // let maxScore = 0;
    // let currentScore;
    // let similarUser;
    users.forEach(user => {
      if (user.id != myUser.id) {
        scoresAndUsers.push({
          similarity: this.pearsonCorrelation(myUser, user),
          user: user,
        });
        // if (maxScore == 0) {
        //   //cold start
        //   maxScore = this.euclidianDistance(myUser, user);
        //   similarUser = user;
        // } else {
        //   currentScore = this.euclidianDistance(myUser, user);
        //   if (currentScore > maxScore) {
        //     maxScore = currentScore;
        //     similarUser = user;
        //   }
        // }
      }
    });

    let similarUsers = scoresAndUsers.sort((el1, el2) => {
      return el2.similarity - el1.similarity;
    });

    similarUsers = similarUsers.slice(0, 5);

    return similarUsers.map(o => {
      delete o.user.ratings;
      return o.user;
    });

    // return similarUser;
  }

  async recommendNotSeenMovies(id: number): Promise<Movie[]> {
    const similarUsers = await this.findSimilarUsers(id);
    const myUser = await this.usersRepository.findOne(id, {
      relations: ['ratings', 'ratings.movie'],
    });
    const setOfUserMovies = new Set<number>();
    const setOfSeenByUsers = new Set<number>();

    myUser.ratings.forEach(element => {
      setOfUserMovies.add(element.movie.id);
    });

    similarUsers.forEach(element => {
      element.ratings.forEach(rating => {
        setOfSeenByUsers.add(rating.movie.id);
      });
    });

    const notSeenMoviesById = [...setOfSeenByUsers].filter(
      x => !setOfUserMovies.has(x),
    );

    const movies = [];

    for (const movieId of notSeenMoviesById) {
      movies.push(
        await this.moviesRepository.findOne({
          where: {
            id: movieId,
          },
        }),
      );
    }

    return movies;
  }

  cosineSimilarity(user1: User, user2: User): number {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;
    user1.ratings.forEach(element1 => {
      user2.ratings.forEach(element2 => {
        if (element1.movie.id == element2.movie.id) {
          dotproduct += Number(element1.rating) * Number(element2.rating);
          mA += Math.pow(Number(element1.rating), 2);
          mB += Math.pow(Number(element2.rating), 2);
        }
      });
    });
    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    return dotproduct / (mA * mB);
  }

  euclidianDistance(user1: User, user2: User): number {
    let sumOfPows = 0;

    user1.ratings.forEach(element1 => {
      user2.ratings.forEach(element2 => {
        if (element1.movie.id == element2.movie.id) {
          sumOfPows += Math.pow(element1.rating - element2.rating, 2);
        }
      });
    });

    const sumSqrt = 1 / (1 + Math.sqrt(sumOfPows));
    return sumSqrt;
  }

  pearsonCorrelation(user1: User, user2: User): number {
    let sameMovies = 0;
    let sumOfProduct = 0;
    let sumOfEl1 = 0;
    let sumOfEl2 = 0;
    let sumOfEl1Sq = 0;
    let sumOfEl2Sq = 0;

    user1.ratings.forEach(element1 => {
      user2.ratings.forEach(element2 => {
        if (element1.movie.id == element2.movie.id) {
          sameMovies++;
          sumOfProduct += element1.rating * element2.rating;
          sumOfEl1 += element1.rating;
          sumOfEl2 += element2.rating;
          sumOfEl1Sq += Math.pow(element1.rating, 2);
          sumOfEl2Sq += Math.pow(element2.rating, 2);
        }
      });
    });

    const numerator = sumOfProduct - (sumOfEl1 * sumOfEl2) / sameMovies;
    const denominator =
      (sumOfEl1Sq - Math.pow(sumOfEl1, 2) / sameMovies) *
      (sumOfEl2Sq - Math.pow(sumOfEl2, 2) / sameMovies);

    return numerator / Math.sqrt(denominator);
  }

  async findBestRatedByUser(id: number): Promise<UsersRatings[]> {
    const myUser = await this.usersRepository.findOne(id, {
      relations: ['ratings', 'ratings.movie'],
    });

    if (!myUser) {
      throw new NotFoundException();
    }

    const sortedRatings = myUser.ratings.sort(function(a, b) {
      return b.rating - a.rating;
    });

    const bestRated = sortedRatings.slice(0, 3);
    bestRated.forEach(element => {
      delete element.id;
    });

    return bestRated;
  }
}
