import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { UsersRepoHelperService } from 'src/users/usersRepoHelper.service';
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

  const movie1 = MovieFactory.build();
  const rating1 = UserRatingsFactory.build({ user: movie1, rating: 2.0 });
  const rating1a = UserRatingsFactory.build({ movie: movie1, rating: 3.0 });
  movie1.ratings = [rating1, rating1a];
  const movie2 = MovieFactory.build();
  const rating2 = UserRatingsFactory.build({
    movie: movie2,
    rating: 2.0,
  });

  movie2.ratings = [rating2];
  const movies = [movie1, movie2];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MoviesService,
        UsersService,
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
});
