import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'outputs/embed',
    lib: {
      entry: 'src/embed.ts',
      formats: ['es'],
      fileName: 'my-scene',
    },
    // Keep emitted asset paths relative to the hosted output directory.
  },
  base: './',
});
