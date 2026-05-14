import { Factory } from 'rosie';
import { faker } from '@faker-js/faker';
import { User } from '../../src/lib/models/User';

export const UserFactory = new Factory<User>()
  .attr('id', () => faker.string.uuid())
  .attr('email', () => faker.internet.email())
  .attr('password', () => faker.internet.password())
  .attr('name', () => faker.person.fullName())
  .attr('createdAt', () => new Date())
  .attr('updatedAt', () => new Date());
