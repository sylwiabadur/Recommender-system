import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersRatings } from './usersRatings.entity';
import { Movie } from 'src/movies/movie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UsersRatings, Movie])],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
