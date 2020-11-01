import {
  Controller,
  Post,
  Body,
  Param,
  Delete,
  Get,
  NotFoundException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Category } from './category.entity';
import { CreateCategoryDto } from './category.create.dto';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Retreive many categories' })
  @Get()
  async getMany(): Promise<Category[]> {
    return await this.categoriesService.findAll();
  }

  @ApiOperation({ summary: 'Retreive one category' })
  @Get(':id')
  async getOne(@Param('id') id: number): Promise<Category> {
    const movie = await this.categoriesService.findOne(id);
    if (!movie) {
      throw new NotFoundException();
    }
    return movie;
  }

  @ApiOperation({ summary: 'Delete one category' })
  @Delete(':id')
  async removeOne(@Param('id') id: number): Promise<void> {
    return await this.categoriesService.remove(id);
  }

  @ApiOperation({ summary: 'Create one category' })
  @Post()
  async createOne(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return await this.categoriesService.create(createCategoryDto);
  }
}
