import { CreateUsersRatingDto } from './usersRatings.create.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateUsersRatingDto extends PartialType(CreateUsersRatingDto) {}
