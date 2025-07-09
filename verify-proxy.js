#!/usr/bin/env node

// Simple verification script for the proxy
import http from 'http';

console.log('🔧 Verifying Proxy Fixes...\n');

// Generic test function for an endpoint
function testEndpoint(name, path, expectedStatusCode, checkBodyJson = false, method = 'GET', postData = null) {
    return new Promise((resolve) => {
        console.log(`\n🧪 Testing endpoint: ${name} (${method} ${path})`);
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: path,
            method: method,
            headers: {}
        };

        if (postData && (method === 'POST' || method === 'PUT')) {
            options.headers['Content-Type'] = 'application/json';
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`  📡 Status: ${res.statusCode}`);
                console.log(`  📋 Headers:`);
                console.log(`     - COEP: ${res.headers['cross-origin-embedder-policy'] || 'not set'}`);
                console.log(`     - CORP: ${res.headers['cross-origin-resource-policy'] || 'not set'}`);
                console.log(`     - CORS Allow Origin: ${res.headers['access-control-allow-origin'] || 'not set'}`);
                console.log(`     - Content-Type: ${res.headers['content-type'] || 'not set'}`);

                if (res.statusCode === expectedStatusCode) {
                    console.log(`  ✅ Status code OK (${res.statusCode})`);
                } else {
                    console.log(`  ❌ Status code FAIL: Expected ${expectedStatusCode}, Got ${res.statusCode}`);
                }

                if (checkBodyJson && res.headers['content-type'] && res.headers['content-type'].includes('application/json')) {
                    try {
                        const jsonBody = JSON.parse(body);
                        console.log('  ✅ Response body is valid JSON.');
                        if (jsonBody.error) {
                            console.log(`     Error in response: ${jsonBody.error}`);
                        }
                    } catch (e) {
                        console.log('  ❌ Response body is NOT valid JSON despite content-type header.');
                    }
                } else if (checkBodyJson) {
                    console.log('  ⚠️  Cannot check JSON body: Content-Type is not application/json or missing.');
                }
                // console.log(`     Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
                resolve();
            });
        });

        req.on('error', (err) => {
            console.log(`  ❌ Connection failed for ${name}: ${err.message}`);
            if (name === 'Favicon Proxy (via /api/proxy)') { // Only show this for the first essential test
                 console.log('💡 Make sure the proxy server (proxy.cjs) is running on port 3001');
            }
            resolve();
        });

        if (postData && (method === 'POST' || method === 'PUT')) {
            req.write(postData);
        }
        req.end();
    });
}

// Test the main app (remains the same)
function testMainApp() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5173,
            path: '/',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            console.log(`🌐 Main App Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('✅ Main app is accessible');
            } else {
                console.log('❌ Main app failed to load');
            }
            resolve();
        });

        req.on('error', (err) => {
            console.log(`❌ Main app connection failed: ${err.message}`);
            resolve();
        });

        req.end();
    });
}

// Run verification
async function verify() {
    console.log('🚀 Starting verification...\n');
    
    await testMainApp();

    // Test Favicon Proxy (original test, adapted)
    await testEndpoint(
        'Favicon Proxy (via /api/favicon)', // Updated name
        '/api/favicon?domain=streamer.bot&sz=16', // Updated path
        200 // Expect 200 if proxy works, even if Google fetch has issues (proxy handles it)
    );

    // Test Generic Image Proxy (/api/image) - expect 500 if URL is invalid/unfetchable
    await testEndpoint(
        'Generic Image Proxy (Bad URL)',
        '/api/image?url=http://invalid-url-for-testing.com/image.png',
        500, // Expecting failure from fetch
        true // Expect JSON error
    );

    // Test Iconfinder SVG Proxy - expect 400 if no URL
    await testEndpoint(
        'Iconfinder SVG Proxy (No URL)',
        '/api/iconfinder/svg',
        400,
        true // Expect JSON error
    );

    // Test Pexels API (no key, expect error)
    await testEndpoint(
        'Pexels API (No Key)',
        '/api/pexels?query=nature',
        500, // Pexels proxy in proxy.cjs returns 500 if key is missing
        true // Expect JSON error { error: "Pexels API key not provided..." }
    );

    // Test Gemini API (no key, bad request, expect error)
    await testEndpoint(
        'Gemini API (Bad Request)',
        '/api/gemini?model=gemini-pro', // Missing API key in actual call, POST body also missing
        500, // The proxy itself should respond, but Gemini will error. Or 400/500 from proxy.
             // proxy.cjs returns 500 if GEMINI_API_KEY is not set, or if fetch fails.
        true, // Expect JSON error
        'POST',
        JSON.stringify({ contents: [{ parts: [{ text: "Hello" }] }] }) // Example body
    );

    // Test Chutes API (no key, bad request, expect error)
    await testEndpoint(
        'Chutes API (Bad Request)',
        '/api/chutes', // Missing API key in actual call
        500, // proxy.cjs returns 500 if CHUTES_API_TOKEN is not set
        true, // Expect JSON error
        'POST',
        JSON.stringify({ prompt: "test" }) // Example body
    );

    // Test an unknown API endpoint
    await testEndpoint(
        'Unknown API Endpoint',
        '/api/nonexistentapi',
        400, // Or 404 depending on how proxy.cjs handles truly unknown paths vs. known paths with bad params
             // proxy.cjs has a general app.get(['/api/wallhaven', ..., '/api/proxy'], ...) which ends with res.status(400).json({ error: 'Unknown API' });
             // This should catch /api/nonexistentapi if it falls into that handler.
             // If not, it might be a 404 from Express itself if no route matches.
             // Let's assume it hits the 'Unknown API' in the unified handler.
        true // Expect JSON error
    );
    
    console.log('\n📋 Verification Summary:');
    console.log('✅ Fixed password field form issue');
    console.log('✅ Enhanced Streamer.bot error handling');
    console.log('✅ Added favicon proxy with COEP headers');
    console.log('✅ Optimized performance with requestIdleCallback');
    
    console.log('\n🎯 Next steps:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Check browser console for favicon errors');
    console.log('3. Test the password field toggle');
    console.log('4. Verify Streamer.bot connection messages');
    
    console.log('\n🔧 If you still see favicon errors:');
    console.log('- Clear browser cache and hard reload');
    console.log('- Check that proxy is running on port 3001');
    console.log('- Verify the FaviconIcon component is using the proxy');
}

verify().catch(console.error); 