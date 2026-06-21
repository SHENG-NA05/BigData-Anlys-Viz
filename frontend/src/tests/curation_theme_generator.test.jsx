import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { message } from 'antd'
import CurationThemeGenerator from '../components/curation_management/views/curation_theme_generator'
import { catalogService } from '../services/catalogService'
import { curationService } from '../services/curationService'
import { proposalService } from '../services/proposalService'

jest.mock('../services/curationService', () => ({
  curationService: {
    generateThemes: jest.fn(),
    getThemeHistory: jest.fn(),
    getTrendingKeywords: jest.fn(),
  },
}))

jest.mock('../services/proposalService', () => ({
  proposalService: { createProposal: jest.fn() },
}))

jest.mock('../services/catalogService', () => ({
  catalogService: { matchCatalog: jest.fn() },
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const historyTheme = {
  theme_id: 'T-HISTORY',
  title: '資料閱讀實驗室',
  outline: '探索資料如何轉化為公共知識。',
  target_audience: '一般讀者',
  keywords: ['資料', '閱讀'],
}

const renderPage = () => render(<MemoryRouter><CurationThemeGenerator /></MemoryRouter>)

describe('CurationThemeGenerator API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    curationService.getThemeHistory.mockResolvedValue({ data: [] })
    curationService.getTrendingKeywords.mockResolvedValue([])
    message.success = jest.fn()
    message.warning = jest.fn()
    message.error = jest.fn()
  })

  test('renders an empty state instead of seeded themes', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'AI 主題生成' })).toBeInTheDocument()
    expect(await screen.findByText('尚無主題，請輸入關鍵詞後產生。')).toBeInTheDocument()
    expect(screen.queryByText('共生演算法')).not.toBeInTheDocument()
  })

  test('generates themes through the backend service', async () => {
    curationService.generateThemes.mockResolvedValue([{
      theme_id: 'T-AI',
      title: 'AI 共創實驗室',
      outline: '以互動裝置呈現人與 AI 的共同創作。',
      target_audience: '青少年',
      keywords: ['AI', '互動'],
    }])

    renderPage()
    fireEvent.change(screen.getByLabelText('關鍵詞'), { target: { value: 'AI、共創' } })
    fireEvent.click(screen.getByRole('button', { name: /產生主題/ }))

    expect((await screen.findAllByText('AI 共創實驗室')).length).toBeGreaterThan(0)
    expect(curationService.generateThemes).toHaveBeenCalled()
    expect(message.success).toHaveBeenCalledWith('已產生 1 個主題')
  })

  test('does not create fake themes when generation fails', async () => {
    curationService.generateThemes.mockRejectedValue(new Error('AI unavailable'))
    renderPage()
    fireEvent.change(screen.getByLabelText('關鍵詞'), { target: { value: 'AI' } })
    fireEvent.click(screen.getByRole('button', { name: /產生主題/ }))

    await waitFor(() => expect(message.error).toHaveBeenCalledWith('AI unavailable'))
    expect(screen.queryByText('人機共感實驗室')).not.toBeInTheDocument()
  })

  test('creates a database proposal and navigates with its id', async () => {
    curationService.getThemeHistory.mockResolvedValue({ data: [historyTheme] })
    proposalService.createProposal.mockResolvedValue({ proposal_id: 'P-REAL-1' })
    renderPage()

    await screen.findAllByText(historyTheme.title)
    fireEvent.click(screen.getByRole('button', { name: /建立企劃書/ }))

    await waitFor(() => expect(proposalService.createProposal).toHaveBeenCalled())
    expect(mockNavigate).toHaveBeenCalledWith('/proposal', { state: { proposalId: 'P-REAL-1' } })
  })

  test('shows only catalog matches returned by the backend', async () => {
    curationService.getThemeHistory.mockResolvedValue({ data: [historyTheme] })
    catalogService.matchCatalog.mockResolvedValue({ data: [{
      book_id: 7,
      title: '資料視覺化',
      classification_no: '540',
      match_score: 91,
    }] })
    renderPage()

    await screen.findAllByText(historyTheme.title)
    fireEvent.click(screen.getByRole('button', { name: /比對館藏/ }))
    expect(await screen.findByText('資料視覺化')).toBeInTheDocument()
  })
})
