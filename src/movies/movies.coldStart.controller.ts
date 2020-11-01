import { Controller, Get } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ApiTags } from '@nestjs/swagger';
import { Movie } from './movie.entity';
import { MoviesRepoHelperService } from './moviesRepoHelper.service';

@ApiTags('moviesColdStart')
@Controller('movies')
export class MoviesColdStartController {
  constructor(
    private moviesService: MoviesService,
    private moviesRepoHelper: MoviesRepoHelperService,
  ) {}

  @Get('bestMovies')
  async getBestMovies(): Promise<Movie[]> {
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.bestMovies(movies);
  }

  @Get('popularMovies')
  async getPopularMovies(): Promise<Movie[]> {
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.popularMovies(movies);
  }
}
