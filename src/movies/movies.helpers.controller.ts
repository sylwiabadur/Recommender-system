import { Controller, NotFoundException, Get, Param } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ApiTags } from '@nestjs/swagger';
import { Movie } from './movie.entity';
import { MoviesRepoHelperService } from './moviesRepoHelper.service';

@ApiTags('moviesHelpers')
@Controller('movies')
export class MoviesHelpersController {
  constructor(
    private moviesService: MoviesService,
    private moviesRepoHelper: MoviesRepoHelperService,
  ) {}

  @Get(':id/similarMovies')
  async getSimilarMovies(@Param('id') id: number): Promise<Movie[]> {
    const myMovie = await this.moviesRepoHelper.getMovieWithRatingsRelation(id);
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.findSimilarMovies(myMovie, movies);
  }

  @Get(':id/averageRating')
  async getAverage(@Param('id') id: number): Promise<number> {
    const movie = await this.moviesRepoHelper.getMovieWithRatingsRelation(id);
    if (!movie) {
      throw new NotFoundException();
    }
    return this.moviesService.calculateAverageForMovie(movie);
  }
}
