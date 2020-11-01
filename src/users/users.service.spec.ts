import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository } from 'src/common/mockRepository';
import { Movie } from 'src/movies/movie.entity';
import { MovieFactory } from 'src/movies/__factories__/movie.entity.factory';
import { CategoryFactory } from '../categories/__factories__/category.entity.factory';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersRatings } from './usersRatings.entity';
import { UsersRepoHelperService } from './usersRepoHelper.service';
import { UserFactory } from './__factories__/user.entity.factory';
import { UserRatingsFactory } from './__factories__/userRatings.entity.factory';

describe('UsersService', () => {
  let service: UsersService;
  const mockUserRepository = new MockRepository<User>();
  const mockMovieRepository = new MockRepository<Movie>();
  const mockUserRatingsRepository = new MockRepository<UsersRatings>();

  const category1 = CategoryFactory.build();
  const category2 = CategoryFactory.build();
  const user1 = UserFactory.build();
  const rating1 = UserRatingsFactory.build({ user: user1, rating: 2.0 });
  const rating1a = UserRatingsFactory.build({ user: user1, rating: 3.0 });
  user1.ratings = [rating1, rating1a];
  user1.preferedCategories = [category2];
  const movie1 = rating1.movie;
  movie1.categories = [category1];
  const movie2 = rating1a.movie;
  movie2.categories = [category2];

  const user2 = UserFactory.build();
  const movie3 = MovieFactory.build();
  const rating2 = UserRatingsFactory.build({
    user: user2,
    movie: rating1.movie,
    rating: 2.0,
  });
  const rating2a = UserRatingsFactory.build({
    user: user2,
    movie: rating1a.movie,
    rating: 3.0,
  });
  const rating2b = UserRatingsFactory.build({
    user: user2,
    rating: 3.0,
    movie: movie3,
  });
  user2.ratings = [rating2, rating2a, rating2b];
  const users = [user1, user2];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        UsersRepoHelperService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepository,
        },
        {
          provide: getRepositoryToken(UsersRatings),
          useValue: mockUserRatingsRepository,
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should check if user already rated item', async () => {
    mockUserRatingsRepository.findOne.mockResolvedValue(null);
    const result = await service.checkIfRatedByUser(user2, movie1);

    expect(mockUserRatingsRepository.findOne).toBeCalledWith({
      where: { movie: movie1, user: user2 },
    });
    expect(result).toEqual(false);
  });

  it('should check if user already rated item (by Id)', async () => {
    mockUserRatingsRepository.findOne.mockResolvedValue(null);
    const result = await service.checkIfRatedByUserById(user2.id, movie1.id);

    expect(mockUserRatingsRepository.findOne).toBeCalledWith({
      where: { movie: movie1, user: user2 },
    });
    expect(result).toEqual(false);
  });

  it('should get best rated by user', async () => {
    const result = await service.findBestRatedByUser(user1);
    expect(result[0]).toEqual(rating1a);
  });

  it('should get average for user', async () => {
    const result = await service.calculateAverageForUser(user1);
    const avg = (Number(rating1a.rating) + Number(rating1.rating)) / 2;
    expect(result).toEqual(avg);
  });

  it('should calculate cosine similarity between users', async () => {
    const result = await service.cosineSimilarity(user1, user2);
    const expectedValue = 0.95;
    expect(Number(result.toPrecision(2))).toEqual(expectedValue);
  });

  it('should calculate euclidian distance between users', async () => {
    const userA = UserFactory.build();
    const ratinga1 = UserRatingsFactory.build({ user: userA, rating: 2.0 });
    const ratinga2 = UserRatingsFactory.build({ user: userA, rating: 3.0 });
    userA.ratings = [rating1, rating1a];
    const userB = UserFactory.build();
    const ratingb1 = UserRatingsFactory.build({
      user: userB,
      rating: 2.5,
      movie: ratinga1.movie,
    });
    const ratingb2 = UserRatingsFactory.build({
      user: userB,
      rating: 3.0,
      movie: ratinga2,
    });
    userA.ratings = [ratinga1, ratinga2];
    userB.ratings = [ratingb1, ratingb2];
    const result = await service.euclidianDistance(userA, userB);
    const expectedValue = 0.472;
    expect(Number(result.toPrecision(3))).toEqual(expectedValue);
  });

  it('should calculate pearson correlation between users', async () => {
    const userA = UserFactory.build();
    const ratinga1 = UserRatingsFactory.build({ user: userA, rating: 2.0 });
    const ratinga2 = UserRatingsFactory.build({ user: userA, rating: 3.0 });
    userA.ratings = [rating1, rating1a];
    const userB = UserFactory.build();
    const ratingb1 = UserRatingsFactory.build({
      user: userB,
      rating: 2.5,
    });
    ratingb1.movie = ratinga1.movie;
    const ratingb2 = UserRatingsFactory.build({
      user: userB,
      rating: 3.0,
    });
    ratingb2.movie = ratinga2.movie;
    userA.ratings = [ratinga1, ratinga2];
    userB.ratings = [ratingb1, ratingb2];
    const result = await service.pearsonCorrelation(userA, userB);
    const expectedValue = 1;
    expect(Number(result)).toEqual(expectedValue);
  });

  it('should return similar users favs', async () => {
    const userA = UserFactory.build();
    const ratinga1 = UserRatingsFactory.build({ user: userA, rating: 2.0 });
    const ratinga2 = UserRatingsFactory.build({ user: userA, rating: 3.0 });
    userA.ratings = [rating1, rating1a];
    const userB = UserFactory.build();
    const ratingb1 = UserRatingsFactory.build({
      user: userB,
      rating: 2.0,
    });
    ratingb1.movie = ratinga1.movie;
    const ratingb2 = UserRatingsFactory.build({
      user: userB,
      rating: 3.0,
    });
    ratingb2.movie = ratinga2.movie;
    const ratingb3 = UserRatingsFactory.build({
      user: userB,
      rating: 5.0,
    });
    userA.ratings = [ratinga1, ratinga2];
    userB.ratings = [ratingb1, ratingb2, ratingb3];
    const usersAll = [userA, userB];
    const result = await service.similarUsersFavs(userA, usersAll);
    expect(result).toEqual([ratingb3.movie]);
  });

  it('should predict ratings for user based on user-user similarity', async () => {
    const userA = UserFactory.build();
    const ratinga1 = UserRatingsFactory.build({ user: userA, rating: 2.0 });
    const ratinga2 = UserRatingsFactory.build({ user: userA, rating: 3.0 });
    userA.ratings = [rating1, rating1a];
    const userB = UserFactory.build();
    const ratingb1 = UserRatingsFactory.build({
      user: userB,
      rating: 2.5,
    });
    ratingb1.movie = ratinga1.movie;
    const ratingb2 = UserRatingsFactory.build({
      user: userB,
      rating: 3.0,
    });
    ratingb2.movie = ratinga2.movie;
    const ratingb3 = UserRatingsFactory.build({
      user: userB,
      rating: 5.0,
    });
    userA.ratings = [ratinga1, ratinga2];
    userB.ratings = [ratingb1, ratingb2, ratingb3];
    const usersAll = [userA, userB];
    mockMovieRepository.find.mockResolvedValue([ratingb3.movie]);
    mockUserRatingsRepository.findOne.mockResolvedValue(ratingb3);
    const result = await service.predictRatingsByUser(userA, usersAll);
    expect(result[0].predictedRating).toEqual(ratingb3.rating);
  });

  it('should not predict because no not seen movies', async () => {
    const userA = UserFactory.build();
    const ratinga1 = UserRatingsFactory.build({ user: userA, rating: 2.0 });
    const ratinga2 = UserRatingsFactory.build({ user: userA, rating: 3.0 });
    userA.ratings = [rating1, rating1a];
    const userB = UserFactory.build();
    const ratingb1 = UserRatingsFactory.build({
      user: userB,
      rating: 2.5,
    });
    ratingb1.movie = ratinga1.movie;
    const ratingb2 = UserRatingsFactory.build({
      user: userB,
      rating: 3.0,
    });
    ratingb2.movie = ratinga2.movie;
    userA.ratings = [ratinga1, ratinga2];
    userB.ratings = [ratingb1, ratingb2];
    const usersAll = [userA, userB];
    mockMovieRepository.find.mockResolvedValue([]);
    const result = await service.predictRatingsByUser(userA, usersAll);
    expect(result).toEqual([]);
  });

  it('should recommend based on predicted ratings for user based on user-user similarity', async () => {
    const userA = UserFactory.build();
    const ratinga1 = UserRatingsFactory.build({ user: userA, rating: 2.0 });
    const ratinga2 = UserRatingsFactory.build({ user: userA, rating: 3.0 });
    userA.ratings = [rating1, rating1a];
    const userB = UserFactory.build();
    const ratingb1 = UserRatingsFactory.build({
      user: userB,
      rating: 2.5,
    });
    ratingb1.movie = ratinga1.movie;
    const ratingb2 = UserRatingsFactory.build({
      user: userB,
      rating: 3.0,
    });
    ratingb2.movie = ratinga2.movie;
    const ratingb3 = UserRatingsFactory.build({
      user: userB,
      rating: 5.0,
    });
    userA.ratings = [ratinga1, ratinga2];
    userB.ratings = [ratingb1, ratingb2, ratingb3];
    const usersAll = [userA, userB];
    mockMovieRepository.find.mockResolvedValue([ratingb3.movie]);
    mockUserRatingsRepository.findOne.mockResolvedValue(ratingb3);
    const result = await service.recommendBasedOnPredicted(userA, usersAll);
    expect(result[0].movie).toEqual(ratingb3.movie);
  });

  it('should recommend not seen movies', async () => {
    const similarUsers = await service.findSimilarUsers(user1, users);
    const result = await service.recommendNotSeenMovies(user1, users);
    expect(similarUsers).toEqual([user2]);
    // expect(result).toEqual([rating2b.movie]);
    console.log(result);
  });

  it('should recommend movies on cold start', async () => {
    mockMovieRepository.queryBuilder.getMany.mockResolvedValue(movie2);
    const result = await service.coldStartRecommendations(user1);
    expect(mockMovieRepository.queryBuilder.where).toBeCalledWith(
      expect.anything(),
      {
        ids: user1.preferedCategories.map(c => c.id),
      },
    );
    expect(result).toEqual(movie2);
  });

  it('should recommend movies on cold start', async () => {
    mockMovieRepository.queryBuilder.getMany.mockResolvedValue(movie2);
    const result = await service.coldStartRecommendations(user1);
    expect(mockMovieRepository.queryBuilder.where).toBeCalledWith(
      expect.anything(),
      {
        ids: user1.preferedCategories.map(c => c.id),
      },
    );
    expect(result).toEqual(movie2);
  });
});
