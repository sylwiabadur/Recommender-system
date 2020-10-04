import { NotFoundException } from '@nestjs/common';
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

  const user1 = UserFactory.build();
  const rating1 = UserRatingsFactory.build({ user: user1 });
  user1.ratings = [rating1];
  const movie1 = rating1.movie;
  const user2 = UserFactory.build();
  const rating2 = UserRatingsFactory.build({ user: user2 });
  user2.ratings = [rating2];
  const users = [user1, user2];

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
    mockUserRepository.findOne.mockResolvedValue(users[0]);
    const result = await service.getUserWithRatingsRelation(users[0].id);

    expect(mockUserRepository.findOne).toBeCalledWith(
      users[0].id,
      expect.anything(),
    );
    expect(result).toEqual(users[0]);
  });

  it('should not get movie with relations and throw notfoundexception', async () => {
    mockUserRepository.findOne.mockResolvedValue(null);
    const result = service.getUserWithRatingsRelation(users[0].id);

    expect(result).rejects.toThrow(NotFoundException);
  });

  it('should get all users with relations', async () => {
    mockUserRepository.find.mockResolvedValue(users);
    const result = await service.getManyUsersWithRatingsRelation();

    expect(mockUserRepository.find).toBeCalledWith(expect.anything());
    expect(result).toEqual(users);
  });

  it('should get one user', async () => {
    mockUserRepository.findOne.mockResolvedValue(users[0]);
    const result = await service.getOneUser(users[0].id);

    expect(mockUserRepository.findOne).toBeCalledWith(users[0].id);
    expect(result).toEqual(users[0]);
  });

  it('should get all users', async () => {
    mockUserRepository.find.mockResolvedValue(users);
    const result = await service.getAllUsers();

    expect(mockUserRepository.find).toBeCalledWith();
    expect(result).toEqual(users);
  });

  it('should get rating where movie and user', async () => {
    mockUserRatingsRepository.findOne.mockResolvedValue(rating1);
    const result = await service.getRatingWhereMovieAndUser(movie1, user1);

    expect(mockUserRatingsRepository.findOne).toBeCalledWith({
      where: { movie: movie1, user: user1 },
    });
    expect(result).toEqual(rating1);
  });

  it('should not get rating where movie and user and throw exception', async () => {
    mockUserRatingsRepository.findOne.mockResolvedValue(null);

    const result = service.getRatingWhereMovieAndUser(movie1, user1);
    expect(result).rejects.toThrow(NotFoundException);
  });

  it('should get rating where movie and user', async () => {
    mockMovieRepository.findOne.mockResolvedValue(movie1);
    const result = await service.getMovieWhere(movie1.id);

    expect(mockMovieRepository.findOne).toBeCalledWith({
      where: {
        id: movie1.id,
      },
    });
    expect(result).toEqual(movie1);
  });
});
