import {
  Controller,
  NotFoundException,
  Get,
  Param,
  Delete,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { MoviesService } from './movies.service';
import { ApiTags } from '@nestjs/swagger';
import { Movie } from './movie.entity';
import { CreateMovieDto } from './movie.create.dto';
import { UpdateMovieDto } from './movie.update.dto';
import { MoviesRepoHelperService } from './moviesRepoHelper.service';

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(
    private moviesService: MoviesService,
    private moviesRepoHelper: MoviesRepoHelperService,
  ) {}

  @Get()
  async getMany(): Promise<Movie[]> {
    return await this.moviesService.findAll();
  }

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

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Movie> {
    const movie = await this.moviesService.findOne(id);
    if (!movie) {
      throw new NotFoundException();
    }
    return movie;
  }

  @Get(':id/similarMovies')
  async getSimilarMovies(@Param('id') id: number): Promise<Movie[]> {
    const myMovie = await this.moviesRepoHelper.getMovieWithRatingsRelation(id);
    const movies = await this.moviesRepoHelper.getManyMoviesWithRatingsRelation();
    return this.moviesService.findSimilarMovies(myMovie, movies);
  }

  @Get(':id/averageRate')
  async getAverage(@Param('id') id: number): Promise<number> {
    const movie = await this.moviesRepoHelper.getMovieWithRatingsRelation(id);
    if (!movie) {
      throw new NotFoundException();
    }
    return this.moviesService.calculateAverageForMovie(movie);
  }

  @Delete(':id')
  async removeOne(@Param('id') id: number): Promise<void> {
    return await this.moviesService.remove(id);
  }

  @Post()
  async createOne(@Body() createMovieDto: CreateMovieDto): Promise<Movie> {
    return await this.moviesService.create(createMovieDto);
  }

  @Patch(':id')
  async updateOne(
    @Param('id') id: number,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<Movie> {
    return await this.moviesService.update(id, updateMovieDto);
  }
}
