import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MockRepository } from '../src/common/mockRepository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../src/categories/category.entity';
import { CategoryFactory } from '../src/categories/__factories__/category.entity.factory';
import { CategoriesModule } from '../src/categories/categories.module';

describe('User', () => {
  let app: INestApplication;
  const mockCategoryRepository = new MockRepository<Category>();
  const categories = CategoryFactory.buildList(10);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CategoriesModule],
    })
      .overrideProvider(getRepositoryToken(Category))
      .useValue(mockCategoryRepository)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it(`/GET categories`, () => {
    mockCategoryRepository.find.mockResolvedValue(categories);
    return request(app.getHttpServer())
      .get('/categories')
      .expect(200)
      .expect(categories);
  });

  it(`/GET categories/0`, () => {
    mockCategoryRepository.findOne.mockResolvedValue(categories[0]);
    return request(app.getHttpServer())
      .get('/categories/' + categories[0].id)
      .expect(200)
      .expect(categories[0])
      .then(() => {
        expect(mockCategoryRepository.findOne).toBeCalledWith(
          categories[0].id.toString(),
        );
      });
  });

  it(`/GET categories/0 expect Not found`, () => {
    mockCategoryRepository.findOne.mockResolvedValue(null);
    return request(app.getHttpServer())
      .get('/categories/' + categories[0].id)
      .expect(404);
  });

  it(`/POST categories`, () => {
    mockCategoryRepository.create.mockImplementation(category => category);
    mockCategoryRepository.save.mockResolvedValue(categories[0]);
    return request(app.getHttpServer())
      .post('/categories')
      .send(categories[0])
      .expect(201)
      .expect(categories[0])
      .then(() => {
        expect(mockCategoryRepository.create).toBeCalledWith(categories[0]);
        expect(mockCategoryRepository.save).toBeCalledWith(categories[0]);
      });
  });

  it(`/DELETE categories/0`, () => {
    mockCategoryRepository.delete.mockResolvedValue(categories[0].id);
    return request(app.getHttpServer())
      .delete('/categories/' + categories[0].id)
      .expect(200)
      .expect('')
      .then(() => {
        expect(mockCategoryRepository.delete).toBeCalledWith(
          categories[0].id.toString(),
        );
      });
  });

  it(`/PATCH categories/0 expect Not Found`, () => {
    mockCategoryRepository.findOne.mockResolvedValue(null);

    return request(app.getHttpServer())
      .patch('/categories/' + categories[0].id)
      .send(categories[1])
      .expect(404);
  });

  afterAll(async () => {
    await app.close();
  });
});
