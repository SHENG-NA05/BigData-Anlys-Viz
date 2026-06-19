import React from 'react'
import { Layout, Menu, Avatar, Dropdown, Space } from 'antd'
import { LayoutOutlined, BgColorsOutlined, BarChartOutlined, ImportOutlined, LogoutOutlined, UserOutlined } from 'antd/icons'
import { useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import './Sidebar.css'

const { Sider } = Layout

const Sidebar = () => {
  const navigate = useNavigate()

  const menuItems = [
    {
      key: '1',
      icon: <BgColorsOutlined />,
      label: 'AI 智慧發想',
      onClick: () => navigate('/'),
    },
    {
      key: '2',
      icon: <LayoutOutlined />,
      label: '企劃管理中心',
      onClick: () => navigate('/proposal'),
    },
    {
      key: '3',
      icon: <BarChartOutlined />,
      label: '效益戰情室',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '4',
      icon: <ImportOutlined />,
      label: '館藏導入',
      onClick: () => navigate('/import'),
    },
  ]

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '登出',
      onClick: () => {
        authService.logout()
        navigate('/login')
      },
    },
  ]

  return (
    <Sider theme="dark" className="sidebar">
      <div className="sidebar-logo">
        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '30px' }}>
          📚 智慧策展系統
        </h2>
      </div>
      <Menu theme="dark" mode="inline" items={menuItems} />
      <div className="sidebar-footer">
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <Dropdown menu={{ items: userMenuItems }} placement="topRight">
            <span style={{ cursor: 'pointer', color: '#fff' }}>策展人</span>
          </Dropdown>
        </Space>
      </div>
    </Sider>
  )
}

export default Sidebar
