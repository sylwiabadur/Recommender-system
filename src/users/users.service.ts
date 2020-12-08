import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './user.update.dto';
import { CreateUserDto } from './user.create.dto';
import { UsersRatings } from './usersRatings.entity';
import { Movie } from '../movies/movie.entity';
import { UsersRepoHelperService } from './usersRepoHelper.service';

interface UserSimilarity {
  similarity: number;
  user: User;
  ratingsMap: Map<number, number>;
}

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

  async remove(id: number): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdObj = this.usersRepository.create(createUserDto);
    return await this.usersRepository.save(createdObj);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedObj = await this.findOne(id);
    if (!updatedObj) {
      throw new NotFoundException();
    }
    this.usersRepository.merge(updatedObj, updateUserDto);
    return await this.usersRepository.save(updatedObj);
  }

  calculateAverageForUser(user: User): number {
    let sumUserRatings = 0;
    user.ratings.forEach(element1 => {
      sumUserRatings += Number(element1.rating);
    });
    return sumUserRatings / user.ratings.length;
  }

  async calculateAverageForUserId(id: number): Promise<number> {
    const { avg } = await this.usersRatingsRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.userId = :id', { id })
      .getRawOne();
    return avg;
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
    if (Math.sqrt(mA * mB) == 0) {
      return 0.05;
    }
    const similarity = dotproduct / (Math.sqrt(mA) * Math.sqrt(mB));
    if (isNaN(similarity)) {
      console.log('!!!!!!!');
    }
    return similarity;
  }

  findSimilarUsersAndSimilarities(
    myUser: User,
    users: User[],
    numOfUsers: number,
  ): UserSimilarity[] {
    const scoresAndUsers: UserSimilarity[] = [];

    users.forEach(user => {
      if (user.id != myUser.id) {
        const ratingsMap = new Map<number, number>();
        user.ratings.forEach(r => ratingsMap.set(r.movie.id, Number(r.rating)));
        scoresAndUsers.push({
          similarity: this.cosineSimilarity(myUser, user),
          user,
          ratingsMap,
        });
      }
    });

    let similarUsersWithSimilarities = scoresAndUsers.sort((el1, el2) => {
      return el2.similarity - el1.similarity;
    });
    similarUsersWithSimilarities = similarUsersWithSimilarities.slice(
      0,
      numOfUsers,
    );
    return similarUsersWithSimilarities;
  }

  findSimilarUsers(user: User, users: User[], numOfUsers: number): User[] {
    const similarUsers = this.findSimilarUsersAndSimilarities(
      user,
      users,
      numOfUsers,
    );
    return similarUsers.map(o => {
      return o.user;
    });
  }

  async recommendNotSeenMovies(
    myUser: User,
    users: User[],
    numOfMovies: number,
  ): Promise<Movie[]> {
    const similarUsers = this.findSimilarUsers(myUser, users, 10);
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

    return movies.slice(0, numOfMovies);
  }

  async predictRatingsByUser(
    myUser: User,
    users: User[],
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const result: { movie: Movie; predictedRating: number }[] = [];

    const similaritiesAndUsers = this.findSimilarUsersAndSimilarities(
      myUser,
      users,
      10,
    );

    const setOfUserMovies = new Set<number>();

    const notSeenByUser = new Map<number, Movie>();

    myUser.ratings.forEach(element => {
      setOfUserMovies.add(element.movie.id);
    });

    similaritiesAndUsers.forEach(element => {
      element.user.ratings.forEach(rating => {
        if (!setOfUserMovies.has(rating.movie.id)) {
          notSeenByUser.set(rating.movie.id, rating.movie);
        }
      });
    });

    if (notSeenByUser.size == 0) {
      return result;
    }

    for (const movie of notSeenByUser.values()) {
      let up = 0;
      let down = 0;
      for (const o of similaritiesAndUsers) {
        if (!o.ratingsMap.has(movie.id)) {
          continue;
        }
        const r = Number(o.ratingsMap.get(movie.id));
        down += Math.abs(o.similarity);
        up += o.similarity * (r - this.calculateAverageForUser(o.user));
      }
      if (down == 0) {
        result.push({ movie, predictedRating: 0 });
        continue;
      }

      result.push({
        movie,
        predictedRating: up / down + this.calculateAverageForUser(myUser),
      });
    }
    return result;
  }

  predictUserRatingForMovie(myUser: User, users: User[], movie: Movie): number {
    const similaritiesAndUsers = this.findSimilarUsersAndSimilarities(
      myUser,
      users,
      10, // here
    );

    let up = 0;
    let down = 0;
    for (const o of similaritiesAndUsers) {
      if (!o.ratingsMap.has(movie.id)) {
        continue;
      }
      const r = Number(o.ratingsMap.get(movie.id));
      down += Math.abs(o.similarity);
      up += o.similarity * (r - this.calculateAverageForUser(o.user));
    }
    if (isNaN(down) || down == 0) {
      return this.calculateAverageForUser(myUser);
    }
    return up / down + this.calculateAverageForUser(myUser);
  }

  async recommendBasedOnPredicted(
    myUser: User,
    users: User[],
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const predictions = this.predictRatingsByUser(myUser, users);
    const avgFoUser = this.calculateAverageForUser(myUser);
    return (await predictions).filter(o => o.predictedRating >= avgFoUser);
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

  async similarUsersFavs(
    myUser: User,
    users: User[],
    numOfUsers: number,
  ): Promise<Movie[]> {
    const result = new Map<number, Movie>();
    const similaritiesAndUsers = this.findSimilarUsersAndSimilarities(
      myUser,
      users,
      numOfUsers,
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
    if (denominator == 0) return 0.05;

    const result = numerator / Math.sqrt(denominator);
    return result;
  }

  findBestRatedByUser(myUser: User, numOfRatings: number): UsersRatings[] {
    const sortedRatings = myUser.ratings.sort(function(a, b) {
      return b.rating - a.rating;
    });
    const bestRated = sortedRatings.slice(0, numOfRatings);
    bestRated.forEach(element => {
      delete element.id;
    });
    return bestRated;
  }

  async coldStartRecommendations(
    myUser: User,
    numOfMovies: number,
  ): Promise<Movie[]> {
    const userPrefCategories = myUser.preferredCategories;
    const movies = this.moviesRepository
      .createQueryBuilder('movie')
      .select()
      .leftJoin('movie.categories', 'category')
      .where('category.id IN (:ids)', {
        ids: userPrefCategories.map(c => c.id),
      })
      .groupBy('movie.id') // limit must be with group by, concern duplicates
      .limit(numOfMovies)
      .getMany();

    return movies;
  }
}
