import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: 'backend/openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/model',
      client: 'react-query',
      mock: true,
    },
  },
});
