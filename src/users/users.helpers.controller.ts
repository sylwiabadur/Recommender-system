import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from './user.entity';
import { UsersRatings } from './usersRatings.entity';
import { UsersRepoHelperService } from './usersRepoHelper.service';

@ApiTags('usersHelpers')
@Controller('users')
export class UsersHelpersController {
  constructor(
    private usersService: UsersService,
    private usersRepoHelper: UsersRepoHelperService,
  ) {}

  @ApiOperation({ summary: 'Get average rating for one user' })
  @Get(':id/averageRating')
  async getAverage(@Param('id') id: number): Promise<number> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    return this.usersService.calculateAverageForUser(myUser);
  }

  @ApiOperation({ summary: 'Get best ratings by user' })
  @Get(':id/bestRatings/:numOfRatings')
  async getBestRatedMovies(
    @Param('id') id: number,
    @Param('numOfRatings') numOfRatings: number,
  ): Promise<UsersRatings[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    return this.usersService.findBestRatedByUser(myUser, numOfRatings);
  }

  @ApiOperation({ summary: 'Get many similar users to user' })
  @Get(':id/similarUsers/:numOfUsers')
  async getTheMostSimilarUser(
    @Param('id') id: number,
    @Param('numOfUsers') numOfUsers: number,
  ): Promise<User[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.findSimilarUsers(myUser, users, numOfUsers);
  }
}
