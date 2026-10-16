/**
 * Prints a UTM-tagged link for every channel, ready to paste.
 *
 *   pnpm --filter blog share <slug|til/slug> [content]
 *
 * `content` is optional and tags the placement, e.g. a subreddit name.
 */
import { CHANNELS, type Channel, utmUrl } from "../lib/utm";

const [path, content] = process.argv.slice(2);

if (!path) {
  console.error("Usage: pnpm --filter blog share <slug|til/slug> [content]");
  process.exit(1);
}

for (const channel of Object.keys(CHANNELS) as Channel[]) {
  console.log(
    `${channel.padEnd(11)} ${utmUrl(`/${path.replace(/^\//, "")}`, channel, { content })}`,
  );
}
