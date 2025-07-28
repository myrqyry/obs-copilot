const { TextEncoder, TextDecoder } = require('util');
require('whatwg-fetch');
const { TransformStream } = require('web-streams-polyfill');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const mockFetchImplementation = require('./__tests__/mocks/mockFetch');
global.fetch = mockFetchImplementation;
global.Request = Request;
global.Response = Response;
global.TransformStream = TransformStream;
