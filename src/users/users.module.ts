import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersRatings } from './usersRatings.entity';
import { MoviesModule } from '../movies/movies.module';
import { UsersRepoHelperService } from './usersRepoHelper.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UsersRatings]), MoviesModule],
  controllers: [UsersController],
  providers: [UsersService, UsersRepoHelperService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
