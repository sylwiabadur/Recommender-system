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

@ApiTags('moviesCrud')
@Controller('movies')
export class MoviesCrudController {
  constructor(private moviesService: MoviesService) {}

  @Get()
  async getMany(): Promise<Movie[]> {
    return await this.moviesService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Movie> {
    const movie = await this.moviesService.findOne(id);
    if (!movie) {
      throw new NotFoundException();
    }
    return movie;
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
