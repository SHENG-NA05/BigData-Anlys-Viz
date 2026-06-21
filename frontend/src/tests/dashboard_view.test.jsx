import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { message } from 'antd'
import DashboardView from '../components/curation_management/views/dashboard_view'
import { dashboardService } from '../services/dashboardService'

jest.mock('recharts', () => {
  const original = jest.requireActual('recharts')
  return { ...original, ResponsiveContainer: ({ children }) => <div>{children}</div> }
})

jest.mock('../services/dashboardService', () => ({
  dashboardService: {
    getDashboardStats: jest.fn(),
    getMonthlyStats: jest.fn(),
    getQuarterlyStats: jest.fn(),
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
}))

describe('DashboardView API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    dashboardService.getDashboardStats.mockResolvedValue({
      cumulative_hours_saved: 18,
      cumulative_cost_saved: 3600,
      theme_generation_count: 5,
      proposal_export_count: 3,
    })
    dashboardService.getMonthlyStats.mockResolvedValue([{ month: '2026-06', hours: 18, cost: 3600 }])
    dashboardService.getQuarterlyStats.mockResolvedValue([{ quarter: '2026-Q2', hours: 18, cost: 3600 }])
    dashboardService.getSettings.mockResolvedValue({ hourly_rate: 200, base_hours: 8 })
    dashboardService.updateSettings.mockResolvedValue({ status: 'success' })
    message.success = jest.fn()
    message.error = jest.fn()
  })

  test('renders only backend-supported metrics', async () => {
    render(<DashboardView />)

    expect(screen.getByRole('heading', { name: '工時與成本效益' })).toBeInTheDocument()
    expect(await screen.findByText('18 小時')).toBeInTheDocument()
    expect(screen.getByText('NT$ 3,600')).toBeInTheDocument()
    expect(screen.queryByText('觀眾來源與輪廓')).not.toBeInTheDocument()
    expect(dashboardService.getDashboardStats).toHaveBeenCalled()
  })

  test('updates calculation settings through the backend', async () => {
    render(<DashboardView />)
    await screen.findByText('18 小時')
    fireEvent.click(screen.getByRole('button', { name: '設定參數' }))
    const rateInput = screen.getByLabelText('平均時薪 (NT$)')
    fireEvent.change(rateInput, { target: { value: '250' } })
    fireEvent.click(screen.getByRole('button', { name: '儲存參數' }))

    await waitFor(() => expect(dashboardService.updateSettings).toHaveBeenCalledWith(250, 8))
    expect(message.success).toHaveBeenCalledWith('系統參數已儲存')
  })

  test('does not render seeded metrics when the API fails', async () => {
    dashboardService.getDashboardStats.mockRejectedValue(new Error('database unavailable'))
    render(<DashboardView />)

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('database unavailable'))
    expect(screen.queryByText('128,457')).not.toBeInTheDocument()
  })
})
