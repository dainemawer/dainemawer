import { Image } from 'next-sanity/image';
import { urlForImage } from '@/lib/sanity/client/utils';
import Link from 'next/link';
import type { TilesSection } from './types';
import { MoveRight } from 'lucide-react';

export default function TilesSection({ section }: { section: TilesSection }) {
  return (
    <section className="py-10 md:py-14 bg-white">
      <div className="container mx-auto">
        <div className="mx-auto mb-12">
          <h2 className="text-3xl max-w-3xl md:text-6xl font-semibold mb-4">{section.heading}</h2>
          {section.description && (
            <p className="text-2xl max-w-5xl text-gray-400">{section.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {section.tiles?.map((tile) => (
            <div
              key={tile._key}
              className="bg-white dark:bg-black rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100"
            >
              {tile.icon?.asset?._ref && (
                <div className="w-12 h-12 mb-4">
                  <Image
                    src={urlForImage(tile.icon)?.width(48).height(48).url() as string}
                    alt={tile.icon.alt || ''}
                    width={48}
                    height={48}
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="text-xl font-semibold mb-2">{tile.title}</h3>
              {tile.description && <p className="text-gray-600">{tile.description}</p>}
            </div>
          ))}
        </div>

        {section.footer && (
          <div className="mt-12">
            {section.footer.text && (
              <p className="text-gray-500 text-xl mb-4">{section.footer.text}</p>
            )}
            {section.footer.link?.url && (
              <Link
                href={section.footer.link.url}
                className="text-primary flex items-center font-medium gap-2 hover:underline"
              >
                {section.footer.link.label}
                <MoveRight strokeWidth={1.5} className="w-5 h-5" />
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
