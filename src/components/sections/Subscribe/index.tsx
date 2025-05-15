import PortableText from '../../modules/PortableText';
import { type PortableTextBlock } from 'next-sanity';
import SubscribeForm from './SubscribeForm';
import type { SubscribeSection } from '../types';

export default function SubscribeSection({ section }: { section: SubscribeSection }) {
  return (
    <section className="py-10 md:py-60 container mx-auto">
      <div className="">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-6xl font-semibold mb-4">{section?.heading}</h2>
          <div className="">
            <PortableText value={section.content as PortableTextBlock[]} />
          </div>
          <SubscribeForm section={section} />
          <p className="text-sm italic mt-4 text-gray-500">
            You’ll hear from me just once a month — no fluff, no spam.
          </p>
        </div>
      </div>
    </section>
  );
}
