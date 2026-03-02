import React from 'react';

import { render, screen } from '@testing-library/react';

import App from './App';

test('renders Smartwalls landing page', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /smartwalls/i });
  expect(heading).toBeInTheDocument();
});
