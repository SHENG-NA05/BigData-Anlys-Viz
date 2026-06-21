import { useState } from 'react'
import { Button, Form, Input, message } from 'antd'
import { KeyRound, Lock, LogIn, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../../services/authService'
import './LoginView.css'

const LoginView = () => {
  const [loading, setLoading] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [form] = Form.useForm()
  const navigate = useNavigate()

  const fillDemoCredentials = () => {
    form.setFieldsValue({
      username: 'demo_curator',
      password: 'demo-password-for-local-testing-only',
    })
    setPasswordVisible(true)
  }

  const handleLogin = async (values) => {
    setLoading(true)
    try {
      await authService.login(values.username, values.password)
      message.success('登入成功')
      navigate('/')
    } catch (error) {
      message.error(error.response?.data?.detail || error.message || '登入失敗')
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

        <Form form={form} onFinish={handleLogin} layout="vertical">
          <Form.Item name="username" rules={[{ required: true, message: '請輸入帳號' }]}>
            <Input prefix={<User size={17} />} placeholder="帳號 / Email" size="large" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '請輸入密碼' }]}>
            <Input.Password
              prefix={<Lock size={17} />}
              placeholder="密碼"
              size="large"
              visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
            />
          </Form.Item>
          <Button
            className="login-demo-button"
            htmlType="button"
            size="large"
            block
            icon={<KeyRound size={17} />}
            onClick={fillDemoCredentials}
          >
            填入測試帳密
          </Button>
          <Button type="primary" htmlType="submit" size="large" block loading={loading} icon={<LogIn size={17} />}>
            登入
          </Button>
        </Form>

      </section>
    </div>
  )
}

export default LoginView
