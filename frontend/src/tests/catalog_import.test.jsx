import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogImport from '../components/curation_management/views/catalog_import';
import { catalogService } from '../services/catalogService';
import { message } from 'antd';

// Mock catalogService
jest.mock('../services/catalogService', () => ({
  catalogService: {
    validateFile: jest.fn(),
    uploadCatalog: jest.fn(),
  },
}));

describe('CatalogImport Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset window URL mocking
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    message.success = jest.fn();
    message.error = jest.fn();
  });

  test('renders page layout correctly', () => {
    render(<CatalogImport />);
    expect(screen.getByRole('heading', { name: /館藏資料匯入中心/i })).toBeInTheDocument();
    expect(screen.getByText(/點擊或拖曳檔案到此區域上傳/i)).toBeInTheDocument();
    expect(screen.getByText(/下載匯入範本/i)).toBeInTheDocument();
    expect(screen.getByText(/已匯入檔案/i)).toBeInTheDocument();
    expect(screen.getByText(/累計館藏筆數/i)).toBeInTheDocument();
  });

  test('triggers templates download when clicking template button', () => {
    render(<CatalogImport />);
    const downloadBtn = screen.getByRole('button', { name: /下載匯入範本/i });
    
    // Spy on document.body.appendChild
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    fireEvent.click(downloadBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(message.success).toHaveBeenCalledWith('已下載模板');
    appendSpy.mockRestore();
  });

  test('handleBeforeUpload rejects non-csv and non-xlsx files', async () => {
    render(<CatalogImport />);
    
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    
    // We get Dragger props by retrieving container
    const dragger = screen.getByText(/點擊或拖曳檔案到此區域上傳/i).closest('.ant-upload');
    
    // We trigger beforeUpload by direct simulate drop or file input change
    const fileInput = dragger.querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('請上傳 Excel (.xlsx) 或 CSV 檔案');
    });
  });

  test('handleBeforeUpload rejects files larger than 10MB', async () => {
    render(<CatalogImport />);
    
    const file = new File([''], 'test.csv', { type: 'text/csv' });
    // Mock size property to be > 10MB
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    
    const dragger = screen.getByText(/點擊或拖曳檔案到此區域上傳/i).closest('.ant-upload');
    const fileInput = dragger.querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('檔案大小不能超過 10MB');
    });
  });

  test('completes upload flow on successful file selection', async () => {
    catalogService.validateFile.mockResolvedValue({ records_count: 50 });
    catalogService.uploadCatalog.mockResolvedValue({ records_count: 50, vectorized_count: 48 });

    render(<CatalogImport />);
    
    const file = new File(['title,isbn,classification_no\nBook1,123456,540'], 'test.csv', { type: 'text/csv' });
    const dragger = screen.getByText(/點擊或拖曳檔案到此區域上傳/i).closest('.ant-upload');
    const fileInput = dragger.querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Wait for the mock timer upload simulation progress (200ms * 10 steps) to pass
    await waitFor(() => {
      expect(catalogService.validateFile).toHaveBeenCalledWith(file);
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(catalogService.uploadCatalog).toHaveBeenCalledWith(file);
    }, { timeout: 5000 });

    await waitFor(() => {
      // Check message
      expect(message.success).toHaveBeenCalledWith(expect.stringContaining('成功匯入 50 筆館藏記錄'));
    });

    // Check if table has updated
    expect(screen.getAllByText('test.csv').length).toBeGreaterThanOrEqual(1);
  });

  test('adds error record to import history on upload failure', async () => {
    catalogService.validateFile.mockRejectedValue(new Error('Validation error'));

    render(<CatalogImport />);
    
    const file = new File(['invalid'], 'bad.csv', { type: 'text/csv' });
    const dragger = screen.getByText(/點擊或拖曳檔案到此區域上傳/i).closest('.ant-upload');
    const fileInput = dragger.querySelector('input[type="file"]');
    
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('上傳失敗，請稍後重試');
    }, { timeout: 3000 });

    expect(screen.getAllByText('bad.csv').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('失敗')).toBeInTheDocument();
  });
});
