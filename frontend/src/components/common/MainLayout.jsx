import { useMemo } from 'react'
import { Layout } from 'antd'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import './MainLayout.css'

const { Content } = Layout

const pageTitles = {
  '/': '首頁｜策展工作總覽',
  '/curation': '策展前｜AI 智慧策展發想',
  '/proposal': '策展中｜企劃編輯與匯出',
  '/dashboard': '策展後｜效益分析戰情室',
  '/import': '資料工具｜館藏匯入',
}

const MainLayout = ({ children }) => {
  const location = useLocation()
  const pageTitle = useMemo(() => pageTitles[location.pathname] || 'RA2 智慧策展系統', [location.pathname])

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
