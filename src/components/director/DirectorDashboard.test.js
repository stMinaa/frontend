/* eslint-disable max-nested-callbacks */
import React from 'react';

import { render, screen } from '@testing-library/react';

import DirectorDashboard from './DirectorDashboard';

const emptyOk = { ok: true, json: async () => ({ success: true, data: [] }) };

beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.resetAllMocks();
  localStorage.clear();
});

describe('DirectorDashboard API contract', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'test-token');
  });

  it('renders buildings from wrapped API response', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [
          { _id: '1', address: 'Test Address 1' },
          { _id: '2', address: 'Test Address 2' }
        ] })
      })
      .mockResolvedValue(emptyOk);
    render(<DirectorDashboard user={{ role: 'director' }} activeTab="zgrade" />);
    expect(await screen.findByText(/Test Address 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Test Address 2/)).toBeInTheDocument();
  });

  it('renders managers from wrapped API response', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [
          { _id: 'm1', firstName: 'Manager', lastName: 'One', status: 'active' },
          { _id: 'm2', firstName: 'Manager', lastName: 'Two', status: 'active' }
        ] })
      })
      .mockResolvedValue(emptyOk);
    render(<DirectorDashboard user={{ role: 'director' }} activeTab="upravnici" />);
    expect(await screen.findByText(/Manager One/)).toBeInTheDocument();
    expect(await screen.findByText(/Manager Two/)).toBeInTheDocument();
  });

  it('renders issues from wrapped API response', async () => {
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [
          { _id: 'i1', title: 'Issue 1', status: 'open', priority: 'high' },
          { _id: 'i2', title: 'Issue 2', status: 'closed', priority: 'low' }
        ] })
      })
      .mockResolvedValue(emptyOk);
    render(<DirectorDashboard user={{ role: 'director' }} activeTab="kvarovi" />);
    expect(await screen.findByText(/Issue 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Issue 2/)).toBeInTheDocument();
  });

  it('renders associates from wrapped API response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: [
        { _id: 'a1', firstName: 'Associate', lastName: 'One', status: 'active' },
        { _id: 'a2', firstName: 'Associate', lastName: 'Two', status: 'active' }
      ] })
    });
    render(<DirectorDashboard user={{ role: 'director' }} activeTab="saradnici" />);
    expect(await screen.findByText(/Associate One/)).toBeInTheDocument();
    expect(await screen.findByText(/Associate Two/)).toBeInTheDocument();
  });
});
