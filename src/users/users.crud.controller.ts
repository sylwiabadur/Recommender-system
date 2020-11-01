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
import { ApiTags } from '@nestjs/swagger';
import { User } from './user.entity';
import { CreateUserDto } from './user.create.dto';
import { UpdateUserDto } from './user.update.dto';

@ApiTags('usersCrud')
@Controller('users')
export class UsersCrudController {
  constructor(private usersService: UsersService) {}

  @Get()
  async getMany(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: number): Promise<User> {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new NotFoundException();
    }
    return user;
  }

  @Delete(':id')
  async removeOne(@Param('id') id: number): Promise<void> {
    return await this.usersService.remove(id);
  }

  @Post()
  async createOne(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Patch(':id')
  async updateOne(
    @Param('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }
}
