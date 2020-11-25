import {
  Controller,
  Param,
  Post,
  Body,
  Patch,
  Get,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateUsersRatingDto } from './usersRatings.create.dto';
import { UsersRatings } from './usersRatings.entity';
import { UpdateUsersRatingDto } from './usersRatings.update.dto';
import { UsersRatingsService } from './usersRatings.service';

@ApiTags('usersRatingsCrud')
@Controller('users')
export class UsersRatingsCrudController {
  constructor(private usersRatingsService: UsersRatingsService) {}

  @ApiOperation({ summary: 'Retreive many ratings' })
  @Get('/ratings')
  async getMany(): Promise<UsersRatings[]> {
    return await this.usersRatingsService.findAllRatings();
  }

  @ApiOperation({ summary: 'Retreive one rating' })
  @Get('/ratings/:ratingId')
  async getOne(@Param('ratingId') id: number): Promise<UsersRatings> {
    const rating = await this.usersRatingsService.findRating(id);
    if (!rating) {
      throw new NotFoundException();
    }
    return rating;
  }

  @ApiOperation({ summary: 'Delete one rating' })
  @Delete('/ratings/:id')
  async removeOne(@Param('id') id: number): Promise<void> {
    return await this.usersRatingsService.deleteRating(id);
  }

  @ApiOperation({ summary: 'Create one rating' })
  @Post(':id/ratings')
  async createUsersRating(
    @Param('id') id: number,
    @Body() createUsersRatingDto: CreateUsersRatingDto,
  ): Promise<UsersRatings> {
    return await this.usersRatingsService.createRating(
      id,
      createUsersRatingDto,
    );
  }

  @ApiOperation({ summary: 'Update one rating' })
  @Patch(':id/ratings/:ratingId')
  async updateUsersRating(
    @Param('id') id: number,
    @Param('ratingId') ratingId: number,
    @Body() updateUsersRatingDto: UpdateUsersRatingDto,
  ): Promise<UsersRatings> {
    return await this.usersRatingsService.updateRating(
      id,
      ratingId,
      updateUsersRatingDto,
    );
  }
}
