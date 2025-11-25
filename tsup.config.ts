import {defineConfig} from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: true,
  platform: 'browser',
  esbuildOptions(options) {
    options.jsx = 'transform';
    options.jsxFactory = 'React.createElement';
    options.jsxFragment = 'React.Fragment';
  },
  outExtension({ format }) {
    return {
      js: `.${format === 'cjs' ? 'cjs' : 'mjs'}`,
    };
  },
});
