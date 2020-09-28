import { forwardRef, Module } from '@nestjs/common';
import { MoviesController } from './movies.controller';
import { MoviesService } from './movies.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './movie.entity';
import { UsersModule } from '../users/users.module';
import { MoviesRepoHelperService } from './moviesRepoHelper.service';

@Module({
  imports: [TypeOrmModule.forFeature([Movie]), forwardRef(() => UsersModule)],
  controllers: [MoviesController],
  providers: [MoviesService, MoviesRepoHelperService],
  exports: [TypeOrmModule, MoviesService, MoviesRepoHelperService],
})
export class MoviesModule {}
