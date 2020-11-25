import { Controller, Get, Param } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Movie } from './movie.entity';
import { MoviesRepoHelperService } from './moviesRepoHelper.service';

@ApiTags('moviesColdStart')
@Controller('movies')
export class MoviesColdStartController {
  constructor(
    private moviesService: MoviesService,
    private moviesRepoHelper: MoviesRepoHelperService,
  ) {}

  @ApiOperation({ summary: 'Get best rated movies' })
  @Get('bestMovies/:numOfMovies')
  async getBestMovies(
    @Param('numOfMovies') numOfMovies: number,
  ): Promise<Movie[]> {
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.bestMovies(movies, numOfMovies);
  }

  @ApiOperation({ summary: 'Get last inserted movies' })
  @Get('latest/:numOfMovies')
  async getLastInserted(
    @Param('numOfMovies') numOfMovies: number,
  ): Promise<Movie[]> {
    return this.moviesService.lastInserted(numOfMovies);
  }

  @ApiOperation({ summary: 'Get most popular movies' })
  @Get('popularMovies/:numOfMovies')
  async getPopularMovies(
    @Param('numOfMovies') numOfMovies: number,
  ): Promise<Movie[]> {
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.popularMovies(movies, numOfMovies);
  }
}
