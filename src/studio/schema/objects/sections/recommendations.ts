import { defineField, defineType } from 'sanity';
import { ThumbsUpIcon } from '@sanity/icons';

export default defineType({
  name: 'recommendations',
  type: 'object',
  icon: ThumbsUpIcon,
  title: 'Recommendations',
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
      name: 'cta',
      type: 'object',
      title: 'Write a Review CTA',
      fields: [
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
    defineField({
      name: 'recommendations',
      type: 'array',
      title: 'Recommendations',
      of: [
        {
          type: 'object',
          name: 'recommendation',
          fields: [
            defineField({
              name: 'author',
              type: 'object',
              title: 'Author',
              fields: [
                defineField({
                  name: 'name',
                  type: 'string',
                  title: 'Name',
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'jobTitle',
                  type: 'string',
                  title: 'Job Title',
                }),
                defineField({
                  name: 'image',
                  type: 'image',
                  title: 'Image',
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
              ],
            }),
            defineField({
              name: 'content',
              type: 'text',
              title: 'Recommendation',
              rows: 4,
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'author.name',
              subtitle: 'author.jobTitle',
              media: 'author.image',
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      recommendations: 'recommendations',
    },
    prepare({ title, recommendations }) {
      return {
        title: title || 'Untitled',
        subtitle: recommendations?.length
          ? `${recommendations.length} recommendations`
          : 'No recommendations',
        media: ThumbsUpIcon,
      };
    },
  },
});
