import { MigrationInterface, QueryRunner, getRepository } from 'typeorm';
import { User } from 'src/users/user.entity';
import moviesJson from 'src/common/moviesShort.json';
import usersJson from 'src/common/usersShort.json';
import ratingsJson from 'src/common/ratingsShort.json';
import { Movie } from 'src/movies/movie.entity';
import { UsersRatings } from 'src/users/usersRatings.entity';
import { Category } from 'src/categories/category.entity';

export class Seeder1599327829483 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const categories = new Map<string, Category>();
    const movieRepository = getRepository(Movie);
    const categoryRepository = getRepository(Category);
    const movies = [];
    for (const element of moviesJson) {
      const movieCategories = [];
      for (const categoryName of element.genres.split('|')) {
        if (categories.has(categoryName)) {
          movieCategories.push(categories.get(categoryName));
        } else {
          const cat = await categoryRepository.save(
            categoryRepository.create({
              name: categoryName,
            }),
          );
          movieCategories.push(cat);
          categories.set(categoryName, cat);
        }
      }
      movies.push(
        movieRepository.create({
          title: element.title,
          externalId: element.movieId,
          categories: movieCategories,
        }),
      );
    }
    await queryRunner.manager.save(movies);

    const userRepository = getRepository(User);
    const users = [];
    for (const element of usersJson) {
      const prefCategories = [];
      for (const categoryName of element.genres.split('|')) {
        if (categories.has(categoryName)) {
          prefCategories.push(categories.get(categoryName));
        } else {
          const cat = await categoryRepository.save(
            categoryRepository.create({
              name: categoryName,
            }),
          );
          prefCategories.push(cat);
          categories.set(categoryName, cat);
        }
      }
      users.push(
        userRepository.create({
          name: element.name,
          surname: element.surname,
          externalId: element.userId,
          preferredCategories: prefCategories,
        }),
      );
    }
    await queryRunner.manager.save(users);

    const ratingRepository = getRepository(UsersRatings);
    const ratings = [];
    for (const ratingElem of ratingsJson) {
      const rating = ratingRepository.create({
        user: await queryRunner.manager.findOne(User, {
          where: { externalId: ratingElem.userId },
        }),
        movie: await queryRunner.manager.findOne(Movie, {
          where: { externalId: ratingElem.movieId },
        }),
        rating: ratingElem.rating,
      });
      ratings.push(rating);
    }
    await queryRunner.manager.save(ratings);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
