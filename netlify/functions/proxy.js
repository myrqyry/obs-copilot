// netlify/functions/proxy.js
const serverless = require('serverless-http');
const serverless = require('serverless-http');

let appPromise; // Declare a variable to hold the promise of the imported app

// Function to dynamically import the ES module
async function importApp() {
    if (!appPromise) {
        appPromise = import('../../proxy.mjs'); // Use dynamic import for ES module
    }
    const module = await appPromise;
    return module.default; // Assuming 'app' is the default export
}

// Ensure all routes defined in proxy.cjs are handled
// The base path for Netlify functions is /.netlify/functions/proxy
// So, if your Express app has a route like /api/gemini,
// it will be accessible via /.netlify/functions/proxy/api/gemini
// We might need to adjust base paths if proxy.cjs expects to be at the root.
// However, `serverless-http` typically handles this well.

exports.handler = async (event, context) => {
    const app = await importApp();
    return serverless(app)(event, context);
};
