import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

// Build frame for the kb export: .svx pages through mdsvex, `layout: runbook` from frontmatter, `#lib/…` → src/lib.
export default {
  extensions: ['.svelte', '.svx'],
  preprocess: [vitePreprocess(), mdsvex({ extensions: ['.svx'], layout: { runbook: 'src/lib/layouts/runbook.svelte' } })],
  kit: {
    adapter: adapter({ fallback: undefined }),
    alias: { '#lib': 'src/lib' },
    prerender: { entries: ['/kb'], handleHttpError: 'warn' },
  },
};
