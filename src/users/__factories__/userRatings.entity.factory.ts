import * as Factory from 'factory.ts';
import { MovieFactory } from '../../movies/__factories__/movie.entity.factory';
import { UsersRatings } from '../usersRatings.entity';
import { UserFactory } from './user.entity.factory';

export const UserRatingsFactory = Factory.Sync.makeFactory<UsersRatings>({
  id: Factory.each(i => i),
  user: Factory.each(() => UserFactory.build()),
  movie: Factory.each(() => MovieFactory.build()),
  rating: Factory.each(i => i),
});
