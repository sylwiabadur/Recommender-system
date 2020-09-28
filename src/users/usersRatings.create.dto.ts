import { ApiProperty } from '@nestjs/swagger';
import Identifiable from '../common/identifiable.dto';
export class CreateUsersRatingDto {
  @ApiProperty({ type: Identifiable })
  user: Identifiable;

  @ApiProperty({ type: Identifiable })
  movie: Identifiable;

  @ApiProperty()
  rating: number;
}
