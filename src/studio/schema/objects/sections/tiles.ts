import { defineField, defineType } from 'sanity';
import { ThLargeIcon } from '@sanity/icons';

export default defineType({
  name: 'tiles',
  type: 'object',
  icon: ThLargeIcon,
  title: 'Tiles',
  fields: [
    defineField({
      name: 'heading',
      type: 'string',
      title: 'Heading',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
      rows: 3,
    }),
    defineField({
      name: 'tiles',
      type: 'array',
      title: 'Tiles',
      of: [
        {
          type: 'object',
          name: 'tile',
          fields: [
            defineField({
              name: 'icon',
              type: 'image',
              title: 'Icon',
              options: {
                hotspot: true,
              },
              fields: [
                defineField({
                  name: 'alt',
                  type: 'string',
                  title: 'Alternative text',
                  description: 'Important for SEO and accessibility.',
                }),
              ],
            }),
            defineField({
              name: 'title',
              type: 'string',
              title: 'Title',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              type: 'text',
              title: 'Description',
              rows: 3,
            }),
          ],
          preview: {
            select: {
              title: 'title',
              media: 'icon',
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'footer',
      type: 'object',
      title: 'Footer',
      fields: [
        defineField({
          name: 'text',
          type: 'text',
          title: 'Text',
          rows: 2,
        }),
        defineField({
          name: 'link',
          type: 'object',
          title: 'Link',
          fields: [
            defineField({
              name: 'label',
              type: 'string',
              title: 'Label',
            }),
            defineField({
              name: 'url',
              type: 'string',
              title: 'URL',
            }),
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      tiles: 'tiles',
    },
    prepare({ title, tiles }) {
      return {
        title: title || 'Untitled',
        subtitle: tiles?.length ? `${tiles.length} tiles` : 'No tiles',
        media: ThLargeIcon,
      };
    },
  },
});
