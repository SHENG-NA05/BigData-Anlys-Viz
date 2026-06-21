import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { message } from 'antd'
import ProposalEditor from '../components/curation_management/views/proposal_editor'
import { proposalService } from '../services/proposalService'

jest.mock('../services/proposalService', () => ({
  proposalService: {
    createProposal: jest.fn(),
    exportToWord: jest.fn(),
    exportToPdf: jest.fn(),
    updateProposal: jest.fn(),
  },
}))

describe('ProposalEditor RA workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = jest.fn()
    HTMLAnchorElement.prototype.click = jest.fn()
    message.success = jest.fn()
    message.warning = jest.fn()
    message.info = jest.fn()
  })

  test('renders RA proposal editor layout', () => {
    render(<ProposalEditor />)

    expect(screen.getByRole('heading', { name: '策展內容整合與編排' })).toBeInTheDocument()
    expect(screen.getByText('展區結構與敘事動線')).toBeInTheDocument()
    expect(screen.getByText('AI 編輯建議')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /匯出 Word/ })).toBeInTheDocument()
  })

  test('adds a section and updates active section text', () => {
    render(<ProposalEditor />)

    fireEvent.click(screen.getByRole('button', { name: /新增展區/ }))
    expect(screen.getByDisplayValue('請輸入展區敘事重點')).toBeInTheDocument()

    fireEvent.change(screen.getByDisplayValue('請輸入展區敘事重點'), {
      target: { value: '觀眾共創結尾' },
    })
    expect(screen.getByDisplayValue('觀眾共創結尾')).toBeInTheDocument()
  })

  test('saves proposal draft', async () => {
    proposalService.updateProposal.mockResolvedValue({ status: 'success' })
    render(<ProposalEditor />)

    fireEvent.click(screen.getByRole('button', { name: /儲存/ }))

    await waitFor(() => {
      expect(localStorage.getItem('ra-proposal-draft')).toContain('感知擴張')
      expect(message.success).toHaveBeenCalledWith('提案已儲存')
    })
  })

  test('adds collaboration comment', () => {
    render(<ProposalEditor />)

    fireEvent.change(screen.getByPlaceholderText('撰寫留言...'), {
      target: { value: '請補一段導覽語音' },
    })
    fireEvent.click(screen.getByRole('button', { name: '送出' }))

    expect(screen.getByText('請補一段導覽語音')).toBeInTheDocument()
  })

  test('exports word and pdf files', async () => {
    proposalService.exportToWord.mockResolvedValue(new Blob(['word']))
    proposalService.exportToPdf.mockResolvedValue(new Blob(['pdf']))
    render(<ProposalEditor />)

    fireEvent.click(screen.getByRole('button', { name: /匯出 Word/ }))
    await waitFor(() => {
      expect(proposalService.exportToWord).toHaveBeenCalled()
      expect(message.success).toHaveBeenCalledWith('已匯出 DOCX')
    })

    fireEvent.click(screen.getByRole('button', { name: /匯出 PDF/ }))
    await waitFor(() => {
      expect(proposalService.exportToPdf).toHaveBeenCalled()
      expect(message.success).toHaveBeenCalledWith('已匯出 PDF')
    })
  })
})
