import { defineField, defineType } from 'sanity';
import { TextIcon } from '@sanity/icons';

export default defineType({
  name: 'content',
  title: 'Content',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      content: 'content',
    },
    prepare() {
      return {
        title: 'Content Section',
        subtitle: 'Rich text content',
        media: TextIcon,
      };
    },
  },
});
