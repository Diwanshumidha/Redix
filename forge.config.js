import { VitePlugin } from '@electron-forge/plugin-vite';

export default {
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'src/main/index.ts',
          config: 'electron.vite.config.ts'
        },
        {
          entry: 'src/preload/index.ts',
          config: 'electron.vite.config.ts'
        }
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'electron.vite.config.ts'
        }
      ]
    })
  ]
};