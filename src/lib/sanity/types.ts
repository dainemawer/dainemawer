import { PortableTextBlock } from 'next-sanity';

export interface Post {
  _type: 'post';
  _id: string;
  title: string;
  slug?: string | null;
  excerpt?: string;
  image?: {
    _type: 'image';
    asset: {
      _ref: string;
      _type: 'reference';
    };
    alt?: string;
  };
  categories?: {
    _type: 'category';
    title: string;
    slug: string;
  }[];
  date: string;
  author?: {
    _type: 'person';
    name: string;
    image?: {
      _type: 'image';
      asset: {
        _ref: string;
        _type: 'reference';
      };
      alt?: string;
    };
  };
  wordCount: number;
}

export interface PostsArchiveQueryResult {
  total: number;
  results: Post[];
}

export interface PostQueryResult extends Post {
  content: PortableTextBlock[];
  seo?: {
    title?: string;
    description?: string;
    noIndex?: boolean;
  };
}

export type BlogPageQueryResult = {
  _type: 'blogPage';
  _id: string;
  name?: string;
  seo?: {
    title?: string;
    description?: string;
    noIndex?: boolean;
  } | null;
} | null;

export interface SettingsQueryResult {
  _type: 'settings';
  title: string;
  description?: string;
  menu?: {
    _key: string;
    text: string;
    link?: {
      _type: 'link';
      type: 'internal' | 'external';
      external?: string;
      internal?: {
        _type: string;
        _id: string;
        slug: string;
      };
      openInNewTab?: boolean;
    };
    childMenu?: {
      _key: string;
      text: string;
      link?: {
        _type: 'link';
        type: 'internal' | 'external';
        external?: string;
        internal?: {
          _type: string;
          _id: string;
          slug: string;
        };
        openInNewTab?: boolean;
      };
    }[];
  }[];
}

export interface ContentSection {
  _type: 'content';
  content: PortableTextBlock[];
}
