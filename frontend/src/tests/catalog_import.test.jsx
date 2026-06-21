import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { message } from 'antd'
import CatalogImport from '../components/curation_management/views/catalog_import'
import { catalogService } from '../services/catalogService'

jest.mock('../services/catalogService', () => ({
  catalogService: {
    getUploadHistory: jest.fn(() => Promise.resolve([])),
    validateFile: jest.fn(),
    uploadCatalog: jest.fn(),
  },
}))

describe('CatalogImport RA workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
    window.URL.revokeObjectURL = jest.fn()
    HTMLAnchorElement.prototype.click = jest.fn()
    message.success = jest.fn()
    message.error = jest.fn()
  })

  test('renders data import page', async () => {
    render(<CatalogImport />)

    expect(screen.getByRole('heading', { name: '資料庫與素材管理' })).toBeInTheDocument()
    expect(screen.getByText('成功匯入檔案')).toBeInTheDocument()
    expect(screen.getByText('拖曳檔案到此處，或點擊選擇檔案')).toBeInTheDocument()

    await waitFor(() => {
      expect(catalogService.getUploadHistory).toHaveBeenCalled()
    })
  })

  test('downloads import template', () => {
    render(<CatalogImport />)

    fireEvent.click(screen.getByRole('button', { name: /下載匯入範本/ }))

    expect(window.URL.createObjectURL).toHaveBeenCalled()
    expect(message.success).toHaveBeenCalledWith('已下載範本')
  })

})
