import '@testing-library/jest-dom';
jest.mock('axios');

// optional: silence alert
if (!window.alert) window.alert = () => {};

import axios from 'axios';

// Give axios mocks sane defaults so components that call .then() don't explode
beforeEach(() => {
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockResolvedValue({ data: {} });
  axios.patch.mockResolvedValue({ data: {} });
  axios.put.mockResolvedValue({ data: {} });
  axios.delete.mockResolvedValue({ data: {} });
});

afterEach(() => {
  jest.clearAllMocks();
});
