import request from 'supertest';
import { Test } from '@nestjs/testing';
import { UsersModule } from '../src/users/users.module';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MockRepository } from '../src/common/mockRepository';
import { User } from '../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersRatings } from '../src/users/usersRatings.entity';
import { Movie } from '../src/movies/movie.entity';
import { UserFactory } from '../src/users/__factories__/user.entity.factory';

describe('User', () => {
  let app: INestApplication;
  const mockUserRepository = new MockRepository<User>();
  const mockMovieRepository = new MockRepository<Movie>();
  const mockUserRatingsRepository = new MockRepository<UsersRatings>();
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

  it(`/GET users`, () => {
    mockUserRepository.find.mockResolvedValue(users);
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect(users);
  });

  it(`/GET users/0`, () => {
    mockUserRepository.findOne.mockResolvedValue(users[0]);
    return request(app.getHttpServer())
      .get('/users/' + users[0].id)
      .expect(200)
      .expect(users[0])
      .then(() => {
        expect(mockUserRepository.findOne).toBeCalledWith(
          users[0].id.toString(),
        );
      });
  });

  it(`/POST users`, () => {
    mockUserRepository.create.mockImplementation(user => user);
    mockUserRepository.save.mockResolvedValue(users[0]);
    return request(app.getHttpServer())
      .post('/users')
      .send(users[0])
      .expect(201)
      .expect(users[0])
      .then(() => {
        expect(mockUserRepository.create).toBeCalledWith(users[0]);
        expect(mockUserRepository.save).toBeCalledWith(users[0]);
      });
  });

  it(`/DELETE users/0`, () => {
    mockUserRepository.delete.mockResolvedValue(users[0].id);
    return request(app.getHttpServer())
      .delete('/users/' + users[0].id)
      .expect(200)
      .expect('')
      .then(() => {
        expect(mockUserRepository.delete).toBeCalledWith(
          users[0].id.toString(),
        );
      });
  });

  it(`/PATCH users/0`, () => {
    mockUserRepository.findOne.mockResolvedValue(users[0]);
    mockUserRepository.save.mockResolvedValue(users[1]);

    return request(app.getHttpServer())
      .patch('/users/' + users[0].id)
      .send(users[1])
      .expect(200)
      .expect(users[1])
      .then(() => {
        expect(mockUserRepository.merge).toBeCalledWith(users[0], users[1]);
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
