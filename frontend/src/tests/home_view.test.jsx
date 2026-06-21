import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomeView from '../components/curation_management/views/home_view'
import { catalogService } from '../services/catalogService'
import { curationService } from '../services/curationService'
import { dashboardService } from '../services/dashboardService'
import { proposalService } from '../services/proposalService'

jest.mock('../services/catalogService', () => ({ catalogService: { getUploadHistory: jest.fn() } }))
jest.mock('../services/curationService', () => ({ curationService: { getThemeHistory: jest.fn() } }))
jest.mock('../services/dashboardService', () => ({ dashboardService: { getDashboardStats: jest.fn() } }))
jest.mock('../services/proposalService', () => ({ proposalService: { listProposals: jest.fn() } }))

describe('HomeView', () => {
  beforeEach(() => {
    dashboardService.getDashboardStats.mockResolvedValue({ cumulative_hours_saved: 24 })
    curationService.getThemeHistory.mockResolvedValue({ data: [{ theme_id: 1 }, { theme_id: 2 }] })
    proposalService.listProposals.mockResolvedValue({ data: [{ proposal_id: 1 }] })
    catalogService.getUploadHistory.mockResolvedValue([{ source_file: 'catalog.csv' }])
  })

  test('shows live workflow summary from backend services', async () => {
    render(<MemoryRouter><HomeView /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /從館藏資料到策展成果/ })).toBeInTheDocument()
    expect(await screen.findByText('2 個')).toBeInTheDocument()
    expect(screen.getByText('1 份')).toBeInTheDocument()
    expect(screen.getByText('1 次')).toBeInTheDocument()
    expect(screen.getByText('24 小時')).toBeInTheDocument()
  })

  test('does not invent values when an API is unavailable', async () => {
    dashboardService.getDashboardStats.mockRejectedValue(new Error('unavailable'))
    render(<MemoryRouter><HomeView /></MemoryRouter>)

    expect(await screen.findByText('暫無資料')).toBeInTheDocument()
    expect(screen.queryByText('0 小時')).not.toBeInTheDocument()
  })
})
