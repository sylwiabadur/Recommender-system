import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MockRepository } from 'src/common/mockRepository';
import { UserRatingsFactory } from 'src/users/__factories__/userRatings.entity.factory';
import { Movie } from './movie.entity';
import { MoviesRepoHelperService } from './moviesRepoHelper.service';
import { MovieFactory } from './__factories__/movie.entity.factory';

describe('MoviesRepoHelperService', () => {
  let service: MoviesRepoHelperService;
  const mockMovieRepository = new MockRepository<Movie>();

  const movie1 = MovieFactory.build();
  const rating1 = UserRatingsFactory.build({ movie: movie1 });
  movie1.ratings = [rating1];
  const movie2 = MovieFactory.build();
  const rating2 = UserRatingsFactory.build({ movie: movie2 });
  movie2.ratings = [rating2];
  const movies = [movie1, movie2];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MoviesRepoHelperService,
        {
          provide: getRepositoryToken(Movie),
          useValue: mockMovieRepository,
        },
      ],
    }).compile();
    service = module.get<MoviesRepoHelperService>(MoviesRepoHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get movie with relations', async () => {
    mockMovieRepository.findOne.mockResolvedValue(movies[0]);
    const result = await service.getMovieWithRatingsRelation(movies[0].id);

    expect(mockMovieRepository.findOne).toBeCalledWith(
      movies[0].id,
      expect.anything(),
    );
    expect(result).toEqual(movies[0]);
  });

  it('should not get movie with relations and throw notfoundexception', async () => {
    mockMovieRepository.findOne.mockResolvedValue(null);
    const result = service.getMovieWithRatingsRelation(movies[0].id);

    expect(result).rejects.toThrow(NotFoundException);
  });

  it('should get all movies with relations', async () => {
    mockMovieRepository.find.mockResolvedValue(movies);
    const result = await service.getManyMoviesWithRatingsRelation();

    expect(mockMovieRepository.find).toBeCalledWith(expect.anything());
    expect(result).toEqual(movies);
  });

  it('should get all movies with relations and exception', async () => {
    mockMovieRepository.find.mockResolvedValue(null);
    expect(service.getManyMoviesWithRatingsRelation()).rejects.toThrow(
      NotFoundException,
    );
  });
});
