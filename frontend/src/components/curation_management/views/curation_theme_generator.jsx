import React, { useState, useEffect } from 'react'
import { Card, Form, Input, Button, Space, Row, Col, message, Spin, Tag, Empty, Divider } from 'antd'
import { SendOutlined, DeleteOutlined, CopyOutlined } from 'antd/icons'
import { useNavigate } from 'react-router-dom'
import { curationService } from '../../../services/curationService'
import { proposalService } from '../../../services/proposalService'
import { catalogService } from '../../../services/catalogService'
import './CurationThemeGenerator.css'

const CurationThemeGenerator = () => {
  const [form] = Form.useForm()
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(false)
  const [compareLoading, setCompareLoading] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(null)
  const [matchedBooks, setMatchedBooks] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const loadThemes = async () => {
      try {
        const result = await curationService.getThemeHistory()
        if (result && result.data) {
          const list = result.data.map((t, idx) => ({
            id: t.theme_id || idx,
            theme_id: t.theme_id,
            title: t.title,
            outline: t.outline,
            target_audience: t.target_audience,
            keywords: t.keywords,
            status: 'AI 生成'
          }))
          setThemes(list)
        }
      } catch (error) {
        console.error(error)
      }
    }
    loadThemes()
  }, [])

  useEffect(() => {
    setMatchedBooks([])
  }, [selectedTheme])

  const handleCompareCatalog = async () => {
    if (!selectedTheme) {
      message.warning('請先選擇一個策展主題')
      return
    }

    setCompareLoading(true)
    try {
      const keywords = [
        selectedTheme.title,
        selectedTheme.outline || ''
      ]
      if (selectedTheme.keywords && Array.isArray(selectedTheme.keywords)) {
        keywords.push(...selectedTheme.keywords)
      }

      const result = await catalogService.matchCatalog(keywords)
      if (result && result.status === 'success') {
        setMatchedBooks(result.data || [])
        message.success(`已成功比對，匹配到 ${result.data?.length || 0} 本相關館藏`)
      } else {
        message.error('比對館藏失敗')
      }
    } catch (error) {
      console.error(error)
      message.error('比對館藏服務錯誤，請確認已匯入館藏資料且資料庫運行中')
    } finally {
      setCompareLoading(false)
    }
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
      
      const newThemes = response.map((theme, index) => ({
        id: `${Date.now()}-${index}`,
        ...theme
      }))

      setThemes([...themes, ...newThemes])
      message.success('策展主題生成成功！')
      form.resetFields()
    } catch (error) {
      message.error('生成失敗，請檢查後端服務')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTheme = async (theme) => {
    try {
      if (theme.theme_id) {
        await curationService.deleteTheme(theme.theme_id)
      }
      setThemes(themes.filter((t) => t.id !== theme.id))
      message.success('主題已刪除')
      if (selectedTheme?.id === theme.id) {
        setSelectedTheme(null)
      }
    } catch (error) {
      console.error(error)
      message.error('刪除主題失敗')
    }
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
                        <Col style={{ marginLeft: '16px' }}>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTheme(theme);
                              }}
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
          title={<strong style={{ fontSize: '18px' }}>🎨 選擇的主題詳情：{selectedTheme.title}</strong>}
          style={{ marginTop: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
          bordered={false}
          extra={
            <Space>
              <Button 
                type="default" 
                onClick={handleCompareCatalog}
                loading={compareLoading}
              >
                比對館藏庫
              </Button>
              <Button 
                type="primary" 
                onClick={handleExportToProposal}
                loading={loading}
              >
                拋轉至企劃中心
              </Button>
            </Space>
          }
        >
          <div style={{ padding: '8px', fontSize: '14px', lineHeight: '2' }}>
            <div style={{ marginBottom: '16px' }}>
              <strong>📋 策展規劃大綱：</strong>
              <div style={{ 
                background: '#f9f9f9', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                marginTop: '8px',
                borderLeft: '4px solid #1890ff',
                color: '#434343'
              }}>
                {selectedTheme.outline || '（無大綱）'}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <strong>👥 預估受眾：</strong>
              <Tag color="purple" style={{ marginLeft: '8px', fontSize: '13px', padding: '2px 8px' }}>
                {selectedTheme.target_audience || '一般讀者'}
              </Tag>
            </div>

            {selectedTheme.keywords && selectedTheme.keywords.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <strong>🏷️ 關鍵字：</strong>
                <Space wrap style={{ marginLeft: '8px' }}>
                  {selectedTheme.keywords.map((kw, i) => (
                    <Tag key={i} color="blue">{kw}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>

          {matchedBooks && matchedBooks.length > 0 && (
            <>
              <Divider orientation="left">📚 推薦比對符合館藏 ({matchedBooks.length})</Divider>
              <div className="matched-books-section" style={{ marginTop: '16px' }}>
                <Row gutter={[16, 16]}>
                  {matchedBooks.map((book, idx) => (
                    <Col xs={24} md={12} key={book.book_id || idx}>
                      <Card 
                        size="small" 
                        bordered
                        style={{ 
                          borderRadius: '8px', 
                          background: '#fafafa',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                        title={<strong style={{ fontSize: '15px', color: '#262626' }}>{book.title}</strong>}
                        extra={<Tag color="blue" style={{ fontSize: '12px', fontWeight: 'bold' }}>評分: {book.match_score}</Tag>}
                      >
                        <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#595959' }}>
                          <div><strong>作者：</strong>{book.author || '未知'}</div>
                          <div><strong>ISBN：</strong>{book.isbn}</div>
                          <div><strong>分類號：</strong><Tag color="cyan" style={{ border: 'none' }}>{book.classification_no}</Tag></div>
                          {book.match_reason && (
                            <div style={{ 
                              marginTop: '8px', 
                              fontSize: '12px', 
                              color: '#8c8c8c', 
                              background: '#f5f5f5', 
                              padding: '6px 10px', 
                              borderRadius: '4px', 
                              borderLeft: '3px solid #1890ff',
                              lineHeight: '1.5'
                            }}>
                              <strong>匹配原因：</strong>{book.match_reason}
                            </div>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}

export default CurationThemeGenerator
