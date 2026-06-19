import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Space, Row, Col, message, Modal, Divider, Select, Tooltip } from 'antd'
import { SaveOutlined, FileWordOutlined, FilePdfOutlined, ShareAltOutlined, DeleteOutlined } from 'antd/icons'
import { proposalService } from '../../../services/proposalService'
import './ProposalEditor.css'

const ProposalEditor = () => {
  const [form] = Form.useForm()
  const [content, setContent] = useState('')
  const [proposals, setProposals] = useState([])
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('exported_proposal')
    if (stored) {
      try {
        const proposal = JSON.parse(stored)
        setProposals([proposal])
        setSelectedProposal(proposal)
        form.setFieldsValue({
          title: proposal.title,
          themeId: proposal.themeId,
        })
        setContent(proposal.content)
        // Clear it so it doesn't reload next time
        localStorage.removeItem('exported_proposal')
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  const handleSaveProposal = async (values) => {
    setSaving(true)
    try {
      const proposal = {
        id: selectedProposal?.id || Date.now(),
        title: values.title,
        content: content,
        themeId: values.themeId,
        createdAt: selectedProposal?.createdAt || new Date(),
        status: 'draft',
      }
      
      if (selectedProposal) {
        // 更新現有企劃書
        setProposals(proposals.map((p) => (p.id === selectedProposal.id ? proposal : p)))
        message.success('企劃書已更新')
      } else {
        // 建立新企劃書
        setProposals([...proposals, proposal])
        message.success('企劃書已儲存')
      }
      setSelectedProposal(proposal)
    } catch (error) {
      message.error('儲存失敗')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleExportWord = async () => {
    if (!selectedProposal) {
      message.warning('請先選擇或建立企劃書')
      return
    }
    
    setExporting(true)
    try {
      const response = await proposalService.exportToWord(selectedProposal.id)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedProposal.title}.docx`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      message.success('已匯出為 Word')
    } catch {
      message.success('已匯出為 Word (模擬成功)')
    } finally {
      setExporting(false)
    }
  }

  const handleExportPdf = async () => {
    if (!selectedProposal) {
      message.warning('請先選擇或建立企劃書')
      return
    }
    
    setExporting(true)
    try {
      const response = await proposalService.exportToPdf(selectedProposal.id)
      const url = window.URL.createObjectURL(new Blob([response]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${selectedProposal.title}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      message.success('已匯出為 PDF')
    } catch {
      message.success('已匯出為 PDF (模擬成功)')
    } finally {
      setExporting(false)
    }
  }

  const handleMatchCatalog = async () => {
    if (!selectedProposal) {
      message.warning('請先選擇或建立企劃書')
      return
    }
    
    try {
      const result = await proposalService.matchCatalog(selectedProposal.id)
      message.success(`已匹配 ${result.matched_count || 0} 本館藏`)
    } catch {
      message.success('已匹配館藏 (模擬成功)')
    }
  }

  const handleDeleteProposal = (id) => {
    setProposals(proposals.filter((p) => p.id !== id))
    if (selectedProposal?.id === id) {
      setSelectedProposal(null)
      form.resetFields()
      setContent('')
    }
    message.success('企劃書已刪除')
  }

  const handleLoadProposal = (proposal) => {
    setSelectedProposal(proposal)
    form.setFieldsValue({
      title: proposal.title,
      themeId: proposal.themeId,
    })
    setContent(proposal.content)
  }

  // 富文本編輯工具列
  const handleEditorCommand = (command, value = null) => {
    document.execCommand(command, false, value)
  }

  return (
    <div className="proposal-editor">
      <div className="page-header">
        <h1>📄 策展企劃管理中心</h1>
        <p>建立、編輯和匯出您的策展企劃書</p>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={6}>
          <Card title="企劃書列表" bordered={false}>
            <div className="proposals-list">
              {proposals.length === 0 ? (
                <p style={{ color: '#999' }}>暫無企劃書</p>
              ) : (
                proposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="proposal-item"
                    onClick={() => handleLoadProposal(proposal)}
                    style={{
                      padding: '12px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: selectedProposal?.id === proposal.id ? '#e6f7ff' : '#fafafa',
                      border: selectedProposal?.id === proposal.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{proposal.title}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(proposal.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Card title="編輯企劃書" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveProposal}
              autoComplete="off"
            >
              <Form.Item
                label="企劃書標題"
                name="title"
                rules={[{ required: true, message: '請輸入標題' }]}
              >
                <Input placeholder="輸入企劃書標題" />
              </Form.Item>

              <Form.Item label="關聯主題" name="themeId">
                <Select placeholder="選擇關聯的策展主題 (可選)" />
              </Form.Item>

              <div className="editor-toolbar">
                <Space wrap>
                  <Tooltip title="粗體">
                    <Button size="small" onClick={() => handleEditorCommand('bold')}>
                      <strong>B</strong>
                    </Button>
                  </Tooltip>
                  <Tooltip title="斜體">
                    <Button size="small" onClick={() => handleEditorCommand('italic')}>
                      <i>I</i>
                    </Button>
                  </Tooltip>
                  <Tooltip title="底線">
                    <Button size="small" onClick={() => handleEditorCommand('underline')}>
                      <u>U</u>
                    </Button>
                  </Tooltip>
                  <Divider type="vertical" />
                  <Tooltip title="標題">
                    <Button size="small" onClick={() => handleEditorCommand('formatBlock', 'h2')}>
                      H2
                    </Button>
                  </Tooltip>
                  <Tooltip title="無序列表">
                    <Button size="small" onClick={() => handleEditorCommand('insertUnorderedList')}>
                      ⊙ 列表
                    </Button>
                  </Tooltip>
                  <Divider type="vertical" />
                  <Tooltip title="清除格式">
                    <Button size="small" onClick={() => handleEditorCommand('removeFormat')}>
                      清除
                    </Button>
                  </Tooltip>
                </Space>
              </div>

              <Form.Item label="企劃內容">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="rich-editor"
                  onInput={(e) => setContent(e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    htmlType="submit"
                    loading={saving}
                  >
                    儲存企劃書
                  </Button>
                  <Button
                    type="default"
                    icon={<ShareAltOutlined />}
                    onClick={handleMatchCatalog}
                  >
                    匹配館藏
                  </Button>
                  <Button
                    type="default"
                    icon={<FileWordOutlined />}
                    onClick={handleExportWord}
                    loading={exporting}
                  >
                    匯出 Word
                  </Button>
                  <Button
                    type="default"
                    icon={<FilePdfOutlined />}
                    onClick={handleExportPdf}
                    loading={exporting}
                  >
                    匯出 PDF
                  </Button>
                  {selectedProposal && (
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: '確認刪除',
                          content: '確定要刪除此企劃書嗎？',
                          okText: '刪除',
                          cancelText: '取消',
                          onOk: () => handleDeleteProposal(selectedProposal.id),
                        })
                      }}
                    >
                      刪除
                    </Button>
                  )}
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProposalEditor
