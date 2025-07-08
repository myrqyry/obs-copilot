// netlify/functions/proxy.js
const serverless = require('serverless-http');
const app = require('../../proxy.cjs'); // Adjust path as needed

// Ensure all routes defined in proxy.cjs are handled
// The base path for Netlify functions is /.netlify/functions/proxy
// So, if your Express app has a route like /api/gemini,
// it will be accessible via /.netlify/functions/proxy/api/gemini
// We might need to adjust base paths if proxy.cjs expects to be at the root.
// However, `serverless-http` typically handles this well.

exports.handler = serverless(app);
