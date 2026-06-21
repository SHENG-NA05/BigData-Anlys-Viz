import React, { useState } from 'react'
import { Avatar, Badge, Input, message, Modal } from 'antd'
import { BellOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import './MainLayout.css'

const MainLayout = ({ children }) => {
  const { pathname } = useLocation()
  const isArchived = pathname === '/dashboard'
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = () => {
    const keyword = searchValue.trim()
    if (!keyword) {
      message.info('請輸入搜尋關鍵字')
      return
    }
    Modal.info({
      title: '搜尋結果',
      content: `已搜尋「${keyword}」。目前示範資料中可檢索專案、素材與筆記，正式資料庫串接後會顯示完整結果。`,
      okText: '知道了',
    })
  }

  return (
    <div className="ra-shell">
      <Sidebar />
      <main className="ra-workspace">
        <header className="ra-topbar">
          <div className="ra-topbar-title">
            <span>策展主題發想</span>
            <DownOutlined />
          </div>
          <div className="ra-topbar-actions">
            <Input
              className="ra-search"
              prefix={<SearchOutlined />}
              suffix={<span className="ra-shortcut">⌘K</span>}
              placeholder="搜尋專案、素材、筆記..."
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onPressEnter={handleSearch}
            />
            <Badge count={3} size="small">
              <button
                className="ra-icon-button"
                aria-label="通知"
                onClick={() => Modal.info({
                  title: '通知',
                  content: '目前有 3 則提醒：待校稿項目、圖片授權提醒、AI 建議更新。',
                  okText: '知道了',
                })}
              >
                <BellOutlined />
              </button>
            </Badge>
            <button
              className="ra-user"
              type="button"
              onClick={() => Modal.info({
                title: '使用者資訊',
                content: '林顧問人｜角色：策展顧問。可在專案設定中調整個人與協作權限。',
                okText: '知道了',
              })}
            >
              <Avatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=80" />
              <span>林顧問人</span>
              <DownOutlined />
            </button>
          </div>
        </header>
        <section className="ra-content">{children}</section>
        <footer className="ra-statusbar">
          <span>專案狀態：<strong>{isArchived ? '已結案' : '草案'}</strong></span>
          <span>最後儲存：2025/05/19 14:32</span>
          <span className="ra-status-collab">
            協作者：
            <strong>6 人</strong>
            <Avatar.Group size="small" maxCount={3}>
              <Avatar src="https://i.pravatar.cc/80?img=12" />
              <Avatar src="https://i.pravatar.cc/80?img=32" />
              <Avatar src="https://i.pravatar.cc/80?img=47" />
              <Avatar src="https://i.pravatar.cc/80?img=5" />
            </Avatar.Group>
          </span>
        </footer>
      </main>
    </div>
  )
}

export default MainLayout
