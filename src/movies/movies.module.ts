import { forwardRef, Module } from '@nestjs/common';
import { MoviesCrudController } from './movies.crud.controller';
import { MoviesService } from './movies.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './movie.entity';
import { UsersModule } from '../users/users.module';
import { MoviesRepoHelperService } from './moviesRepoHelper.service';
import { MoviesColdStartController } from './movies.coldStart.controller';
import { MoviesHelpersController } from './movies.helpers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Movie]), forwardRef(() => UsersModule)],
  controllers: [
    MoviesCrudController,
    MoviesColdStartController,
    MoviesHelpersController,
  ],
  providers: [MoviesService, MoviesRepoHelperService],
  exports: [TypeOrmModule, MoviesService, MoviesRepoHelperService],
})
export class MoviesModule {}
