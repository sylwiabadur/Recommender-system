import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MoviesModule } from './movies/movies.module';
import { CategoriesModule } from './categories/categories.module';
import { ConfigModule } from './config/config.module';
import { ConfigService } from './config/config.service';

@Module({
  imports: [
    UsersModule,
    MoviesModule,
    CategoriesModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useExisting: ConfigService,
    }),
    ConfigModule,
  ],
  controllers: [AppController], // control how to handle incoming requests
  providers: [AppService], // extra services to provide functionalities that can be injected, modularitys
})

//decorator - feature provided by TS

//modules are split by features in app
export class AppModule {}
