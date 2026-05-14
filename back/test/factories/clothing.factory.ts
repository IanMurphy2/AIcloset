import { Factory } from 'rosie';
import { faker } from '@faker-js/faker';
import { Clothing } from '../../src/lib/models/Clothing';

export const ClothingFactory = new Factory<Clothing>()
  .attr('id', () => faker.string.uuid())
  .attr('imageUrl', () => faker.image.url())
  .attr('description', () => faker.commerce.productDescription())
  .attr('category', () => faker.helpers.arrayElement(['remeras', 'pantalones', 'zapatillas']))
  .attr('color', () => faker.color.human())
  .attr('createdAt', () => new Date());