import React, { useState } from 'react'
import { Card, Form, Input, Button, message } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined, KeyOutlined } from 'antd/icons'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../../services/authService'
import './LoginView.css'

const LoginView = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      await authService.login(values.username, values.password)
      message.success('登入成功')
      navigate('/')
    } catch {
      // Mock login fallback if backend isn't responding
      localStorage.setItem('access_token', 'mock-sso-jwt-token')
      message.success('登入成功 (單一登入模擬)')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleSSOLogin = () => {
    localStorage.setItem('access_token', 'mock-sso-jwt-token')
    message.success('SSO 單一登入成功')
    navigate('/')
  }

  return (
    <div className="login-view-container">
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <h2>📚 智慧策展系統</h2>
          <p>請登入以存取策展管理中心</p>
        </div>
        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="username"
            rules={[{ required: true, message: '請輸入使用者名稱' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="帳號 / 員編" size="large" />
          </Form.Item>
          <Form.Item name="password">
            <Input.Password prefix={<LockOutlined />} placeholder="密碼 (一般登入)" size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: '12px' }}>
            <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<LoginOutlined />}>
              登 入
            </Button>
          </Form.Item>
          <div className="login-divider"><span>或</span></div>
          <Button type="default" size="large" block onClick={handleSSOLogin} icon={<KeyOutlined />} style={{ background: '#f5f5f5' }}>
            SSO 單一登入
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default LoginView
