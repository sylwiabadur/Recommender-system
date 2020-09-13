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

@ApiTags('movies')
@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) {}

  @Get()
  async getMany(): Promise<Movie[]> {
    return await this.moviesService.findAll();
  }

  @Get('bestMovies')
  async getBestMovies(): Promise<Movie[]> {
    return this.moviesService.bestMovies();
  }

  @Get('popularMovies')
  async getPopularMovies(): Promise<Movie[]> {
    return this.moviesService.popularMovies();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Movie> {
    const movie = await this.moviesService.findOne(id);
    if (!movie) {
      throw new NotFoundException();
    }
    return movie;
  }

  @Get(':id/averageRate')
  async getAverage(@Param('id') id: number): Promise<number> {
    return this.moviesService.calculateAverageRate(id);
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
