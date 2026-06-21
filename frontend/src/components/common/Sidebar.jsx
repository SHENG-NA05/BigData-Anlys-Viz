import React from 'react'
import { message, Modal } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BarChartOutlined,
  BookOutlined,
  BulbOutlined,
  CalendarOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  HomeOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import './Sidebar.css'

const primaryNav = [
  { path: '/', icon: <BulbOutlined />, title: '策展前', desc: '主題與策略發想', dot: true },
  { path: '/proposal', icon: <FileTextOutlined />, title: '策展中', desc: '內容整合與編排', dot: true },
  { path: '/dashboard', icon: <BarChartOutlined />, title: '策展後', desc: '效益分析儀表板', dot: true },
]

const secondaryNav = [
  { path: '/import', icon: <DatabaseOutlined />, title: '資料庫' },
  { path: '/import', icon: <BookOutlined />, title: '素材' },
  { path: '/proposal', icon: <CalendarOutlined />, title: '筆記與協作' },
  { path: '/dashboard', icon: <SettingOutlined />, title: '設定' },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const projectMeta = pathname === '/dashboard'
    ? { status: '已結案', date: '展期：2025/02/15 – 05/18' }
    : { status: '草案', date: '更新於 2025/05/19' }

  const showProjectSettings = () => {
    Modal.info({
      title: '專案設定',
      content: '可設定專案名稱、展期、協作者、輸出格式與審稿流程。此處目前為示範設定面板。',
      okText: '知道了',
    })
  }

  const renderItem = (item, compact = false) => {
    const active = !compact && pathname === item.path

    return (
      <button
        key={`${item.title}-${item.path}`}
        type="button"
        className={`ra-side-item ${active ? 'is-active' : ''} ${compact ? 'is-compact' : ''}`}
        onClick={() => navigate(item.path)}
      >
        <span className="ra-side-icon">{item.icon}</span>
        <span className="ra-side-copy">
          <strong>{item.title}</strong>
          {!compact && <small>{item.desc}</small>}
        </span>
        {item.dot && <span className="ra-side-dot" />}
      </button>
    )
  }

  return (
    <aside className="ra-sidebar">
      <div className="ra-brand">
        <span className="ra-brand-mark">R</span>
        <span>RA2</span>
      </div>

      <div className="ra-project">
        <span className="ra-project-label">專案</span>
        <div className="ra-project-card">
          <img
            src="https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=160&q=80"
            alt="未來展覽專案"
          />
          <div>
            <strong>未來之境：</strong>
            <p>人與科技的共生想像</p>
            <span>{projectMeta.status}</span>
            <small>{projectMeta.date}</small>
          </div>
        </div>
      </div>

      <nav className="ra-side-nav">
        <button type="button" className="ra-side-item is-compact" onClick={() => navigate('/')}>
          <span className="ra-side-icon"><HomeOutlined /></span>
          <span className="ra-side-copy"><strong>首頁</strong></span>
        </button>
        {primaryNav.map((item) => renderItem(item))}
      </nav>

      <nav className="ra-side-nav secondary">
        {secondaryNav.map((item) => renderItem(item, true))}
      </nav>

      <div className="ra-side-footer">
        <button
          type="button"
          className="ra-team-button"
          onClick={() => message.success('已建立團隊邀請連結')}
        >
          <TeamOutlined />
          邀請團隊成員
        </button>
        <button type="button" className="ra-side-item is-compact" onClick={showProjectSettings}>
          <span className="ra-side-icon"><SettingOutlined /></span>
          <span className="ra-side-copy"><strong>專案設定</strong></span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
