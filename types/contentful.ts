import { Document } from '@contentful/rich-text-types';

export interface Article {
	title: string;
	slug: string;
	content: Document;
	excerpt: string;
	isFeatured: boolean;
	featuredImage?: {
		url: string;
		alt: string;
	};
	publishedAt: string;
	updatedAt: string;
}

export interface Work {
	title: string;
	slug: string;
	description: Document;
	featuredImage?: {
		url: string;
		alt: string;
	};
	technologies: string[];
	projectUrl?: string;
	githubUrl?: string;
	completedAt: string;
}

export interface MenuItem {
	label: string;
	url: string;
	order: number;
	parent?: {
		sys: {
			id: string;
		};
	};
	children?: MenuItem[];
}

export interface Menu {
	name: string;
	items: MenuItem[];
}

export interface Page {
	title: string;
	slug: string;
	content: Document;
	seoTitle?: string;
	seoDescription?: string;
	seoImage?: {
		url: string;
		alt: string;
	};
	isPublished: boolean;
}
