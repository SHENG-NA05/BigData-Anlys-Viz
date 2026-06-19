import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DashboardView from '../components/curation_management/views/dashboard_view';
import { message } from 'antd';

// Mock Recharts ResponsiveContainer to prevent width/height measurement issues in JSDOM
jest.mock('recharts', () => {
  const original = jest.requireActual('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div className="responsive-container-mock">{children}</div>,
  };
});

// Mock dashboardService to prevent loading api.js with import.meta
jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getDashboardStats: jest.fn(),
    updateSettings: jest.fn(),
  },
}));

describe('DashboardView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    message.success = jest.fn();
    message.error = jest.fn();
  });

  test('renders loading spin initially and then statistics', async () => {
    render(<DashboardView />);
    
    // Wait for mock data rendering
    await waitFor(() => {
      expect(screen.queryByText(/即時查看策展系統帶來的工時與經費效益/i)).toBeInTheDocument();
    });

    // Check statistical cards
    expect(screen.getByText('累計節省工時')).toBeInTheDocument();
    // Sum is 130 hours
    expect(screen.getByText('134')).toBeInTheDocument();

    expect(screen.getByText('累計節省經費')).toBeInTheDocument();
    // Sum is 67,000元
    expect(screen.getByText('67,000')).toBeInTheDocument();

    expect(screen.getByText('完成策展案件')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();

    expect(screen.getByText('生成策展主題')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  test('opens settings modal and updates parameters successfully', async () => {
    render(<DashboardView />);

    await waitFor(() => {
      expect(screen.getByText('參數設置')).toBeInTheDocument();
    });

    // Modal should not be visible initially
    expect(screen.queryByText('效益分析參數設置')).not.toBeInTheDocument();

    // Click setting button
    fireEvent.click(screen.getByText('參數設置'));

    // Modal is open
    expect(screen.getByText('效益分析參數設置')).toBeInTheDocument();

    // Inputs are visible
    const inputs = screen.getAllByRole('spinbutton');
    const hourlyRateInput = inputs[0];
    const baseHoursInput = inputs[1];

    expect(hourlyRateInput.value).toBe('500');
    expect(baseHoursInput.value).toBe('8');

    // Change value
    fireEvent.change(hourlyRateInput, { target: { value: '600' } });
    fireEvent.change(baseHoursInput, { target: { value: '10' } });

    // Click Ok
    const okBtn = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(okBtn);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('設置已更新');
      expect(screen.queryByText('效益分析參數設置')).not.toBeInTheDocument();
    });
  });
});
