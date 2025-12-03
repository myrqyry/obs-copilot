import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: 'http://localhost:8000/openapi.json',
    output: {
      mode: 'tags-split',
      target: 'src/api/generated',
      schemas: 'src/api/model',
      client: 'react-query',
      mock: false,
      baseUrl: 'http://localhost:8000',
    },
  },
});
