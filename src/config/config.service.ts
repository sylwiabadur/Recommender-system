import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Movie } from 'src/movies/movie.entity';
import { UsersRatings } from 'src/users/usersRatings.entity';
import { Category } from 'src/categories/category.entity';

@Injectable()
export class ConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'mysql',
      host: '172.17.0.2',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'test_base',
      entities: [User, Movie, UsersRatings, Category],
      synchronize: true, //opcja do synchronizacji encji z baza danych
      logging: 'all',
      migrations: ['dist/migration/*.js'],
      cli: {
        migrationsDir: 'migration',
      },
      migrationsRun: false,
    };
  }
}
