const { TextEncoder, TextDecoder } = require('util');
require('whatwg-fetch');
const { TransformStream } = require('web-streams-polyfill');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.fetch = fetch;
global.Request = Request;
global.Response = Response;
global.TransformStream = TransformStream;
