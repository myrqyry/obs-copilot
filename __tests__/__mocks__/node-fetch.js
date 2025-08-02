const fetch = jest.fn();
const { Response } = jest.requireActual('node-fetch');

fetch.mockResponse = (body, init) => {
  return fetch.mockImplementationOnce(() => Promise.resolve(new Response(body, init)));
};

fetch.mockResponseOnce = (body, init) => {
  return fetch.mockImplementationOnce(() => Promise.resolve(new Response(body, init)));
};

fetch.mockReject = (error) => {
  return fetch.mockImplementationOnce(() => Promise.reject(error));
};

fetch.mockRejectOnce = (error) => {
  return fetch.mockImplementationOnce(() => Promise.reject(error));
};

module.exports = fetch;
module.exports.Response = Response;
