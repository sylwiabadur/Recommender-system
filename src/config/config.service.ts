import { Injectable } from '@nestjs/common';
import { TypeOrmOptionsFactory, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Movie } from '../movies/movie.entity';
import { UsersRatings } from '../users/usersRatings.entity';
import { Category } from '../categories/category.entity';

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
      logging: process.env.NODE_ENV == 'test' ? false : 'all',
      migrations: ['dist/migration/*.js'],
      cli: {
        migrationsDir: 'migration',
      },
      migrationsRun: false,
    };
  }
}
