import * as Factory from 'factory.ts';
import * as faker from 'faker';
import { Category } from '../category.entity';

export const CategoryFactory = Factory.Sync.makeFactory<Category>({
  id: Factory.each(i => i),
  name: Factory.each(() => faker.random.word()),
  movies: [],
});
