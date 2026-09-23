// Prose linting for content/posts/*.mdx — separate from Biome, which only
// covers code (see AGENTS.md). remark-mdx/remark-frontmatter teach the
// parser this repo's actual dialect (JSX + YAML frontmatter) so posts with
// embedded components don't get flagged as malformed markdown.
export default {
  plugins: [
    "remark-frontmatter",
    "remark-mdx",
    "remark-gfm",
    "remark-preset-lint-consistent",
    "remark-preset-lint-recommended",
  ],
};
