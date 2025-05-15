import type { Content } from '@/sanity.types';
import { type PortableTextBlock } from 'next-sanity';
import CustomPortableText from '@/components/modules/PortableText';

export default function Content({ section }: { section: Content }) {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="prose prose-lg max-w-none">
          <CustomPortableText value={section.content as PortableTextBlock[]} />
        </div>
      </div>
    </section>
  );
}
