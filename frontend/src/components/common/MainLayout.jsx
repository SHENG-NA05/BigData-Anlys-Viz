import React from 'react'
import { Layout } from 'antd'
import Sidebar from './Sidebar'
import './MainLayout.css'

const { Content } = Layout

const MainLayout = ({ children }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Content className="main-content">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
