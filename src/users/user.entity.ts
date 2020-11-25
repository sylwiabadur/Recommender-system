import { Category } from '../categories/category.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UsersRatings } from './usersRatings.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  externalId: number;

  @Column()
  name: string;

  @Column()
  surname: string;

  @OneToMany(
    type => UsersRatings,
    rating => rating.user,
  )
  ratings: UsersRatings[];

  @ManyToMany(type => Category)
  @ApiProperty({ type: () => Category })
  @JoinTable()
  preferredCategories: Category[];
}
