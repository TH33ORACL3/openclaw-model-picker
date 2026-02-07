import { defineConfig } from 'vite';
import { modelPickerApi } from './server/plugin.js';

export default defineConfig({
  plugins: [modelPickerApi()],
  server: { port: 5199 }
});
