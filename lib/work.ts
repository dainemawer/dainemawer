interface WorkItem {
	slug: string
	title: string
	description: string
	date: string
	content: string
    coverImage: string
	client: {
		name: string
		logo: string
	}
	technologies: string[]
	image: string
}

const dummyWork: WorkItem[] = [
	{
		slug: 'enterprise-design-system',
		title: 'Enterprise Design System',
		description: 'Built a scalable design system for a Fortune 500 company, improving development velocity by 40%.',
		date: '2024-02-15',
        coverImage: '/work/design-system.jpg',
		content: `
# Enterprise Design System

## Overview

Led the development of a comprehensive design system for a Fortune 500 company, serving over 100 developers across multiple teams.

## Challenge

The client was facing several challenges:
- Inconsistent UI across applications
- Slow development velocity
- High maintenance costs
- Poor developer experience

## Solution

We implemented a modern design system that:
1. Used a component-first approach
2. Implemented proper documentation
3. Included comprehensive testing
4. Provided clear contribution guidelines

## Results

- 40% increase in development velocity
- 60% reduction in UI bugs
- 50% decrease in maintenance costs
- 90% developer satisfaction rate
		`,
		client: {
			name: 'Enterprise Corp',
			logo: '/clients/enterprise-corp.svg',
		},
		technologies: ['React', 'TypeScript', 'Storybook', 'Jest', 'Tailwind CSS'],
		image: '/work/design-system.jpg',
	},
	{
		slug: 'e-commerce-platform',
		title: 'E-commerce Platform',
		description: 'Developed a high-performance e-commerce platform handling $100M+ in annual revenue.',
		date: '2024-01-20',
        coverImage: '/work/ecommerce.jpg',
		content: `
# E-commerce Platform

## Overview

Built a modern e-commerce platform for a leading retail brand, handling over $100M in annual revenue.

## Challenge

The client needed:
- High performance at scale
- Seamless user experience
- Robust error handling
- Real-time inventory updates

## Solution

We implemented:
1. Server-side rendering for SEO
2. Real-time inventory management
3. Optimized checkout flow
4. Comprehensive analytics

## Results

- 99.9% uptime
- 2x conversion rate
- 50% reduction in cart abandonment
- 3x faster page loads
		`,
		client: {
			name: 'Retail Brand',
			logo: '/clients/retail-brand.svg',
		},
		technologies: ['Next.js', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
		image: '/work/ecommerce.jpg',
	},
]

export async function getWorkBySlug(slug: string): Promise<WorkItem | null> {
	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 100))

	const work = dummyWork.find(work => work.slug === slug)
	return work || null
}

export async function getAllWork(): Promise<WorkItem[]> {
	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 100))

	return dummyWork
}
