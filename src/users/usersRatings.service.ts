import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersRatings } from './usersRatings.entity';
import { CreateUsersRatingDto } from './usersRatings.create.dto';
import { UpdateUsersRatingDto } from './usersRatings.update.dto';

@Injectable()
export class UsersRatingsService {
  constructor(
    @InjectRepository(UsersRatings)
    private usersRatingsRepository: Repository<UsersRatings>,
  ) {}

  async findAllRatings(): Promise<UsersRatings[]> {
    return this.usersRatingsRepository.find();
  }

  async findRating(id: number): Promise<UsersRatings> {
    return this.usersRatingsRepository.findOne(id);
  }

  async createRating(
    id: number,
    createUsersRatingDto: CreateUsersRatingDto,
  ): Promise<UsersRatings> {
    const createdObj = this.usersRatingsRepository.create({
      user: { id },
      ...createUsersRatingDto,
    });
    return await this.usersRatingsRepository.save(createdObj);
  }

  async deleteRating(id: number): Promise<void> {
    await this.usersRatingsRepository.delete(id);
  }

  async updateRating(
    id: number,
    ratingId: number,
    updateUsersRatingDto: UpdateUsersRatingDto,
  ): Promise<UsersRatings> {
    const updatedRating = await this.findRating(ratingId);
    if (!updatedRating) {
      throw new NotFoundException();
    }
    this.usersRatingsRepository.merge(updatedRating, {
      user: { id },
      ...updateUsersRatingDto,
    });
    return await this.usersRatingsRepository.save(updatedRating);
  }
}
