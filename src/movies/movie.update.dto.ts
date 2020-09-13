import { CreateMovieDto } from './movie.create.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
