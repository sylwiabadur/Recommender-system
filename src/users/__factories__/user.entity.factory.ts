import * as Factory from 'factory.ts';
import { User } from '../user.entity';
import * as faker from 'faker';

export const UserFactory = Factory.Sync.makeFactory<User>({
  id: Factory.each(i => i),
  name: Factory.each(() => faker.name.firstName()),
  surname: Factory.each(() => faker.name.lastName()),
  externalId: Factory.each(i => i),
  ratings: [],
  preferredCategories: [],
});
