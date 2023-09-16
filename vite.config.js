const Path = require('path');
const vuePlugin = require('@vitejs/plugin-vue')
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

const { defineConfig } = require('vite');

/**
 * https://vitejs.dev/config
 */
const config = defineConfig({
  root: Path.join(__dirname, 'src', 'renderer'),
  publicDir: 'public',
  server: {
    port: 8080,
  },
  open: false,
  build: {
    outDir: Path.join(__dirname, 'build', 'renderer'),
    emptyOutDir: true,
  },
  plugins: [
    vuePlugin(),
    AutoImport({
      dts: true,
      eslintrc: {
        enabled: true, // <-- this
      },
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/, /\.vue\?vue/, // .vue
      ],
      imports: [
        // presets
        'vue',
        'vue-router',
        '@vueuse/core'
      ],
      resolvers: [
        ElementPlusResolver(),
      ],
      dirs: [
        './src/composables',
        './src/composables/**',
      ],
      vueTemplate: true,
    }),
    Components({
      dts: true,
      dirs: ['src/components/common'],
    }),
  ],
});

module.exports = config;
