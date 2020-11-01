import { Controller, Get } from '@nestjs/common';
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
  @Get('bestMovies')
  async getBestMovies(): Promise<Movie[]> {
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.bestMovies(movies);
  }

  @ApiOperation({ summary: 'Get most popular movies' })
  @Get('popularMovies')
  async getPopularMovies(): Promise<Movie[]> {
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.popularMovies(movies);
  }
}
