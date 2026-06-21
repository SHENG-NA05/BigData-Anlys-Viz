import React, { useEffect, useMemo, useState } from 'react'
import { Progress, Upload, message } from 'antd'
import {
  CheckCircle2,
  Database,
  Download,
  FileSpreadsheet,
  Inbox,
  Search,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import { catalogService } from '../../../services/catalogService'
import './CatalogImport.css'

const { Dragger } = Upload

const demoHistory = [
  { id: 1, fileName: 'future_catalog_sample.csv', status: 'success', recordsCount: 50, vectorizedCount: 50, uploadedAt: '2025/05/19 14:32' },
  { id: 2, fileName: 'media_assets.xlsx', status: 'success', recordsCount: 128, vectorizedCount: 112, uploadedAt: '2025/05/18 16:10' },
]

const CatalogImport = () => {
  const [history, setHistory] = useState(demoHistory)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const loadHistory = async () => {
      const records = await catalogService.getUploadHistory()
      if (Array.isArray(records) && records.length) {
        setHistory(records.map((item, index) => ({
          id: index,
          fileName: item.source_file || item.fileName || `catalog-${index + 1}.csv`,
          status: item.status || 'success',
          recordsCount: item.records_count || item.recordsCount || 0,
          vectorizedCount: item.vectorized_count || item.vectorizedCount || 0,
          uploadedAt: item.imported_at ? new Date(item.imported_at).toLocaleString() : item.uploadedAt || '-',
        })))
      }
    }

    loadHistory()
  }, [])

  const stats = useMemo(() => {
    const success = history.filter((item) => item.status === 'success')
    const records = history.reduce((sum, item) => sum + (item.recordsCount || 0), 0)
    const vectors = history.reduce((sum, item) => sum + (item.vectorizedCount || 0), 0)
    return [
      { label: '成功匯入檔案', value: `${success.length} 組`, icon: CheckCircle2 },
      { label: '館藏資料筆數', value: records.toLocaleString(), icon: Database },
      { label: '已建立索引', value: vectors.toLocaleString(), icon: ShieldCheck },
      { label: '匯入成功率', value: `${history.length ? Math.round((success.length / history.length) * 100) : 0}%`, icon: UploadCloud },
    ]
  }, [history])

  const beforeUpload = (file) => {
    const supported = /\.(csv|xlsx)$/i.test(file.name)
    if (!supported) {
      message.error('請上傳 CSV 或 XLSX 檔案')
      return Upload.LIST_IGNORE
    }
    if (file.size / 1024 / 1024 > 10) {
      message.error('檔案大小需小於 10MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  const handleUpload = async ({ file, onSuccess, onError }) => {
    setUploading(true)
    setProgress(15)
    try {
      const validation = await catalogService.validateFile(file)
      if (validation.status === 'error') {
        throw new Error(validation.detail)
      }

      setProgress(45)
      const response = await catalogService.uploadCatalog(file)
      setProgress(100)

      const importedCount = response.imported_count || response.records_count || 0
      setHistory((current) => [
        {
          id: Date.now(),
          fileName: file.name,
          status: 'success',
          recordsCount: importedCount,
          vectorizedCount: response.vectorized_count || importedCount,
          uploadedAt: new Date().toLocaleString(),
        },
        ...current,
      ])
      message.success(`已匯入 ${importedCount} 筆資料`)
      onSuccess?.(response)
    } catch (error) {
      setHistory((current) => [
        {
          id: Date.now(),
          fileName: file.name,
          status: 'error',
          recordsCount: 0,
          vectorizedCount: 0,
          uploadedAt: new Date().toLocaleString(),
          error: error.message,
        },
        ...current,
      ])
      message.error(error.message || '匯入失敗')
      onError?.(error)
    } finally {
      setTimeout(() => setProgress(0), 800)
      setUploading(false)
    }
  }

  const downloadTemplate = () => {
    const content = 'title,isbn,classification_no,summary\n未來城市,978-1234567890,733.4,探討智慧城市與永續生活的館藏摘要\n'
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'catalog_template.csv'
    link.click()
    URL.revokeObjectURL(url)
    message.success('已下載範本')
  }

  return (
    <div className="catalog-import-page">
      <section className="catalog-hero">
        <div>
          <span className="ra-hero-icon"><Database size={27} /></span>
          <h1>資料庫與素材管理</h1>
          <p>匯入館藏、素材與引用來源，建立可供 AI 策展比對的資料基礎。</p>
        </div>
        <button className="ra-secondary-button" onClick={downloadTemplate}>
          <Download size={17} />
          下載匯入範本
        </button>
      </section>

      <section className="catalog-stats ra-panel">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <article key={stat.label}>
              <Icon size={23} />
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </article>
          )
        })}
      </section>

      <section className="catalog-grid">
        <article className="ra-panel upload-panel">
          <h2><Inbox size={20} />上傳資料檔</h2>
          <Dragger
            name="file"
            multiple={false}
            beforeUpload={beforeUpload}
            customRequest={handleUpload}
            disabled={uploading}
            accept=".csv,.xlsx"
            showUploadList={false}
          >
            <p className="upload-icon"><UploadCloud size={52} /></p>
            <p className="upload-title">拖曳檔案到此處，或點擊選擇檔案</p>
            <p className="upload-hint">支援 CSV / XLSX，單檔上限 10MB。</p>
          </Dragger>
          {progress > 0 && (
            <div className="upload-progress">
              <Progress percent={progress} status={progress === 100 ? 'success' : 'active'} />
            </div>
          )}
        </article>

        <article className="ra-panel import-guide">
          <h2><FileSpreadsheet size={20} />欄位格式</h2>
          <ul>
            <li><strong>title</strong> 館藏或素材名稱</li>
            <li><strong>isbn</strong> ISBN 或內部識別碼</li>
            <li><strong>classification_no</strong> 分類號</li>
            <li><strong>summary</strong> 可供語意比對的摘要</li>
          </ul>
          <button onClick={() => message.info('已檢查目前匯入欄位格式')}>檢查欄位格式</button>
        </article>
      </section>

      <section className="ra-panel history-panel">
        <div className="panel-title-row">
          <h2>匯入紀錄</h2>
          <button onClick={() => message.info('已重新整理匯入紀錄')}>
            <Search size={16} />
            重新整理
          </button>
        </div>
        <div className="history-table">
          <div className="history-row header">
            <span>檔案名稱</span>
            <span>狀態</span>
            <span>資料筆數</span>
            <span>索引筆數</span>
            <span>上傳時間</span>
          </div>
          {history.map((item) => (
            <div className="history-row" key={item.id}>
              <span>{item.fileName}</span>
              <span className={item.status === 'success' ? 'success' : 'error'}>{item.status === 'success' ? '成功' : '失敗'}</span>
              <span>{item.recordsCount || '-'}</span>
              <span>{item.vectorizedCount || '-'}</span>
              <span>{item.uploadedAt}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default CatalogImport
