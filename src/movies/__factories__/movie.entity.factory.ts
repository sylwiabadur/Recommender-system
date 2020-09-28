import * as Factory from 'factory.ts';
import * as faker from 'faker';
import { Movie } from '../movie.entity';

export const MovieFactory = Factory.Sync.makeFactory<Movie>({
  id: Factory.each(i => i),
  externalId: Factory.each(i => i),
  title: Factory.each(() => faker.random.word()),
  ratings: [],
  categories: [],
});
