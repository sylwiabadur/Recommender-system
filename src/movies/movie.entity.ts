import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { UsersRatings } from 'src/users/usersRatings.entity';
import { Category } from 'src/categories/category.entity';

@Entity()
export class Movie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  externalId: number;

  @Column()
  title: string;

  @OneToMany(
    type => UsersRatings,
    ratings => ratings.movie,
    // { eager: true },
  )
  ratings: UsersRatings[];

  @ManyToMany(type => Category)
  @JoinTable()
  categories: Category[];
}
