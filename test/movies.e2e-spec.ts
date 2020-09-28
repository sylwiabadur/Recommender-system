import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MockRepository } from '../src/common/mockRepository';
import { User } from '../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersRatings } from '../src/users/usersRatings.entity';
import { Movie } from '../src/movies/movie.entity';
import { MovieFactory } from '../src/movies/__factories__/movie.entity.factory';
import { UsersModule } from '../src/users/users.module';
import { MoviesModule } from '../src/movies/movies.module';

describe('Movie', () => {
  let app: INestApplication;
  const mockUserRepository = new MockRepository<User>();
  const mockMovieRepository = new MockRepository<Movie>();
  const mockUserRatingsRepository = new MockRepository<UsersRatings>();
  const movies = MovieFactory.buildList(10);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule, MoviesModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .overrideProvider(getRepositoryToken(Movie))
      .useValue(mockMovieRepository)
      .overrideProvider(getRepositoryToken(UsersRatings))
      .useValue(mockUserRatingsRepository)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it(`/GET movies`, () => {
    mockMovieRepository.find.mockResolvedValue(movies);
    return request(app.getHttpServer())
      .get('/movies')
      .expect(200)
      .expect(movies);
  });

  it(`/GET movies/0`, () => {
    mockMovieRepository.findOne.mockResolvedValue(movies[0]);
    return request(app.getHttpServer())
      .get('/movies/' + movies[0].id)
      .expect(200)
      .expect(movies[0])
      .then(() => {
        expect(mockMovieRepository.findOne).toBeCalledWith(
          movies[0].id.toString(),
        );
      });
  });

  it(`/POST movies`, () => {
    mockMovieRepository.create.mockImplementation(movie => movie);
    mockMovieRepository.save.mockResolvedValue(movies[0]);
    return request(app.getHttpServer())
      .post('/movies')
      .send(movies[0])
      .expect(201)
      .expect(movies[0])
      .then(() => {
        expect(mockMovieRepository.create).toBeCalledWith(movies[0]);
        expect(mockMovieRepository.save).toBeCalledWith(movies[0]);
      });
  });

  it(`/DELETE movies/0`, () => {
    mockMovieRepository.delete.mockResolvedValue(movies[0].id);
    return request(app.getHttpServer())
      .delete('/movies/' + movies[0].id)
      .expect(200)
      .expect('')
      .then(() => {
        expect(mockMovieRepository.delete).toBeCalledWith(
          movies[0].id.toString(),
        );
      });
  });

  it(`/PATCH movies/0`, () => {
    mockMovieRepository.findOne.mockResolvedValue(movies[0]);
    mockMovieRepository.save.mockResolvedValue(movies[1]);

    return request(app.getHttpServer())
      .patch('/movies/' + movies[0].id)
      .send(movies[1])
      .expect(200)
      .expect(movies[1])
      .then(() => {
        expect(mockMovieRepository.merge).toBeCalledWith(movies[0], movies[1]);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
