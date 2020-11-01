import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
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

  @Get(':id/averageRating')
  async getAverage(@Param('id') id: number): Promise<number> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    return this.usersService.calculateAverageForUser(myUser);
  }

  @Get(':id/similarUsers')
  async getTheMostSimilarUser(@Param('id') id: number): Promise<User[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    const users = await this.usersRepoHelper.getManyUsersWithRatingsRelation();
    return this.usersService.findSimilarUsers(myUser, users);
  }

  @Get(':id/bestRatedBy')
  async getBestRatedMovies(@Param('id') id: number): Promise<UsersRatings[]> {
    const myUser = await this.usersRepoHelper.getUserWithRatingsRelation(id);
    return this.usersService.findBestRatedByUser(myUser);
  }
}
