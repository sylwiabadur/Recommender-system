import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
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
}
