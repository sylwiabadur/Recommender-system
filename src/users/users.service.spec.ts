import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository } from 'src/common/mockRepository';
import { Movie } from 'src/movies/movie.entity';
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

  const user1 = UserFactory.build();
  const rating1 = UserRatingsFactory.build({ user: user1, rating: 2.0 });
  const rating1a = UserRatingsFactory.build({ user: user1, rating: 3.0 });
  user1.ratings = [rating1, rating1a];
  const movie1 = rating1.movie;
  const user2 = UserFactory.build();
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

  it('should recommend not seen movies', async () => {
    const similarUsers = await service.findSimilarUsers(user1, users);
    const result = await service.recommendNotSeenMovies(user1, users);
    expect(similarUsers).toEqual([user2]);
    // expect(result).toEqual([rating2b.movie]);
    console.log(result);
  });
});
