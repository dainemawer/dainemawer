import { type PortableTextBlock } from 'next-sanity';
import PortableText from '@/components/modules/PortableText';
import ButtonsGroup from '../modules/ButtonsGroup';
import type { HeroSection } from './types';

export default function HeroSection({ section }: { section: HeroSection }) {
  return (
    <section className="py-10 md:py-48 bg-white dark:bg-black">
      <div className="container mx-auto">
        <div className="grid gap-12 items-center">
          <div className="flex flex-col items-center">
            <h1 className="text-4xl text-center md:text-7xl font-semibold mb-6">
              {section?.heading}
            </h1>
            <PortableText
              className="max-w-4xl text-center"
              value={section.text as PortableTextBlock[]}
            />

            {section?.buttons && section?.buttons.length ? (
              <div className="mt-8 gap-4 flex">
                {section?.buttons.length > 1 && (
                  <ButtonsGroup size="xl" className="w-full md:w-auto" buttons={section?.buttons} />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
