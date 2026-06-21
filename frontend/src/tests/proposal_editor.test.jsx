import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { message } from 'antd'
import ProposalEditor from '../components/curation_management/views/proposal_editor'
import { proposalService } from '../services/proposalService'

jest.mock('../services/proposalService', () => ({
  proposalService: {
    listProposals: jest.fn(),
    exportToWord: jest.fn(),
    exportToPdf: jest.fn(),
    updateProposal: jest.fn(),
    matchCatalog: jest.fn(),
  },
}))

const proposal = {
  proposal_id: 'P-1',
  theme_id: 'T-1',
  title: '真實企劃書',
  content: '資料庫企劃內容',
  matched_books: [],
  status: 'draft',
  created_at: '2026-06-21 10:00:00',
  updated_at: '2026-06-21 10:00:00',
}

const renderPage = () => render(<MemoryRouter><ProposalEditor /></MemoryRouter>)

describe('ProposalEditor API integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    proposalService.listProposals.mockResolvedValue({ data: [proposal] })
    window.URL.createObjectURL = jest.fn(() => 'blob:test-url')
    window.URL.revokeObjectURL = jest.fn()
    HTMLAnchorElement.prototype.click = jest.fn()
    message.success = jest.fn()
    message.error = jest.fn()
  })

  test('loads proposals from the backend', async () => {
    renderPage()
    expect(await screen.findByDisplayValue('真實企劃書')).toBeInTheDocument()
    expect(proposalService.listProposals).toHaveBeenCalled()
  })

  test('saves the selected proposal through the backend', async () => {
    proposalService.updateProposal.mockResolvedValue({ data: { ...proposal, title: '更新後標題' } })
    renderPage()
    const titleInput = await screen.findByDisplayValue('真實企劃書')
    fireEvent.change(titleInput, { target: { value: '更新後標題' } })
    fireEvent.click(screen.getByRole('button', { name: /^儲存$/ }))

    await waitFor(() => expect(proposalService.updateProposal).toHaveBeenCalledWith(
      'P-1', '更新後標題', '資料庫企劃內容', 'draft',
    ))
    expect(message.success).toHaveBeenCalledWith('企劃書已儲存至資料庫')
  })

  test('renders catalog matches returned by the backend', async () => {
    proposalService.matchCatalog.mockResolvedValue({ data: {
      ...proposal,
      matched_books: [{ book_id: 9, title: '智慧圖書館', classification_no: '020', match_score: 88 }],
    } })
    renderPage()
    await screen.findByDisplayValue('真實企劃書')
    fireEvent.click(screen.getByRole('button', { name: /匹配館藏/ }))
    expect(await screen.findByText('智慧圖書館')).toBeInTheDocument()
  })

  test('exports files returned by the backend', async () => {
    proposalService.exportToWord.mockResolvedValue(new Blob(['word']))
    proposalService.exportToPdf.mockResolvedValue(new Blob(['pdf']))
    renderPage()
    await screen.findByDisplayValue('真實企劃書')

    fireEvent.click(screen.getByRole('button', { name: /Word/ }))
    await waitFor(() => expect(proposalService.exportToWord).toHaveBeenCalledWith('P-1'))
    fireEvent.click(screen.getByRole('button', { name: /PDF/ }))
    await waitFor(() => expect(proposalService.exportToPdf).toHaveBeenCalledWith('P-1'))
  })
})
