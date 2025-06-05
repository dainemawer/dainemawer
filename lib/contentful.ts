import { createClient, EntryCollection, Entry, EntrySkeletonType } from 'contentful';
import { Article, Work, Menu, Page } from '@/types/contentful';
import { cookies } from 'next/headers';

const space = process.env.CONTENTFUL_SPACE_ID!;
const accessToken = process.env.CONTENTFUL_DELIVERY_API_KEY!;
const previewAccessToken = process.env.CONTENTFUL_PREVIEW_API_KEY!;

export const contentfulClient = createClient({
	space,
	accessToken,
});

export const contentfulPreviewClient = createClient({
	space,
	accessToken: previewAccessToken,
	host: 'preview.contentful.com',
});

async function getClient() {
	const cookieStore = await cookies();
	const isPreview = (cookieStore.get('preview'))?.value === 'true';
	return isPreview ? contentfulPreviewClient : contentfulClient;
}

// Example generic fetcher with type param
export async function fetchEntries<T extends EntrySkeletonType>(
	contentType: string,
	options: {
		skip?: number;
		limit?: number;
		order?: string;
		'fields.category'?: string;
	} = {}
): Promise<EntryCollection<T>> {
	const client = await getClient();
	return client.getEntries<T>({
		content_type: contentType,
		skip: options.skip,
		limit: options.limit,
		order: options.order,
		'fields.category': options['fields.category'],
	});
}

export async function fetchEntryBySlug<T extends EntrySkeletonType>(
	contentType: string,
	slug: string
): Promise<Entry<T> | undefined> {
	const client = await getClient();
	const entries = await client.getEntries<T>({
		content_type: contentType,
		'fields.slug': slug,
		limit: 1,
	});

	return entries.items[0];
}

export async function fetchArticles(options: {
	page?: number;
	limit?: number;
} = {}): Promise<{
	items: EntryCollection<Article>['items'];
	total: number;
	totalPages: number;
}> {
	const limit = options.limit || 9; // Default to 9 items per page
	const skip = ((options.page || 1) - 1) * limit;

	const entries = await fetchEntries<Article>('article', {
		skip,
		limit,
		order: '-fields.publishDate', // Sort by published date, newest first
	});

	return {
		items: entries.items,
		total: entries.total,
		totalPages: Math.ceil(entries.total / limit),
	};
}

export async function fetchArticleBySlug(slug: string): Promise<Entry<Article> | undefined> {
	return fetchEntryBySlug<Article>('article', slug);
}

export async function fetchWorkItems(options: {
	page?: number;
	limit?: number;
	category?: string;
} = {}): Promise<{
	items: EntryCollection<Work>['items'];
	total: number;
	totalPages: number;
}> {
	const limit = options.limit || 6; // Default to 6 items per page
	const skip = ((options.page || 1) - 1) * limit;

	const entries = await fetchEntries<Work>('work', {
		skip,
		limit,
		order: '-fields.timeline', // Sort by date, newest first
		'fields.category': options.category,
	});

	return {
		items: entries.items,
		total: entries.total,
		totalPages: Math.ceil(entries.total / limit),
	};
}

export async function fetchWorkBySlug(slug: string): Promise<Entry<Work> | undefined> {
	return fetchEntryBySlug<Work>('work', slug);
}

export async function fetchMenu(menuName: string): Promise<Entry<Menu> | undefined> {
	const client = await getClient();
	const entries = await client.getEntries<Menu>({
		content_type: 'menu',
		'fields.name': menuName,
		limit: 1,
	});

	return entries.items[0];
}

export async function fetchPage(slug: string): Promise<Entry<Page> | undefined> {
	const client = await getClient();
	const entries = await client.getEntries<Page>({
		content_type: 'page',
		'fields.slug': slug,
		limit: 1,
	});

	return entries.items[0];
}

export async function fetchAllPages(): Promise<EntryCollection<Page>> {
	const client = await getClient();
	return client.getEntries<Page>({
		content_type: 'page',
		order: 'fields.title',
	});
}
