const { TextEncoder, TextDecoder } = require('util');
const { TransformStream } = require('web-streams-polyfill');
require('@testing-library/jest-dom'); // Import jest-dom matchers

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
const { fetch, Request, Response } = require('node-fetch');
global.fetch = fetch;
global.Request = Request;
global.Response = Response;
const mockFetchImplementation = require('./__tests__/mocks/node-fetch');
global.fetch = mockFetchImplementation;
global.TransformStream = TransformStream;

// Mock src/constants globally
jest.mock('src/constants', () => require('./__tests__/mocks/constants.js'));
