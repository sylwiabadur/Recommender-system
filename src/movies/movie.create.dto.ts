import { ApiProperty } from '@nestjs/swagger';
import Identifiable from 'src/common/identifiable.dto';
export class CreateMovieDto {
  @ApiProperty()
  externalId: number;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: [Identifiable] })
  categories: Identifiable[];
}