import { Optional } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './../categories/category.entity';
export class CreateUserDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  externalId: number;

  @ApiProperty()
  surname: string;

  @ApiProperty({ type: [Category], required: false })
  @Optional()
  preferedCategories: Category[];
}
