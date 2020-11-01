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
import { Movie } from '../movies/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { UsersRepoHelperService } from './usersRepoHelper.service';
import { MoviesRepoHelperService } from '../movies/moviesRepoHelper.service';
import { Category } from 'src/categories/category.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private moviesService: MoviesService,
    private usersRepoHelper: UsersRepoHelperService,
    private moviesRepoHelper: MoviesRepoHelperService,
  ) {}

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

  @Get(':id/average')
  async getAverage(@Param('id') id: number): Promise<number> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    return this.usersService.calculateAverageForUser(myUser);
  }

  @Get(':id/similarUser')
  async getTheMostSimilarUser(@Param('id') id: number): Promise<User[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.findSimilarUsers(myUser, users);
  }

  @Get(':id/recommendNotSeenMovies')
  async getRecommendedNotSeenMovies(@Param('id') id: number): Promise<Movie[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.recommendNotSeenMovies(myUser, users);
  }

  @Get(':id/coldstart')
  async getColdStart(@Param('id') id: number): Promise<Movie[]> {
    const myUser = await this.getOne(id);
    return this.usersService.coldStartRecommendations(myUser);
  }

  @Get(':id/bestrated')
  async getBestRatedMovies(@Param('id') id: number): Promise<UsersRatings[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    return this.usersService.findBestRatedByUser(myUser);
  }

  @Get(':id/predictMoviesUserSimilarity')
  async getPredictionsForNotSeenUser(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.predictRatingsByUser(myUser, users);
  }

  @Get(':id/predictMoviesItemSimilarity')
  async getPredictionsForNotSeenMovie(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    console.log('CNTROLLER');
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const allMovies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.predictRatingsByUser(myUser, allMovies);
  }

  @Get(':id/recommendBasedOnPredictions')
  async getRecommendationBasedOnPrediction(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.recommendBasedOnPredicted(myUser, users);
  }

  @Get(':id/similarUsersFavs')
  async getSimilarUsersFavs(@Param('id') id: number): Promise<Movie[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.similarUsersFavs(myUser, users);
  }
}
