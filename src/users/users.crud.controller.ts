import {
  Controller,
  Get,
  Delete,
  Param,
  NotFoundException,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from './user.entity';
import { CreateUserDto } from './user.create.dto';
import { UpdateUserDto } from './user.update.dto';
@ApiTags('usersCrud')
@Controller('users')
export class UsersCrudController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Retreive many users' })
  @Get()
  async getMany(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Retreive one user' })
  @Get(':id')
  async getOne(@Param('id') id: number): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @ApiOperation({ summary: 'Delete one user' })
  @Delete(':id')
  async removeOne(@Param('id') id: number): Promise<void> {
    return await this.usersService.remove(id);
  }

  @ApiOperation({ summary: 'Create one user' })
  @Post()
  async createOne(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Update one user' })
  @Patch(':id')
  async updateOne(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }
}
