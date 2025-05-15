'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { urlForImage } from '@/lib/sanity/client/utils';
import { cn } from '@/lib/utils';
import { MoveLeft, MoveRight } from 'lucide-react';

type Author = {
  name: string;
  jobTitle?: string;
  image?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
    alt?: string;
  };
};

type Recommendation = {
  author: Author;
  content: string;
};

type RecommendationsSection = {
  heading: string;
  description?: string;
  cta?: {
    text: string;
    link?: {
      label?: string;
      url?: string;
    };
  };
  recommendations: Recommendation[];
};

export default function Recommendations({ section }: { section: RecommendationsSection }) {
  const { heading, description, cta, recommendations } = section;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = 400; // Adjust this value to control scroll distance
    const newScrollLeft =
      direction === 'left'
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="mx-auto mb-12">
          <h2 className="text-3xl max-w-4xl md:text-6xl font-semibold mb-4">{heading}</h2>
          {description && <p className="text-2xl max-w-5xl text-gray-400">{description}</p>}
          {cta?.link?.url && (
            <a
              href={cta.link.url}
              className="text-primary text-lg flex items-center font-medium gap-2 hover:underline mt-2"
            >
              Write a Review
              <MoveRight strokeWidth={1.5} className="w-5 h-5" />
            </a>
          )}
        </div>

        <div className="space-y-8">
          {/* Scroll container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto pb-8 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex-none w-[300px] md:w-[400px] snap-start">
                <div className="bg-white dark:bg-black border border-gray-200 p-6 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    {recommendation.author.image?.asset?._ref && (
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <Image
                          src={
                            urlForImage(recommendation.author.image)?.width(96).height(96).url() ||
                            ''
                          }
                          alt={recommendation.author.image.alt || recommendation.author.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{recommendation.author.name}</h3>
                      {recommendation.author.jobTitle && (
                        <p className="text-sm text-gray-600">{recommendation.author.jobTitle}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700">{recommendation.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => scroll('left')}
              className={cn(
                'p-3 rounded-full bg-white dark:bg-black shadow-lg border border-gray-200 hover:bg-gray-50 transition-opacity duration-200',
                showLeftButton ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
              aria-label="Scroll left"
            >
              <MoveLeft strokeWidth={1.5} className="w-6 h-6" />
            </button>
            <button
              onClick={() => scroll('right')}
              className={cn(
                'p-3 rounded-full bg-white dark:bg-black shadow-lg border border-gray-200 hover:bg-gray-50 transition-opacity duration-200',
                showRightButton ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
              aria-label="Scroll right"
            >
              <MoveRight strokeWidth={1.5} className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
