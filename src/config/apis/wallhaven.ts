export const wallhaven = {
  label: 'Wallhaven',
  baseUrl: 'https://wallhaven.cc/api/v1/search',
  paramMappings: { q: 'q', categories: 'categories', purity: 'purity', sorting: 'sorting', order: 'order', page: 'page' },
  defaultParams: { categories: '111', purity: '100', sorting: 'relevance', order: 'desc' },
  requiresKey: false,
  responseDataPath: 'data',
};
