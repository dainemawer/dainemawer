import { defineArrayMember, defineField } from 'sanity';
import cardGrid from '../objects/sections/cardGrid';
import cta from '../objects/sections/cta';
import divider from '../objects/sections/divider';
import hero from '../objects/sections/hero';
import mediaText from '../objects/sections/mediaText';
import postList from '../objects/sections/postList';
import subscribe from '../objects/sections/subscribe';
import tiles from '../objects/sections/tiles';
import recommendations from '../objects/sections/recommendations';
import content from '../objects/sections/content';

const pageSectionsObjects = [
  cardGrid,
  cta,
  divider,
  hero,
  mediaText,
  postList,
  subscribe,
  tiles,
  recommendations,
  content,
];

export default defineField({
  name: 'pageSections',
  title: 'Page Sections',
  type: 'array',
  of: pageSectionsObjects.map(({ name }) => defineArrayMember({ type: name })),
  group: 'content',
});
