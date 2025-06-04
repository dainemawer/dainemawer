interface BlogPost {
	slug: string
	title: string
	description: string
	date: string
	content: string
	author: {
		name: string
		image: string
	}
}

const dummyPosts: BlogPost[] = [
	{
		slug: 'scaling-design-systems',
		title: 'Scaling Design Systems Without Slowing Down',
		description: 'Learn how to scale your design system while maintaining velocity and developer happiness.',
		date: '2024-03-15',
		content: `
# Scaling Design Systems Without Slowing Down

Design systems are crucial for maintaining consistency and velocity in large applications. However, as they grow, they can become a bottleneck instead of an accelerator.

## The Challenge

When design systems grow too large or complex, they can:
- Slow down development velocity
- Create maintenance overhead
- Lead to inconsistent implementations
- Frustrate developers

## The Solution

Here's how we can scale design systems effectively:

1. **Modular Architecture**
   - Break down components into smaller, focused pieces
   - Use composition over inheritance
   - Implement proper versioning

2. **Documentation First**
   - Write documentation before code
   - Include usage examples
   - Document edge cases and limitations

3. **Performance Optimization**
   - Implement code splitting
   - Use tree shaking
   - Optimize bundle size

4. **Developer Experience**
   - Provide clear APIs
   - Include TypeScript types
   - Add proper error messages

## Conclusion

By following these principles, we can create design systems that scale with our applications while maintaining developer happiness and velocity.
		`,
		author: {
			name: 'Daine Mawer',
			image: '/profile.jpg',
		},
	},
	{
		slug: 'frontend-architecture-dx',
		title: 'Frontend Architecture for DX and Performance',
		description: 'A deep dive into frontend architecture patterns that improve both developer experience and application performance.',
		date: '2024-03-10',
		content: `
# Frontend Architecture for DX and Performance

Building a frontend architecture that balances developer experience with performance is no easy feat. Here's how we can achieve both.

## Key Considerations

1. **Build System**
   - Fast builds
   - Hot module replacement
   - TypeScript support

2. **Code Organization**
   - Clear folder structure
   - Consistent patterns
   - Easy to navigate

3. **Performance**
   - Code splitting
   - Lazy loading
   - Bundle optimization

## Implementation

Let's look at some practical examples of how to implement these patterns in your application.
		`,
		author: {
			name: 'Daine Mawer',
			image: '/profile.jpg',
		},
	},
]

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 100))

	const post = dummyPosts.find(post => post.slug === slug)
	return post || null
}

export async function getAllPosts(): Promise<BlogPost[]> {
	// Simulate API delay
	await new Promise(resolve => setTimeout(resolve, 100))

	return dummyPosts
}
