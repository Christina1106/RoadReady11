// Make sure this stays at the very top
jest.mock('axios');

import axios from 'axios';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// give axios sane defaults so components calling .then() don't crash
beforeEach(() => {
  axios.get.mockResolvedValue({ data: [] });
  axios.post.mockResolvedValue({ data: {} });
  axios.patch.mockResolvedValue({ data: {} });
});

test('renders the Home hero brand (H1)', async () => {
  render(<App />);
  // wait for useEffect + state updates to settle
  const heroH1 = await screen.findByRole('heading', {
    name: /RoadReady/i,
    level: 1,
  });
  expect(heroH1).toBeInTheDocument();
});
