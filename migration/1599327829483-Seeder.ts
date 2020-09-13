import { MigrationInterface, QueryRunner, getRepository } from 'typeorm';
import { User } from 'src/users/user.entity';
import moviesJson from 'src/common/movies.json';
import usersJson from 'src/common/users.json';
import ratingsJson from 'src/common/ratings.json';
import { Movie } from 'src/movies/movie.entity';
import { UsersRatings } from 'src/users/usersRatings.entity';

export class Seeder1599327829483 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const movieRepository = getRepository(Movie);

    for (const element of moviesJson) {
      const movie = movieRepository.create({
        title: element.title,
        externalId: element.movieId,
      });
      await queryRunner.manager.save(movie);
    }

    const userRepository = getRepository(User);

    for (const element of usersJson) {
      const user = userRepository.create({
        name: element.name,
        surname: element.surname,
        externalId: element.userId,
      });
      await queryRunner.manager.save(user);
    }

    const ratingRepository = getRepository(UsersRatings);

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
      await queryRunner.manager.save(rating);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
