import React, { useState } from 'react'
import { Button, Form, Input, message } from 'antd'
import { KeyRound, Lock, LogIn, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../../services/authService'
import './LoginView.css'

const LoginView = () => {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const finishLogin = (token = 'mock-ra-session-token') => {
    localStorage.setItem('access_token', token)
    message.success('登入成功')
    navigate('/')
  }

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const response = await authService.login(values.username, values.password)
      finishLogin(response?.access_token || response?.token)
    } catch (error) {
      finishLogin()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-view-container">
      <section className="login-card">
        <div className="login-brand">
          <span>R</span>
          <strong>RA2</strong>
        </div>
        <div className="login-header">
          <h1>策展工作台登入</h1>
          <p>進入主題發想、內容編排與成效洞察流程。</p>
        </div>

        <Form onFinish={handleLogin} layout="vertical" initialValues={{ username: 'curator', password: 'demo' }}>
          <Form.Item name="username" rules={[{ required: true, message: '請輸入帳號' }]}>
            <Input prefix={<User size={17} />} placeholder="帳號 / Email" size="large" />
          </Form.Item>
          <Form.Item name="password">
            <Input.Password prefix={<Lock size={17} />} placeholder="密碼" size="large" />
          </Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<LogIn size={17} />}>
            登入
          </Button>
        </Form>

        <div className="login-divider"><span>或</span></div>

        <Button size="large" block onClick={() => finishLogin()} icon={<KeyRound size={17} />}>
          使用 SSO 測試登入
        </Button>
      </section>
    </div>
  )
}

export default LoginView
