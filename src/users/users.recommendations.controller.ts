import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
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

  @Get(':id/coldStart')
  async getColdStart(@Param('id') id: number): Promise<Movie[]> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    return this.usersService.coldStartRecommendations(user);
  }

  @Get(':id/recommendNotSeenMovies')
  async getRecommendedNotSeenMovies(@Param('id') id: number): Promise<Movie[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.recommendNotSeenMovies(myUser, users);
  }

  @Get(':id/similarUsersFavs')
  async getSimilarUsersFavs(@Param('id') id: number): Promise<Movie[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.similarUsersFavs(myUser, users);
  }

  @Get(':id/predictedRatingsUserSimilarity')
  async getPredictionsForNotSeenUser(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.predictRatingsByUser(myUser, users);
  }

  @Get(':id/predictedRatingsItemSimilarity')
  async getPredictionsForNotSeenMovie(
    @Param('id') id: number,
  ): Promise<{ movie: Movie; predictedRating: number }[]> {
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
}
