import React, { useState } from 'react'
import { Card, Upload, Button, Table, Progress, message, Row, Col, Statistic, Tag, Modal, Space } from 'antd'
import { InboxOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import { catalogService } from '../../../services/catalogService'
import './CatalogImport.css'

const CatalogImport = () => {
  const [uploading, setUploading] = useState(false)
  const [importHistory, setImportHistory] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationResult, setValidationResult] = useState(null)

  const handleBeforeUpload = async (file) => {
    // 文件驗證
    const isExcelOrCsv = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'text/csv' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.csv')
    
    if (!isExcelOrCsv) {
      message.error('請上傳 Excel (.xlsx) 或 CSV 檔案')
      return false
    }

    const isLessThan10MB = file.size / 1024 / 1024 < 10
    if (!isLessThan10MB) {
      message.error('檔案大小不能超過 10MB')
      return false
    }

    return true
  }

  const handleUpload = async ({ file, onSuccess, onError }) => {
    if (!file) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // 驗證文件
      const validationResponse = await catalogService.validateFile(file)
      setValidationResult(validationResponse)

      // 模擬上傳進度
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setUploadProgress(i)
      }

      // 上傳文件
      const response = await catalogService.uploadCatalog(file)
      
      // 添加到歷史記錄
      const importRecord = {
        id: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toLocaleString(),
        status: 'success',
        recordsCount: response.imported_count || response.records_count || 0,
        vectorizedCount: response.imported_count || response.vectorized_count || 0,
      }

      setImportHistory([importRecord, ...importHistory])
      message.success(`成功匯入 ${importRecord.recordsCount} 筆館藏記錄`)
      setUploadProgress(0)
      onSuccess?.(response)
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || '上傳失敗，請稍後重試'
      const importRecord = {
        id: Date.now(),
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date().toLocaleString(),
        status: 'error',
        error: errorMessage,
      }
      setImportHistory([importRecord, ...importHistory])
      message.error(errorMessage)
      onError?.(error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownloadTemplate = () => {
    // 下載模板文件
    const templateContent = 'title,isbn,classification_no,author,publisher,publication_year,summary\n範例書籍,978-1234567890,733.4,王小明,示範出版社,2025,這是一本範例書籍'
    const blob = new Blob([templateContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'catalog_template.csv')
    document.body.appendChild(link)
    link.click()
    link.parentNode.removeChild(link)
    message.success('已下載模板')
  }

  const columns = [
    {
      title: '檔案名稱',
      dataIndex: 'fileName',
      key: 'fileName',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'success' ? 'green' : 'red'}>
          {status === 'success' ? '成功' : '失敗'}
        </Tag>
      ),
    },
    {
      title: '館藏筆數',
      dataIndex: 'recordsCount',
      key: 'recordsCount',
      render: (count) => count || '-',
    },
    {
      title: '向量化筆數',
      dataIndex: 'vectorizedCount',
      key: 'vectorizedCount',
      render: (count) => count || '-',
    },
    {
      title: '上傳時間',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
    },
    {
      title: '錯誤訊息',
      dataIndex: 'error',
      key: 'error',
      render: (error) => error || '-',
    },
  ]

  return (
    <div className="catalog-import">
      <div className="page-header">
        <h1>📥 館藏資料匯入中心</h1>
        <p>上傳 Excel 或 CSV 檔案，自動解析並匯入館藏資料</p>
      </div>

      {/* 統計信息 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="已匯入檔案"
              value={importHistory.filter((h) => h.status === 'success').length}
              suffix="個"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="累計館藏筆數"
              value={importHistory.reduce((sum, h) => sum + (h.recordsCount || 0), 0)}
              suffix="筆"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="已向量化筆數"
              value={importHistory.reduce((sum, h) => sum + (h.vectorizedCount || 0), 0)}
              suffix="筆"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="上傳成功率"
              value={
                importHistory.length > 0
                  ? ((importHistory.filter((h) => h.status === 'success').length / importHistory.length) * 100).toFixed(1)
                  : 0
              }
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 上傳區域 */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="上傳檔案" bordered={false}>
            <Upload.Dragger
              name="file"
              multiple={false}
              beforeUpload={handleBeforeUpload}
              customRequest={handleUpload}
              disabled={uploading}
              accept=".xlsx,.csv"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">點擊或拖曳檔案到此區域上傳</p>
              <p className="ant-upload-hint">支援 Excel (.xlsx) 和 CSV 檔案，檔案大小不超過 10MB</p>
            </Upload.Dragger>

            {uploading && (
              <div style={{ marginTop: '20px' }}>
                <Progress percent={uploadProgress} status={uploading ? 'active' : 'success'} />
                <p style={{ marginTop: '10px', textAlign: 'center' }}>上傳中... {uploadProgress}%</p>
              </div>
            )}

            {validationResult && (
              <Card style={{ marginTop: '20px' }} size="small" title="驗證結果">
                <p>✓ 檔案格式正確</p>
                <p>✓ 發現 {validationResult.records_count || 0} 筆記錄</p>
                <p>✓ 可進行匯入</p>
              </Card>
            )}

            <div style={{ marginTop: '20px' }}>
              <Button block onClick={handleDownloadTemplate} icon={<DownloadOutlined />}>
                下載匯入範本
              </Button>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="匯入說明" bordered={false}>
            <div className="import-guide">
              <h4>📋 檔案格式要求</h4>
              <ul>
                <li><strong>必需欄位：</strong></li>
                <ul>
                  <li>title - 書名</li>
                  <li>isbn - ISBN 碼</li>
                  <li>classification_no - 圖書分類法分類號</li>
                </ul>
                <li><strong>可選欄位：</strong></li>
                <ul>
                  <li>summary - 書籍簡介</li>
                </ul>
              </ul>

              <h4 style={{ marginTop: '20px' }}>⚙️ 處理流程</h4>
              <ol>
                <li>上傳 Excel 或 CSV 檔案</li>
                <li>系統驗證檔案格式與內容</li>
                <li>使用 AI Embedding API 生成向量</li>
                <li>批次寫入 PostgreSQL 資料庫</li>
                <li>建立向量索引以加速搜尋</li>
              </ol>

              <h4 style={{ marginTop: '20px' }}>💡 提示</h4>
              <ul>
                <li>單次上傳建議不超過 10,000 筆記錄</li>
                <li>ISBN 必須有效且不重複</li>
                <li>建議使用 UTF-8 編碼</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 上傳歷史 */}
      <Row style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card title="上傳歷史" bordered={false}>
            <Table
              dataSource={importHistory}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default CatalogImport
