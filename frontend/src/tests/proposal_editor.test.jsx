import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProposalEditor from '../components/curation_management/views/proposal_editor';
import { proposalService } from '../services/proposalService';
import { message, Modal } from 'antd';

// Mock proposalService
jest.mock('../services/proposalService', () => ({
  proposalService: {
    exportToWord: jest.fn(),
    exportToPdf: jest.fn(),
    matchCatalog: jest.fn(),
    getProposal: jest.fn(),
    listProposals: jest.fn(() => Promise.resolve({ data: [] })),
    updateProposal: jest.fn(),
  },
}));

describe('ProposalEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    // Mock document.execCommand
    document.execCommand = jest.fn();
    message.success = jest.fn();
    message.warning = jest.fn();
    message.error = jest.fn();
    Modal.confirm = jest.fn();
  });

  test('renders page layout correctly', () => {
    render(<ProposalEditor />);
    expect(screen.getByRole('heading', { name: /策展企劃管理中心/i })).toBeInTheDocument();
    expect(screen.getByText(/暫無企劃書/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/企劃書標題/i)).toBeInTheDocument();
  });

  test('editor toolbar buttons trigger document execCommand', () => {
    render(<ProposalEditor />);
    
    const boldBtn = screen.getByRole('button', { name: 'B' });
    fireEvent.click(boldBtn);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);

    const italicBtn = screen.getByRole('button', { name: 'I' });
    fireEvent.click(italicBtn);
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);
  });

  test('validation fails if title is empty', async () => {
    render(<ProposalEditor />);
    
    const saveBtn = screen.getByRole('button', { name: /儲存企劃書/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText('請輸入標題')).toBeInTheDocument();
    });
  });

  test('creates new proposal and displays it in list', async () => {
    const { container } = render(<ProposalEditor />);

    const titleInput = screen.getByPlaceholderText('輸入企劃書標題');
    fireEvent.change(titleInput, { target: { value: 'My AI Curation' } });

    // Mock rich editor text input
    const richEditor = container.querySelector('.rich-editor');
    fireEvent.input(richEditor, { target: { innerHTML: '<p>AI is good</p>' } });

    const saveBtn = screen.getByRole('button', { name: /儲存企劃書/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('企劃書已儲存');
    });

    expect(screen.getByText('My AI Curation')).toBeInTheDocument();
  });

  test('requires a selected proposal to match catalog and export', async () => {
    render(<ProposalEditor />);

    fireEvent.click(screen.getByRole('button', { name: /匹配館藏/i }));
    expect(message.warning).toHaveBeenCalledWith('請先選擇或建立企劃書');

    fireEvent.click(screen.getByRole('button', { name: /匯出 Word/i }));
    expect(message.warning).toHaveBeenCalledWith('請先選擇或建立企劃書');
  });

  test('triggers exports and catalog match when a proposal is loaded', async () => {
    proposalService.matchCatalog.mockResolvedValue({ matched_count: 5 });
    proposalService.exportToWord.mockResolvedValue('word-binary');
    proposalService.exportToPdf.mockResolvedValue('pdf-binary');

    render(<ProposalEditor />);

    // Save a proposal first
    fireEvent.change(screen.getByPlaceholderText('輸入企劃書標題'), { target: { value: 'Export Demo' } });
    fireEvent.click(screen.getByRole('button', { name: /儲存企劃書/i }));

    await waitFor(() => {
      expect(screen.getByText('Export Demo')).toBeInTheDocument();
    });

    // Click Match Catalog
    fireEvent.click(screen.getByRole('button', { name: /匹配館藏/i }));
    await waitFor(() => {
      expect(proposalService.matchCatalog).toHaveBeenCalled();
    });

    // Click Export Word and wait for completion message
    fireEvent.click(screen.getByRole('button', { name: /匯出 Word/i }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith(expect.stringContaining('已匯出為 Word'));
    });

    // Wait for the exporting state to clear (buttons enabled again)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /匯出 PDF/i })).not.toBeDisabled();
    });

    // Click Export PDF and wait for completion message
    fireEvent.click(screen.getByRole('button', { name: /匯出 PDF/i }));
    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith(expect.stringContaining('已匯出為 PDF'));
    });
  });

  test('deletes loaded proposal and resets form', async () => {
    render(<ProposalEditor />);

    // Save proposal
    fireEvent.change(screen.getByPlaceholderText('輸入企劃書標題'), { target: { value: 'Delete Demo' } });
    fireEvent.click(screen.getByRole('button', { name: /儲存企劃書/i }));

    await waitFor(() => {
      expect(screen.getByText('Delete Demo')).toBeInTheDocument();
    });

    // Click Delete to open confirmation
    const deleteBtn = screen.getByRole('button', { name: /刪除/i });
    fireEvent.click(deleteBtn);

    expect(Modal.confirm).toHaveBeenCalled();
    
    // Simulate ok callback of confirmation Modal
    const confirmCallArgs = Modal.confirm.mock.calls[0][0];
    act(() => {
      confirmCallArgs.onOk();
    });

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('企劃書已刪除');
    });

    expect(screen.queryByText('Delete Demo')).not.toBeInTheDocument();
  });
});
