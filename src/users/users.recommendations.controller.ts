import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Movie } from '../movies/movie.entity';
import { MoviesService } from '../movies/movies.service';
import { UsersRepoHelperService } from './usersRepoHelper.service';
import { MoviesRepoHelperService } from '../movies/moviesRepoHelper.service';

@ApiTags('usersRecommendations')
@Controller('users')
export class UsersRecommendationsController {
  constructor(
    private usersService: UsersService,
    private moviesService: MoviesService,
    private usersRepoHelper: UsersRepoHelperService,
    private moviesRepoHelper: MoviesRepoHelperService,
  ) {}

  @ApiOperation({ summary: 'Get cold start recommendations for user' })
  @Get(':id/coldStart/:numOfMovies')
  async getColdStart(
    @Param('id') id: number,
    @Param('numOfMovies') numOfMovies: number,
  ): Promise<Movie[]> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    return this.usersService.coldStartRecommendations(user, numOfMovies);
  }

  @ApiOperation({ summary: 'Get not seen movies by user' })
  @Get(':id/recommendNotSeenMovies/:numOfMovies')
  async getRecommendedNotSeenMovies(
    @Param('id') id: number,
    @Param('numOfMovies') numOfMovies: number,
  ): Promise<Movie[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.recommendNotSeenMovies(myUser, users, numOfMovies);
  }

  @ApiOperation({
    summary: 'Get favourite movies rated by similar users to user',
  })
  @Get(':id/similarUsersFavs/:numOfUsers')
  async getSimilarUsersFavs(
    @Param('id') id: number,
    @Param('numOfUsers') numOfUsers: number,
  ): Promise<Movie[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.similarUsersFavs(myUser, users, numOfUsers);
  }

  @ApiOperation({
    summary: 'Get predicted ratings based on user-user similarity',
  })
  @Get(':id/predictedRatingsUserSimilarity')
  async getPredictionsForNotSeenUser(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.predictRatingsByUser(myUser, users);
  }

  @ApiOperation({
    summary: 'Get predicted ratings based on item-item similarity',
  })
  @Get(':id/predictedRatingsItemSimilarity')
  async getPredictionsForNotSeenMovie(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const allMovies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.predictRatingsByUser(myUser, allMovies);
  }

  @ApiOperation({
    summary: 'Get recommendations based on user-user similarity',
  })
  @Get(':id/recommendBasedOnPredictions')
  async getRecommendationBasedOnPrediction(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.recommendBasedOnPredicted(myUser, users);
  }
}
