import request from 'supertest';
import { Test } from '@nestjs/testing';
import { UsersModule } from '../src/users/users.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MockRepository } from '../src/common/mockRepository';
import { User } from '../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersRatings } from '../src/users/usersRatings.entity';
import { Movie } from '../src/movies/movie.entity';
import { UserRatingsFactory } from '../src/users/__factories__/userRatings.entity.factory';
import { UserFactory } from '../src/users/__factories__/user.entity.factory';

describe('UserRatings', () => {
  let app: INestApplication;
  const mockUserRepository = new MockRepository<User>();
  const mockMovieRepository = new MockRepository<Movie>();
  const mockUserRatingsRepository = new MockRepository<UsersRatings>();
  const userRatings = UserRatingsFactory.buildList(10);
  const users = UserFactory.buildList(10);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [UsersModule],
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

  it(`/GET usersRatings`, () => {
    mockUserRatingsRepository.find.mockResolvedValue(userRatings);
    return request(app.getHttpServer())
      .get('/users/ratings')
      .expect(200)
      .expect(userRatings);
  });

  it(`/GET users/0`, () => {
    mockUserRatingsRepository.findOne.mockResolvedValue(userRatings[0]);
    return request(app.getHttpServer())
      .get('/users/ratings/' + userRatings[0].id)
      .expect(200)
      .expect(userRatings[0])
      .then(() => {
        expect(mockUserRatingsRepository.findOne).toBeCalledWith(
          userRatings[0].id.toString(),
        );
      });
  });

  it(`/POST usersRatings`, () => {
    mockUserRatingsRepository.create.mockImplementation(user => user);
    mockUserRatingsRepository.save.mockResolvedValue(userRatings[0]);
    return request(app.getHttpServer())
      .post('/users/0/ratings')
      .send(userRatings[0])
      .expect(201)
      .expect(userRatings[0])
      .then(() => {
        expect(mockUserRatingsRepository.create).toBeCalledWith(userRatings[0]);
        expect(mockUserRatingsRepository.save).toBeCalledWith(userRatings[0]);
      });
  });

  it(`/DELETE usersRatings/0`, () => {
    mockUserRatingsRepository.delete.mockResolvedValue(userRatings[0].id);
    return request(app.getHttpServer())
      .delete('/users/ratings/' + userRatings[0].id)
      .expect(200)
      .expect('')
      .then(() => {
        expect(mockUserRatingsRepository.delete).toBeCalledWith(
          userRatings[0].id.toString(),
        );
      });
  });

  it(`/PATCH usersRatings`, () => {
    mockUserRatingsRepository.findOne.mockResolvedValue(userRatings[0]);
    mockUserRatingsRepository.save.mockResolvedValue(userRatings[1]);
    return request(app.getHttpServer())
      .patch('/users/' + users[0].id + '/ratings/' + userRatings[0].id)
      .send(userRatings[1])
      .expect(200)
      .expect(userRatings[1])
      .then(() => {
        expect(mockUserRatingsRepository.merge).toBeCalledWith(userRatings[0], {
          user: users[0],
          ...userRatings[1],
        });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
