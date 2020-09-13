import {
  Controller,
  Get,
  Delete,
  Param,
  NotFoundException,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { User } from './user.entity';
import { CreateUserDto } from './user.create.dto';
import { UpdateUserDto } from './user.update.dto';
import { CreateUsersRatingDto } from './usersRatings.create.dto';
import { UsersRatings } from './usersRatings.entity';
import { UpdateUsersRatingDto } from './usersRatings.update.dto';
import { Movie } from 'src/movies/movie.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getMany(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Delete(':id')
  async removeOne(@Param('id') id: number): Promise<void> {
    return await this.usersService.remove(id);
  }

  @Post()
  async createOne(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Post(':id/ratings')
  async createUsersRating(
    @Param('id') id: number,
    @Body() createUsersRatingDto: CreateUsersRatingDto,
  ): Promise<UsersRatings> {
    return await this.usersService.createRating(id, createUsersRatingDto);
  }

  @Patch(':id')
  async updateOne(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/ratings/:ratingId')
  async updateUsersRating(
    @Param('id') id: number,
    @Param('ratingId') ratingId: number,
    @Body() updateUsersRatingDto: UpdateUsersRatingDto,
  ): Promise<UsersRatings> {
    return await this.usersService.updateRating(
      id,
      ratingId,
      updateUsersRatingDto,
    );
  }

  @Get(':id/similarUser')
  async getTheMostSimilarUser(@Param('id') id: number): Promise<User[]> {
    return this.usersService.findSimilarUsers(id);
  }

  @Get(':id/recommendMovies')
  async getRecommendedMovies(@Param('id') id: number): Promise<Movie[]> {
    return this.usersService.recommendNotSeenMovies(id);
  }

  @Get(':id/bestrated')
  async getBestRatedMovies(@Param('id') id: number): Promise<UsersRatings[]> {
    return this.usersService.findBestRatedByUser(id);
  }
}
