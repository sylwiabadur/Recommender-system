import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { UsersRepoHelperService } from 'src/users/usersRepoHelper.service';
import { UserFactory } from 'src/users/__factories__/user.entity.factory';
import { UserRatingsFactory } from 'src/users/__factories__/userRatings.entity.factory';
import { MockRepository } from '../common/mockRepository';
import { Movie } from '../movies/movie.entity';
import { UsersService } from '../users/users.service';
import { UsersRatings } from '../users/usersRatings.entity';
import { MoviesService } from './movies.service';
import { MovieFactory } from './__factories__/movie.entity.factory';

describe('MoviesService', () => {
  let service: MoviesService;
  const mockMovieRepository = new MockRepository<Movie>();
  const mockUserRatingsRepository = new MockRepository<UsersRatings>();
  const mockUserRepository = new MockRepository<User>();
  const mockUsersService = {
    calculateAverageForUserId: jest.fn(),
    calculateAverageForUser: jest.fn(),
    checkIfRatedByUser: jest.fn(),
    findBestRatedByUser: jest.fn(),
  };

  const movie1 = MovieFactory.build();
  const rating1 = UserRatingsFactory.build({ movie: movie1, rating: 2.0 });
  const rating1a = UserRatingsFactory.build({ movie: movie1, rating: 3.0 });
  movie1.ratings = [rating1, rating1a];

  const movie2 = MovieFactory.build();
  const rating2 = UserRatingsFactory.build({
    movie: movie2,
    rating: 2.0,
  });
  const rating2a = UserRatingsFactory.build({
    movie: movie2,
    rating: 4.0,
  });
  movie2.ratings = [rating2, rating2a];

  const movies = [movie1, movie2];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MoviesService,
        UsersRepoHelperService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepository,
        },
        {
          provide: getRepositoryToken(UsersRatings),
          useValue: mockUserRatingsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();
    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get average rating for movie', async () => {
    const result = await service.calculateAverageForMovie(movie1);
    const avg = (Number(rating1a.rating) + Number(rating1.rating)) / 2;
    expect(result).toEqual(avg);
  });

  it('should get best rated movie', async () => {
    const result = await service.bestMovies(movies, 10);
    expect(result[0]).toEqual(movie2);
  });

  it('should get most popular movie', async () => {
    const movie3 = MovieFactory.build();
    const rating3 = UserRatingsFactory.build({
      movie: movie3,
      rating: 2.0,
      user: UserFactory.build(),
    });
    const rating3a = UserRatingsFactory.build({
      movie: movie3,
      rating: 4.0,
      user: UserFactory.build(),
    });
    const rating3b = UserRatingsFactory.build({
      movie: movie3,
      rating: 4.0,
      user: UserFactory.build(),
    });
    movie3.ratings = [rating3, rating3a, rating3b];

    const movie4 = MovieFactory.build();
    const rating4 = UserRatingsFactory.build({
      movie: movie4,
      rating: 2.0,
      user: UserFactory.build(),
    });
    const rating4a = UserRatingsFactory.build({
      movie: movie4,
      rating: 4.0,
      user: UserFactory.build(),
    });
    movie4.ratings = [rating4, rating4a];

    const movie5 = MovieFactory.build();
    const rating5 = UserRatingsFactory.build({
      movie: movie5,
      rating: 3.5,
      user: UserFactory.build(),
    });
    const rating5a = UserRatingsFactory.build({
      movie: movie5,
      rating: 4.0,
      user: UserFactory.build(),
    });
    movie5.ratings = [rating5, rating5a];

    const moviesForPopularity = [movie3, movie4, movie5];
    const result = await service.popularMovies(moviesForPopularity, 10);
    expect(result[0]).toEqual(movie3);
  });

  it('should count sum of ratings', async () => {
    const movie3 = MovieFactory.build();
    const rating3 = UserRatingsFactory.build({
      movie: movie3,
      rating: 2.0,
      user: UserFactory.build(),
    });
    const rating3a = UserRatingsFactory.build({
      movie: movie3,
      rating: 4.0,
      user: UserFactory.build(),
    });
    const rating3b = UserRatingsFactory.build({
      movie: movie3,
      rating: 4.0,
      user: UserFactory.build(),
    });
    const exampleRatings = [rating3, rating3a, rating3b];
    const result = service.sumOfRatings(exampleRatings);
    const sumOfRatings =
      Number(exampleRatings[0].rating) +
      Number(exampleRatings[1].rating) +
      Number(exampleRatings[2].rating);
    expect(result).toEqual(sumOfRatings);
  });

  it('should get last inserted', async () => {
    const movie3 = MovieFactory.build();
    const movie4 = MovieFactory.build();

    const movies = [movie3, movie4];
    mockMovieRepository.find.mockResolvedValue(movies);
    const result = await service.lastInserted(2);
    expect(result).toEqual(movies);
  });

  it('should count cosine similarity', async () => {
    const user1 = UserFactory.build();
    const user2 = UserFactory.build();
    const user3 = UserFactory.build();

    const movie3 = MovieFactory.build();
    const movie4 = MovieFactory.build();

    const rating3 = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating3.user = user1;
    rating3.movie = movie3;

    const rating3a = UserRatingsFactory.build({
      rating: 4.5,
    });
    rating3a.user = user2;
    rating3a.movie = movie3;

    const rating3b = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating3b.user = user3;
    rating3b.movie = movie3;
    movie3.ratings = [rating3, rating3a, rating3b];

    const rating4 = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating4.user = user1;
    rating4.movie = movie4;

    const rating4a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating4a.user = user2;
    rating4a.movie = movie4;
    movie4.ratings = [rating4, rating4a];

    user1.ratings = [rating3, rating4];
    user2.ratings = [rating3a, rating4a];
    user3.ratings = [rating3b];

    mockUsersService.calculateAverageForUserId.mockImplementation(
      (id: number) => {
        switch (id) {
          case user1.id:
            return 3.0;
          case user2.id:
            return 3.25;
          case user3.id:
            return 4;
          default:
            return 0;
        }
      },
    );
    const result = await service.cosineSimilarity(movie3, movie4);
    const expectedValue = 0.781;
    expect(Number(result.toPrecision(3))).toEqual(expectedValue);
  });

  it('should count pearson correlation', async () => {
    const user1 = UserFactory.build();
    const user2 = UserFactory.build();
    const user3 = UserFactory.build();

    const movie3 = MovieFactory.build();
    const movie4 = MovieFactory.build();

    const rating3 = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating3.user = user1;
    rating3.movie = movie3;

    const rating3a = UserRatingsFactory.build({
      rating: 4.5,
    });
    rating3a.user = user2;
    rating3a.movie = movie3;

    const rating3b = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating3b.user = user3;
    rating3b.movie = movie3;
    movie3.ratings = [rating3, rating3a, rating3b];

    const rating4 = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating4.user = user1;
    rating4.movie = movie4;

    const rating4a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating4a.user = user2;
    rating4a.movie = movie4;
    movie4.ratings = [rating4, rating4a];

    user1.ratings = [rating3, rating4];
    user2.ratings = [rating3a, rating4a];
    user3.ratings = [rating3b];
    mockMovieRepository.findOne.mockResolvedValue(movie3);
    mockMovieRepository.findOne.mockResolvedValue(movie4);

    mockUserRatingsRepository.queryBuilder.getRawOne.mockImplementation(
      (id: number) => {
        switch (id) {
          case movie3.id:
            return { avg: 12.5 / 3 };
          case movie4.id:
            return { avg: 3.5 };
          default:
            return { avg: 0 };
        }
      },
    );
    const result = await service.pearsonCorrelation(movie3, movie4);
    const expectedValue = 0.997;
    expect(Number(result.toPrecision(3))).toEqual(expectedValue);
  });

  //for pearson Correlation
  it('should predict ratings for user based on item-item similarity', async () => {
    const movie1 = MovieFactory.build();
    const movie2 = MovieFactory.build();
    const movie3 = MovieFactory.build();
    const userA = UserFactory.build();
    const ratinga1 = UserRatingsFactory.build({ user: userA, rating: 2.0 });
    ratinga1.movie = movie1;
    const ratinga2 = UserRatingsFactory.build({ user: userA, rating: 3.0 });
    ratinga2.movie = movie2;
    userA.ratings = [rating1, rating1a];
    const userB = UserFactory.build();
    const ratingb1 = UserRatingsFactory.build({
      user: userB,
      rating: 2.5,
    });
    ratingb1.movie = movie1;
    const ratingb2 = UserRatingsFactory.build({
      user: userB,
      rating: 3.0,
    });
    ratingb2.movie = movie2;
    const ratingb3 = UserRatingsFactory.build({
      user: userB,
      rating: 5.0,
    });
    ratingb3.movie = movie3;
    userA.ratings = [ratinga1, ratinga2];
    userB.ratings = [ratingb1, ratingb2, ratingb3];
    movie1.ratings = [ratinga1, ratingb1];
    movie2.ratings = [ratinga2, ratingb2];
    movie3.ratings = [ratingb3];
    const moviesAll = [ratingb1.movie, ratingb2.movie, ratingb3.movie];

    mockMovieRepository.findOne.mockResolvedValue(ratinga1.movie);
    mockMovieRepository.findOne.mockResolvedValue(ratinga2.movie);

    mockUserRatingsRepository.queryBuilder.getRawOne.mockImplementation(
      (id: number) => {
        switch (id) {
          case movie1.id:
            return { avg: 2.25 };
          case movie2.id:
            return { avg: 3 };
          case movie3.id:
            return { avg: 5 };
          default:
            return { avg: 0 };
        }
      },
    );
    const result = await service.predictRatingsByUser(userA, moviesAll);
    const expectedValue = 3;
    expect(Number(result[0].predictedRating.toPrecision(3))).toEqual(
      expectedValue,
    );
  });

  it('should find similar movies with similarities', async () => {
    const user1 = UserFactory.build();
    const user2 = UserFactory.build();
    const user3 = UserFactory.build();

    const movie3 = MovieFactory.build();
    const movie4 = MovieFactory.build();
    const movie5 = MovieFactory.build();

    const rating3 = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating3.user = user1;
    rating3.movie = movie3;

    const rating3a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating3a.user = user2;
    rating3a.movie = movie3;

    const rating3b = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating3b.user = user3;
    rating3b.movie = movie3;
    movie3.ratings = [rating3, rating3a, rating3b];

    const rating4 = UserRatingsFactory.build({
      rating: 2.5,
    });
    rating4.user = user1;
    rating4.movie = movie4;

    const rating4a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating4a.user = user2;
    rating4a.movie = movie4;
    movie4.ratings = [rating4, rating4a];

    const rating5 = UserRatingsFactory.build({
      rating: 2.0,
    });
    rating5.user = user1;
    rating5.movie = movie5;

    const rating5a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating5a.user = user2;
    rating5a.movie = movie5;
    movie5.ratings = [rating5, rating5a];

    user1.ratings = [rating3, rating4, rating5];
    user2.ratings = [rating3a, rating4a, rating5a];
    user3.ratings = [rating3b];
    const movies = [movie4, movie3, movie5];
    mockUserRatingsRepository.queryBuilder.getRawOne.mockImplementation(
      (id: number) => {
        switch (id) {
          case movie3.id:
            return { avg: 10 / 3 };
          case movie5.id:
            return { avg: 6 / 2 };
          case movie4.id:
            return { avg: 6.5 / 2 };
          default:
            return { avg: 0 };
        }
      },
    );

    const result = await service.findSimilarMoviesWithSimilarities(
      movie5,
      movies,
      10,
    );
    const expectedValue1 = 0.995;
    expect(Number(result[0].similarity.toPrecision(3))).toEqual(expectedValue1);
    const expectedValue2 = 0.984;
    expect(Number(result[1].similarity.toPrecision(3))).toEqual(expectedValue2);
  });

  it('should find similar movies', async () => {
    const user1 = UserFactory.build();
    const user2 = UserFactory.build();
    const user3 = UserFactory.build();

    const movie3 = MovieFactory.build();
    const movie4 = MovieFactory.build();
    const movie5 = MovieFactory.build();

    const rating3 = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating3.user = user1;
    rating3.movie = movie3;

    const rating3a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating3a.user = user2;
    rating3a.movie = movie3;

    const rating3b = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating3b.user = user3;
    rating3b.movie = movie3;
    movie3.ratings = [rating3, rating3a, rating3b];

    const rating4 = UserRatingsFactory.build({
      rating: 2.5,
    });
    rating4.user = user1;
    rating4.movie = movie4;

    const rating4a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating4a.user = user2;
    rating4a.movie = movie4;
    movie4.ratings = [rating4, rating4a];

    const rating5 = UserRatingsFactory.build({
      rating: 2.0,
    });
    rating5.user = user1;
    rating5.movie = movie5;

    const rating5a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating5a.user = user2;
    rating5a.movie = movie5;
    movie5.ratings = [rating5, rating5a];

    user1.ratings = [rating3, rating4, rating5];
    user2.ratings = [rating3a, rating4a, rating5a];
    user3.ratings = [rating3b];
    const movies = [movie4, movie3, movie5];
    const result = await service.findSimilarMovies(movie5, movies, 10);
    expect(Number(result[0].id)).toEqual(movie4.id);
  });

  it('should predict user rating for movie', async () => {
    const user1 = UserFactory.build();
    const user2 = UserFactory.build();
    const user3 = UserFactory.build();

    const movie3 = MovieFactory.build();
    const movie4 = MovieFactory.build();
    const movie5 = MovieFactory.build();

    const rating3 = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating3.user = user1;
    rating3.movie = movie3;

    const rating3a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating3a.user = user2;
    rating3a.movie = movie3;

    const rating3b = UserRatingsFactory.build({
      rating: 3.0,
    });
    rating3b.user = user3;
    rating3b.movie = movie3;
    movie3.ratings = [rating3, rating3a, rating3b];

    const rating4 = UserRatingsFactory.build({
      rating: 2.5,
    });
    rating4.user = user1;
    rating4.movie = movie4;

    const rating4a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating4a.user = user2;
    rating4a.movie = movie4;
    movie4.ratings = [rating4, rating4a];

    const rating5 = UserRatingsFactory.build({
      rating: 2.0,
    });
    rating5.user = user1;
    rating5.movie = movie5;

    const rating5a = UserRatingsFactory.build({
      rating: 4.0,
    });
    rating5a.user = user2;
    rating5a.movie = movie5;
    movie5.ratings = [rating5, rating5a];

    user1.ratings = [rating3, rating4, rating5];
    user2.ratings = [rating3a, rating4a, rating5a];
    user3.ratings = [rating3b];
    mockMovieRepository.findOne.mockResolvedValue(movie3);
    mockUserRatingsRepository.queryBuilder.getRawOne.mockImplementation(
      (id: number) => {
        switch (id) {
          case movie3.id:
            return { avg: 10 / 3 };
          case movie4.id:
            return { avg: 6.5 / 2 };
          case movie5.id:
            return { avg: 6 / 2 };
          default:
            return { avg: 0 };
        }
      },
    );
    const result = await service.predictUserRatingForMovie(user3, movie5);
    expect(result).toEqual(3);
  });
});
