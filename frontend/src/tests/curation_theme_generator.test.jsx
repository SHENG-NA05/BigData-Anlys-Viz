import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { message } from 'antd'
import CurationThemeGenerator from '../components/curation_management/views/curation_theme_generator'
import { curationService } from '../services/curationService'
import { proposalService } from '../services/proposalService'

jest.mock('../services/curationService', () => ({
  curationService: {
    generateThemes: jest.fn(),
    getThemeHistory: jest.fn(() => Promise.resolve({ data: [] })),
    getTrendingKeywords: jest.fn(() => Promise.resolve([])),
  },
}))

jest.mock('../services/proposalService', () => ({
  proposalService: {
    createProposal: jest.fn(),
  },
}))

jest.mock('../services/catalogService', () => ({
  catalogService: {
    matchCatalog: jest.fn(),
  },
}))

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderPage = () =>
  render(
    <MemoryRouter>
      <CurationThemeGenerator />
    </MemoryRouter>,
  )

describe('CurationThemeGenerator RA workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    message.success = jest.fn()
    message.warning = jest.fn()
    message.info = jest.fn()
  })

  test('renders RA theme generation workspace', async () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'AI 背景探索與主題生成' })).toBeInTheDocument()
    expect(screen.getByText('Prompt 輸入與生成建議')).toBeInTheDocument()
    expect(screen.getAllByText('共生演算法').length).toBeGreaterThan(0)
    expect(await screen.findByText('AI 洞察與建議')).toBeInTheDocument()
  })

  test('appends prompt chips to the textarea', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: '+ 觀眾輪廓' }))

    expect(screen.getByRole('textbox').value).toContain('+ 觀眾輪廓')
    expect(message.success).toHaveBeenCalledWith('已加入 Prompt')
  })

  test('generates and renders themes from service response', async () => {
    curationService.generateThemes.mockResolvedValue([
      {
        id: 'theme-ai-lab',
        title: 'AI 共創實驗室',
        outline: '以互動裝置呈現人與 AI 的共同創作。',
        keywords: ['AI', '互動', '共創'],
      },
    ])

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /生成構想/ }))

    await waitFor(() => {
      expect(curationService.generateThemes).toHaveBeenCalled()
    })

    expect((await screen.findAllByText('AI 共創實驗室')).length).toBeGreaterThan(0)
    expect(message.success).toHaveBeenCalledWith('已生成主題構想')
  })

  test('saves draft to local storage', () => {
    renderPage()

    fireEvent.click(screen.getByRole('button', { name: /儲存草案/ }))

    expect(localStorage.getItem('ra-theme-draft')).toContain('共生演算法')
    expect(message.success).toHaveBeenCalledWith('草案已儲存')
  })

  test('creates proposal and navigates to proposal editor', async () => {
    proposalService.createProposal.mockResolvedValue({ status: 'success', proposal_id: 'P-RA-1' })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: /建立策展方向/ }))

    await waitFor(() => {
      expect(proposalService.createProposal).toHaveBeenCalled()
    })

    expect(localStorage.getItem('exported_proposal')).toContain('P-RA-1')
    expect(mockNavigate).toHaveBeenCalledWith('/proposal')
  })
})
