import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './user.update.dto';
import { CreateUserDto } from './user.create.dto';
import { UsersRatings } from './usersRatings.entity';
import { CreateUsersRatingDto } from './usersRatings.create.dto';
import { UpdateUsersRatingDto } from './usersRatings.update.dto';
import { Movie } from '../movies/movie.entity';
import { UsersRepoHelperService } from './usersRepoHelper.service';

@Injectable()
export class UsersService {
  constructor(
    private usersRepoHelper: UsersRepoHelperService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UsersRatings)
    private usersRatingsRepository: Repository<UsersRatings>,
    @InjectRepository(Movie)
    private moviesRepository: Repository<Movie>,
  ) {}
  async findAll(): Promise<User[]> {
    return this.usersRepoHelper.getAllUsers();
  }

  async findOne(id: number): Promise<User> {
    return this.usersRepoHelper.getOneUser(id);
  }

  async findRating(id: number): Promise<UsersRatings> {
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

  async findSimilarUsers(user: User, users: User[]): Promise<User[]> {
    const similarUsers = await this.findSimilarUsersAndSimilarities(
      user,
      users,
    );
    return similarUsers.map(o => {
      return o.user;
    });
  }

  async findSimilarUsersAndSimilarities(
    myUser: User,
    users: User[],
  ): Promise<{ similarity: number; user: User }[]> {
    const scoresAndUsers: { similarity: number; user: User }[] = [];

    users.forEach(user => {
      if (user.id != myUser.id) {
        scoresAndUsers.push({
          similarity: this.cosineSimilarity(myUser, user),
          user: user,
        });
      }
    });

    let similarUsersWithSimilarities = scoresAndUsers.sort((el1, el2) => {
      return el2.similarity - el1.similarity;
    });
    similarUsersWithSimilarities = similarUsersWithSimilarities.slice(0, 10);

    return similarUsersWithSimilarities;
  }

  async recommendNotSeenMovies(myUser: User, users: User[]): Promise<Movie[]> {
    const similarUsers = await this.findSimilarUsers(myUser, users);
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

  async predictRatingsByUser(
    myUser: User,
    users: User[],
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const result: { movie: Movie; predictedRating: number }[] = [];

    const similaritiesAndUsers = await this.findSimilarUsersAndSimilarities(
      myUser,
      users,
    );

    const similarUsers = similaritiesAndUsers.map(o => {
      return o.user;
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
    if (notSeenMoviesById.length == 0) {
      return result;
    }
    const recommendedMovies = await this.moviesRepository.find({
      where: { id: In(notSeenMoviesById) },
    });

    for (const movie of recommendedMovies) {
      let up = 0;
      let down = 0;
      for (const o of similaritiesAndUsers) {
        const userRating = await this.usersRatingsRepository.findOne({
          where: { movie, user: o.user },
        });
        if (!userRating) {
          continue;
        }

        const r = Number(userRating.rating);

        down += o.similarity;
        up += o.similarity * r;
      }

      result.push({ movie, predictedRating: up / down });
    }
    return result;
  }

  async recommendBasedOnPredicted(
    myUser: User,
    users: User[],
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const predictions = this.predictRatingsByUser(myUser, users);
    const avgFoUser = this.calculateAverageForUser(myUser);
    return (await predictions).filter(o => o.predictedRating >= avgFoUser);
  }

  async similarUsersFavs(myUser: User, users: User[]): Promise<Movie[]> {
    const result = new Map<number, Movie>();
    const similaritiesAndUsers = await this.findSimilarUsersAndSimilarities(
      myUser,
      users,
    );

    const similarUsers = similaritiesAndUsers.map(o => {
      return o.user;
    });

    for (const user of similarUsers) {
      const avg = this.calculateAverageForUser(user);
      for (const rated of user.ratings) {
        if (
          !(await this.checkIfRatedByUserById(myUser.id, rated.movie.id)) &&
          rated.rating > avg
        ) {
          result.set(rated.movie.id, rated.movie);
        }
      }
    }
    return Array.from(result.values());
  }

  calculateAverageForUser(user: User): number {
    let sumUserRatings = 0;
    user.ratings.forEach(element1 => {
      sumUserRatings += Number(element1.rating);
    });
    return sumUserRatings / user.ratings.length;
  }

  async calculateAverageForUserId(id: number): Promise<number> {
    const myUser = await this.usersRepository.findOne(id, {
      relations: ['ratings', 'ratings.movie'],
    });
    let sumUserRatings = 0;
    console.log(myUser + ' !!!!!!!!!');
    myUser.ratings.forEach(element1 => {
      sumUserRatings += Number(element1.rating);
    });
    return sumUserRatings / myUser.ratings.length;
  }

  cosineSimilarity(user1: User, user2: User): number {
    let dotproduct = 0;
    let mA = 0;
    let mB = 0;

    const averageRatingForUser1 = this.calculateAverageForUser(user1);
    const averageRatingForUser2 = this.calculateAverageForUser(user2);

    user1.ratings.forEach(element1 => {
      user2.ratings.forEach(element2 => {
        if (element1.movie.id == element2.movie.id) {
          const normalizedUser1Rating =
            Number(element1.rating) - averageRatingForUser1;
          const normalizedUser2Rating =
            Number(element2.rating) - averageRatingForUser2;
          dotproduct += normalizedUser1Rating * normalizedUser2Rating;
          mA += Math.pow(normalizedUser1Rating, 2);
          mB += Math.pow(normalizedUser2Rating, 2);
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
          sumOfProduct += Number(element1.rating) * Number(element2.rating);
          sumOfEl1 += Number(element1.rating);
          sumOfEl2 += Number(element2.rating);
          sumOfEl1Sq += Math.pow(Number(element1.rating), 2);
          sumOfEl2Sq += Math.pow(Number(element2.rating), 2);
        }
      });
    });
    const numerator = sameMovies * sumOfProduct - sumOfEl1 * sumOfEl2;
    const denominator =
      (sameMovies * sumOfEl1Sq - Math.pow(sumOfEl1, 2)) *
      (sameMovies * sumOfEl2Sq - Math.pow(sumOfEl2, 2));
    if (denominator == 0) return 0;

    const result = numerator / Math.sqrt(denominator);
    return result;
  }

  async findBestRatedByUser(myUser: User): Promise<UsersRatings[]> {
    const sortedRatings = myUser.ratings.sort(function(a, b) {
      return b.rating - a.rating;
    });

    const bestRated = sortedRatings.slice(0, 10);
    bestRated.forEach(element => {
      delete element.id;
    });

    return bestRated;
  }

  async checkIfRatedByUserById(
    userId: number,
    movieId: number,
  ): Promise<boolean> {
    const userRating = await this.usersRatingsRepository.findOne({
      where: { movie: { id: movieId }, user: { id: userId } },
    });
    return !!userRating;
  }

  async checkIfRatedByUser(user: User, movie: Movie): Promise<boolean> {
    const userRating = await this.usersRatingsRepository.findOne({
      where: { movie, user },
    });
    return !!userRating;
  }

  async coldStartRecommendations(myUser: User): Promise<Movie[]> {
    const userPrefCategories = myUser.preferedCategories;
    const movies = this.moviesRepository
      .createQueryBuilder('movie')
      .select()
      .leftJoin('movie.categories', 'category')
      .where('category.id IN (:ids)', {
        ids: userPrefCategories.map(c => c.id),
      })
      .groupBy('movie.id') // limit must be with group by, concern duplicates
      .limit(20)
      .getMany();

    return movies;
  }
}
