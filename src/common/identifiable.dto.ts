import { ApiProperty } from '@nestjs/swagger';

export default class Identifiable {
  @ApiProperty()
  id: number;
}
