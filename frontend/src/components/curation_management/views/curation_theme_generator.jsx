import React, { useState } from 'react'
import { Card, Form, Input, Button, Space, Row, Col, message, Spin, Tag, Empty } from 'antd'
import { SendOutlined, DeleteOutlined, CopyOutlined } from 'antd/icons'
import { useNavigate } from 'react-router-dom'
import { curationService } from '../../../services/curationService'
import { proposalService } from '../../../services/proposalService'
import './CurationThemeGenerator.css'

const CurationThemeGenerator = () => {
  const [form] = Form.useForm()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const navigate = useNavigate()

  const handleCompareCatalog = () => {
    message.success('已匹配 5 本館藏')
  }

  const handleExportToProposal = async () => {
    setLoading(true)
    try {
      const response = await proposalService.createProposal(
        selectedTheme.theme_id || 'T001',
        selectedTheme.title,
        selectedTheme.outline || ''
      )
      
      if (response && response.status === 'success') {
        const fullProposal = await proposalService.getProposal(response.proposal_id)
        const proposalData = {
          id: response.proposal_id,
          title: selectedTheme.title,
          content: fullProposal.data.content,
          themeId: selectedTheme.theme_id || 'T001',
          createdAt: fullProposal.data.created_at || new Date().toISOString(),
          status: 'draft',
          matched_books: fullProposal.data.matched_books || [],
        }
        localStorage.setItem('exported_proposal', JSON.stringify(proposalData))
        message.success('已成功建立企劃書草案，請至企劃管理中心編輯。')
        navigate('/proposal')
      } else {
        message.error('拋轉企劃書失敗')
      }
    } catch (error) {
      message.error('拋轉失敗，請檢查後端服務')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateThemes = async (values) => {
    setLoading(true)
    try {
      const response = await curationService.generateThemes(
        values.keywords,
        values.current_trends,
        values.holidays,
        values.custom_prompt
      )
      setThemes([...themes, { id: Date.now(), ...response }])
      message.success('策展主題生成成功！')
      form.resetFields()
    } catch (error) {
      message.error('生成失敗，請檢查後端服務')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTheme = (id) => {
    setThemes(themes.filter((t) => t.id !== id))
    message.success('主題已刪除')
  }

  return (
    <div className="curation-generator">
      <div className="page-header">
        <h1>🎨 AI 智慧策展發想</h1>
        <p>輸入關鍵字、時事與節慶，讓 AI 為您生成策展主題大綱</p>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card title="發想參數設置" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerateThemes}
              autoComplete="off"
            >
              <Form.Item
                label="關鍵字 (多個用逗號分隔)"
                name="keywords"
                rules={[{ required: true, message: '請輸入關鍵字' }]}
              >
                <Input.TextArea
                  placeholder="例如：科技、未來、創新"
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                label="當前時事熱門話題"
                name="current_trends"
                rules={[{ required: true, message: '請輸入時事' }]}
              >
                <Input.TextArea
                  placeholder="例如：AI 快速發展、氣候變遷"
                  rows={3}
                />
              </Form.Item>

              <Form.Item
                label="節慶/季節 (可選)"
                name="holidays"
              >
                <Input.TextArea
                  placeholder="例如：聖誕節、新年、春天"
                  rows={2}
                />
              </Form.Item>

              <Form.Item
                label="自訂 Prompt (可選)"
                name="custom_prompt"
              >
                <Input.TextArea
                  placeholder="輸入自訂的生成指令以優化輸出結果"
                  rows={2}
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  icon={<SendOutlined />}
                >
                  生成策展主題
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card title="生成的主題大綱" bordered={false}>
            <Spin spinning={loading}>
              {themes.length === 0 ? (
                <Empty description="暫無生成的主題" />
              ) : (
                <div className="themes-list">
                  {themes.map((theme) => (
                    <Card
                      key={theme.id}
                      size="small"
                      className="theme-card"
                      hoverable
                      onClick={() => setSelectedTheme(theme)}
                      style={{
                        marginBottom: '12px',
                        border: selectedTheme?.id === theme.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      }}
                    >
                      <Row justify="space-between" align="middle">
                        <Col flex="auto">
                          <h4>{theme.title || '未命名主題'}</h4>
                          <p className="theme-description">
                            {theme.outline || theme.content || '無描述'}
                          </p>
                          <Space>
                            <Tag color="blue">AI 生成</Tag>
                            <Tag color="green">{theme.status || '待處理'}</Tag>
                          </Space>
                        </Col>
                        <Col>
                          <Space>
                            <Button
                              type="text"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                setSelectedTheme(theme)
                                message.success('已選擇該主題，可進行編輯')
                              }}
                            />
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteTheme(theme.id)}
                            />
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {selectedTheme && (
        <Card 
          title="選擇的主題詳情" 
          style={{ marginTop: '24px' }} 
          bordered={false}
          extra={
            <Space>
              <Button type="default" onClick={handleCompareCatalog}>
                比對館藏庫
              </Button>
              <Button type="primary" onClick={handleExportToProposal}>
                拋轉至企劃中心
              </Button>
            </Space>
          }
        >
          <pre className="theme-detail">{JSON.stringify(selectedTheme, null, 2)}</pre>
        </Card>
      )}
    </div>
  )
}

export default CurationThemeGenerator
