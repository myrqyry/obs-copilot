const mockFetchImplementation = jest.fn((url, options) => {
  if (url.includes('error')) {
    return Promise.resolve({
      status: 500,
      ok: false,
      json: () => Promise.resolve({ message: 'Mocked server error' }),
      text: () => Promise.resolve('Mocked server error'),
    });
  }
  return Promise.resolve({
    status: 200,
    ok: true,
    json: () => Promise.resolve({ message: 'Mocked successful response' }),
    text: () => Promise.resolve('Mocked successful response'),
  });
});

module.exports = mockFetchImplementation;