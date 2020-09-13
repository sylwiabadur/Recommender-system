import { ApiProperty } from '@nestjs/swagger';
import Identifiable from 'src/common/identifiable.dto';
export class CreateUsersRatingDto {
  @ApiProperty({ type: Identifiable })
  user: Identifiable;

  @ApiProperty({ type: Identifiable })
  movie: Identifiable;

  @ApiProperty()
  rating: number;
}
