import { useMemo, useState } from 'react'
import { Avatar, Badge, Button, Input, Layout, Modal, message } from 'antd'
import { Bell, ChevronDown, Search } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import './MainLayout.css'

const { Content } = Layout

const pageTitles = {
  '/': '策展主題發想',
  '/proposal': '策展內容整合',
  '/dashboard': '策展成效洞察',
  '/import': '資料庫與素材管理',
}

const MainLayout = ({ children }) => {
  const location = useLocation()
  const [keyword, setKeyword] = useState('')

  const pageTitle = useMemo(() => pageTitles[location.pathname] || '策展主題發想', [location.pathname])

  const handleSearch = () => {
    const cleanKeyword = keyword.trim()
    if (!cleanKeyword) {
      message.info('請輸入要搜尋的專案、素材或筆記')
      return
    }

    Modal.info({
      title: '搜尋結果',
      content: `已搜尋「${cleanKeyword}」。目前可在主題、提案與素材中快速定位相關內容。`,
      okText: '知道了',
    })
  }

  return (
    <Layout className="ra-shell">
      <Sidebar />
      <Layout className="ra-main-shell">
        <header className="ra-topbar">
          <div className="ra-topbar-title">
            <span>{pageTitle}</span>
            <ChevronDown size={16} strokeWidth={2.3} />
          </div>

          <div className="ra-topbar-actions">
            <Input
              className="ra-search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onPressEnter={handleSearch}
              prefix={<Search size={15} />}
              suffix={<span className="ra-search-shortcut">⌘K</span>}
              placeholder="搜尋專案、素材、筆記..."
              allowClear
            />

            <Button
              type="text"
              className="ra-icon-button"
              onClick={() => {
                Modal.info({
                  title: '通知中心',
                  content: '目前有 3 則待處理提醒：素材授權、引用來源更新與協作者留言。',
                  okText: '查看',
                })
              }}
            >
              <Badge count={3} size="small" offset={[1, -1]}>
                <Bell size={20} />
              </Badge>
            </Button>

            <Button
              type="text"
              className="ra-user-button"
              onClick={() => {
                Modal.info({
                  title: '使用者資訊',
                  content: '林願展人，目前角色為策展負責人。',
                  okText: '關閉',
                })
              }}
            >
              <Avatar size={34} src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80" />
              <span>林願展人</span>
              <ChevronDown size={14} />
            </Button>
          </div>
        </header>

        <Content className="ra-main-content">{children}</Content>

        <footer className="ra-statusbar">
          <span>專案狀態：<strong>草案</strong></span>
          <span>最後儲存：2025/05/19 14:32</span>
          <span>協作者：6 人</span>
          <span className="ra-avatar-stack">
            <Avatar size={22}>王</Avatar>
            <Avatar size={22}>策</Avatar>
            <Avatar size={22}>林</Avatar>
            <span>+2</span>
          </span>
        </footer>
      </Layout>
    </Layout>
  )
}

export default MainLayout
