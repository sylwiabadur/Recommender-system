import { Module } from '@nestjs/common';
import { UsersCrudController } from './users.crud.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersRatings } from './usersRatings.entity';
import { MoviesModule } from '../movies/movies.module';
import { UsersRepoHelperService } from './usersRepoHelper.service';
import { UsersHelpersController } from './users.helpers.controller';
import { UsersRatingsCrudController } from './users.ratings.crud.controller';
import { UsersRecommendationsController } from './users.recommendations.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UsersRatings]), MoviesModule],
  controllers: [
    UsersCrudController,
    UsersRatingsCrudController,
    UsersHelpersController,
    UsersRecommendationsController,
  ],
  providers: [UsersService, UsersRepoHelperService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
