export const artstation = {
    label: 'ArtStation',
    baseUrl: 'https://www.artstation.com/search/projects.json',
    paramMappings: { q: 'q', page: 'page', per_page: 'per_page' },
    requiresKey: false,
    userAgent: 'OBS-Copilot/1.0',
    responseDataPath: 'data',
};
