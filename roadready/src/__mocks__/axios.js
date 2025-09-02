// src/__mocks__/axios.js
const makeResolved = (data) => Promise.resolve({ data });

const axiosMock = {
  get: jest.fn(() => makeResolved([])),
  post: jest.fn(() => makeResolved({})),
  put: jest.fn(() => makeResolved({})),
  patch: jest.fn(() => makeResolved({})),
  delete: jest.fn(() => makeResolved({})),
  create: jest.fn(() => axiosMock),
  interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  defaults: {},
};

export default axiosMock;
