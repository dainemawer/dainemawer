import type { Post } from "./posts";

/**
 * The posts worth reading after `post`: the ones sharing the most topics
 * with it, newest first within a tie. If fewer than `limit` share a topic,
 * the rest are filled with the newest remaining posts, so the block is
 * never short. `all` is expected newest-first (as `getAllPosts` returns it).
 */
export function getRelatedPosts(post: Post, all: Post[], limit = 2): Post[] {
  const others = all.filter((other) => other.slug !== post.slug);
  const shared = (other: Post) =>
    other.topics.filter((topic) => post.topics.includes(topic)).length;

  // Array.prototype.sort is stable, so equal scores keep `all`'s newest-first order.
  return others.toSorted((a, b) => shared(b) - shared(a)).slice(0, limit);
}
