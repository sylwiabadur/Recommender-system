import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository } from 'src/common/mockRepository';
import { Movie } from 'src/movies/movie.entity';
import { UserRatingsFactory } from 'src/users/__factories__/userRatings.entity.factory';
import { User } from './user.entity';
import { UsersRatings } from './usersRatings.entity';
import { UsersRepoHelperService } from './usersRepoHelper.service';
import { UserFactory } from './__factories__/user.entity.factory';

describe('UsersRepoHelperService', () => {
  let service: UsersRepoHelperService;
  const mockUserRepository = new MockRepository<User>();
  const mockMovieRepository = new MockRepository<Movie>();
  const mockUserRatingsRepository = new MockRepository<UsersRatings>();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
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
    service = module.get<UsersRepoHelperService>(UsersRepoHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get user with relations', async () => {
    const user1 = UserFactory.build();
    const rating1 = UserRatingsFactory.build({ user: user1 });
    user1.ratings = [rating1];
    const user2 = UserFactory.build();
    const rating2 = UserRatingsFactory.build({ user: user2 });
    user2.ratings = [rating2];
    const users = [user1, user2];

    mockUserRepository.findOne.mockResolvedValue(users[0]);

    const result = await service.getUserWithRatingsRelation(users[0].id);

    expect(mockUserRepository.findOne).toBeCalledWith(
      users[0].id,
      expect.anything(),
    );
    expect(result).toEqual(users[0]);
  });

  it('should get all users with relations', async () => {
    const user1 = UserFactory.build();
    const rating1 = UserRatingsFactory.build({ user: user1 });
    user1.ratings = [rating1];
    const user2 = UserFactory.build();
    const rating2 = UserRatingsFactory.build({ user: user2 });
    user2.ratings = [rating2];
    const users = [user1, user2];

    mockUserRepository.find.mockResolvedValue(users);

    const result = await service.getManyUsersWithRatingsRelation();

    expect(mockUserRepository.find).toBeCalledWith(expect.anything());
    expect(result).toEqual(users);
  });

  it('should get one user', async () => {
    const user1 = UserFactory.build();
    const rating1 = UserRatingsFactory.build({ user: user1 });
    user1.ratings = [rating1];
    const user2 = UserFactory.build();
    const rating2 = UserRatingsFactory.build({ user: user2 });
    user2.ratings = [rating2];
    const users = [user1, user2];

    mockUserRepository.findOne.mockResolvedValue(users[0]);

    const result = await service.getOneUser(users[0].id);

    expect(mockUserRepository.findOne).toBeCalledWith(users[0].id);
    expect(result).toEqual(users[0]);
  });

  it('should get all users', async () => {
    const user1 = UserFactory.build();
    const rating1 = UserRatingsFactory.build({ user: user1 });
    user1.ratings = [rating1];
    const user2 = UserFactory.build();
    const rating2 = UserRatingsFactory.build({ user: user2 });
    user2.ratings = [rating2];
    const users = [user1, user2];

    mockUserRepository.find.mockResolvedValue(users);

    const result = await service.getAllUsers();

    expect(mockUserRepository.find).toBeCalledWith();
    expect(result).toEqual(users);
  });
});
