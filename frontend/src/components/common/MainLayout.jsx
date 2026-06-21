import { useMemo } from 'react'
import { Layout } from 'antd'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import './MainLayout.css'

const { Content } = Layout

const pageTitles = {
  '/': '策展主題發想',
  '/proposal': '策展內容整合',
  '/dashboard': '策展成效洞察',
  '/import': '館藏資料管理',
}

const MainLayout = ({ children }) => {
  const location = useLocation()
  const pageTitle = useMemo(() => pageTitles[location.pathname] || '策展主題發想', [location.pathname])

  return (
    <Layout className="ra-shell">
      <Sidebar />
      <Layout className="ra-main-shell">
        <header className="ra-topbar">
          <div className="ra-topbar-title">{pageTitle}</div>
        </header>
        <Content className="ra-main-content">{children}</Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
