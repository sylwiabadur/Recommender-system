import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Movie } from 'src/movies/movie.entity';

@Entity()
export class UsersRatings {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    type => User,
    user => user.ratings,
  )
  user: User;

  @ManyToOne(
    type => Movie,
    movie => movie.ratings,
  )
  movie: Movie;

  @Column('decimal', { precision: 2, scale: 1 })
  rating: number;
}
