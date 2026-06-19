import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CurationThemeGenerator from '../components/curation_management/views/curation_theme_generator';
import { curationService } from '../services/curationService';
import { message } from 'antd';

// Mock curationService
jest.mock('../services/curationService', () => ({
  curationService: {
    generateThemes: jest.fn(),
  },
}));

describe('CurationThemeGenerator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    message.success = jest.fn();
    message.error = jest.fn();
  });

  test('renders generator page and initial empty state', () => {
    render(<CurationThemeGenerator />);
    expect(screen.getByRole('heading', { name: /AI 智慧策展發想/i })).toBeInTheDocument();
    expect(screen.getByText(/發想參數設置/i)).toBeInTheDocument();
    expect(screen.getByText(/暫無生成的主題/i)).toBeInTheDocument();
  });

  test('fails validation when mandatory fields are empty', async () => {
    render(<CurationThemeGenerator />);
    const submitBtn = screen.getByRole('button', { name: /生成策展主題/i });
    fireEvent.click(submitBtn);

    // Ant Design validation error messages should appear
    await waitFor(() => {
      expect(screen.getByText('請輸入關鍵字')).toBeInTheDocument();
      expect(screen.getByText('請輸入時事')).toBeInTheDocument();
    });
  });

  test('successfully generates theme and renders card', async () => {
    const mockTheme = {
      title: 'AI 智慧特展',
      outline: '展區規劃包括：AI 發展史。',
      status: 'draft',
    };
    curationService.generateThemes.mockResolvedValue(mockTheme);

    render(<CurationThemeGenerator />);

    // Fill form
    const keywordInput = screen.getByLabelText(/關鍵字/);
    const trendInput = screen.getByLabelText(/當前時事熱門話題/);
    
    fireEvent.change(keywordInput, { target: { value: 'AI, library' } });
    fireEvent.change(trendInput, { target: { value: 'AI development' } });

    const submitBtn = screen.getByRole('button', { name: /生成策展主題/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(curationService.generateThemes).toHaveBeenCalledWith('AI, library', 'AI development', undefined, undefined);
    });

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('策展主題生成成功！');
    });

    // Check if new card is rendered
    expect(screen.getByText('AI 智慧特展')).toBeInTheDocument();
    expect(screen.getByText('展區規劃包括：AI 發展史。')).toBeInTheDocument();
  });

  test('selecting a theme displays details', async () => {
    const mockTheme = {
      title: 'AI 智慧特展',
      outline: '展區規劃包括：AI 發展史。',
      status: 'draft',
    };
    curationService.generateThemes.mockResolvedValue(mockTheme);

    render(<CurationThemeGenerator />);

    // Fill form and generate
    fireEvent.change(screen.getByLabelText(/關鍵字/), { target: { value: 'AI' } });
    fireEvent.change(screen.getByLabelText(/當前時事熱門話題/), { target: { value: 'AI' } });
    fireEvent.click(screen.getByRole('button', { name: /生成策展主題/i }));

    await waitFor(() => {
      expect(screen.getByText('AI 智慧特展')).toBeInTheDocument();
    });

    // Click on the generated card
    const card = screen.getByText('AI 智慧特展').closest('.ant-card-hoverable');
    fireEvent.click(card);

    // Verify detail section renders json
    expect(screen.getByText(/選擇的主題詳情/i)).toBeInTheDocument();
    expect(screen.getByText(/"title": "AI 智慧特展"/i)).toBeInTheDocument();
  });

  test('deletes a theme card on delete click', async () => {
    const mockTheme = {
      title: 'AI 智慧特展',
      outline: '展區規劃包括：AI 發展史。',
      status: 'draft',
    };
    curationService.generateThemes.mockResolvedValue(mockTheme);

    const { container } = render(<CurationThemeGenerator />);

    // Fill form and generate
    fireEvent.change(screen.getByLabelText(/關鍵字/), { target: { value: 'AI' } });
    fireEvent.change(screen.getByLabelText(/當前時事熱門話題/), { target: { value: 'AI' } });
    fireEvent.click(screen.getByRole('button', { name: /生成策展主題/i }));

    await waitFor(() => {
      expect(screen.getByText('AI 智慧特展')).toBeInTheDocument();
    });

    // Click delete button
    const deleteBtn = container.querySelector('.anticon-delete').closest('button');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(message.success).toHaveBeenCalledWith('主題已刪除');
    });

    expect(screen.queryByText('AI 智慧特展')).not.toBeInTheDocument();
  });
});
