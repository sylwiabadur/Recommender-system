import { Category } from '../categories/category.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { UsersRatings } from './usersRatings.entity';

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

  @ManyToMany(type => Category, {eager: true})
  @JoinTable()
  preferedCategories: Category[];
  }