import { Controller, Param, Post, Body, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { CreateUsersRatingDto } from './usersRatings.create.dto';
import { UsersRatings } from './usersRatings.entity';
import { UpdateUsersRatingDto } from './usersRatings.update.dto';

@ApiTags('usersRatingsCrud')
@Controller('users')
export class UsersRatingsCrudController {
  constructor(private usersService: UsersService) {}

  @Post(':id/ratings')
  async createUsersRating(
    @Param('id') id: number,
    @Body() createUsersRatingDto: CreateUsersRatingDto,
  ): Promise<UsersRatings> {
    return await this.usersService.createRating(id, createUsersRatingDto);
  }

  @Patch(':id/ratings/:ratingId')
  async updateUsersRating(
    @Param('id') id: number,
    @Param('ratingId') ratingId: number,
    @Body() updateUsersRatingDto: UpdateUsersRatingDto,
  ): Promise<UsersRatings> {
    return await this.usersService.updateRating(
      id,
      ratingId,
      updateUsersRatingDto,
    );
  }
}
