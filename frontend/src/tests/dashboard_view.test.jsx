import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { message } from 'antd'
import DashboardView from '../components/curation_management/views/dashboard_view'
import { dashboardService } from '../services/dashboardService'

jest.mock('recharts', () => {
  const original = jest.requireActual('recharts')
  return {
    ...original,
    ResponsiveContainer: ({ children }) => <div>{children}</div>,
  }
})

jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getDashboardStats: jest.fn().mockResolvedValue({ proposal_export_count: 12.3 }),
  },
}))

describe('DashboardView RA workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = jest.fn()
    HTMLAnchorElement.prototype.click = jest.fn()
    message.success = jest.fn()
  })

  test('renders analytics dashboard', async () => {
    render(<DashboardView />)

    expect(screen.getByRole('heading', { name: '策展成效分析與洞察' })).toBeInTheDocument()
    expect(screen.getAllByText('總參觀人次').length).toBeGreaterThan(0)
    expect(screen.getByText('觀眾來源與輪廓')).toBeInTheDocument()

    await waitFor(() => {
      expect(dashboardService.getDashboardStats).toHaveBeenCalledWith('quarter')
    })
  })

  test('exports report from hero action', () => {
    render(<DashboardView />)

    fireEvent.click(screen.getByRole('button', { name: /匯出報表/ }))

    expect(window.URL.createObjectURL).toHaveBeenCalled()
  })

  test('creates next exhibition draft', () => {
    render(<DashboardView />)

    fireEvent.click(screen.getByRole('button', { name: /生成再策展企劃草案/ }))

    expect(message.success).toHaveBeenCalledWith('已產生再策展企劃草案')
  })
})
