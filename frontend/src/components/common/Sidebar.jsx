import React from 'react'
import { Layout, Modal, message } from 'antd'
import {
  BarChart3,
  BookOpen,
  Database,
  Home,
  Image,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import './Sidebar.css'

const { Sider } = Layout

const projectNav = [
  { path: '/', title: '策展前', subtitle: '主題探索與發想', icon: Sparkles },
  { path: '/proposal', title: '策展中', subtitle: '內容整合與編排', icon: BookOpen },
  { path: '/dashboard', title: '策展後', subtitle: '效益分析與推廣', icon: BarChart3 },
]

const libraryNav = [
  { path: '/import', title: '資料庫', icon: Database },
  { path: '/import', title: '素材', icon: Image },
  { path: '/proposal', title: '筆記與協作', icon: BookOpen },
  { path: '/dashboard', title: '設定', icon: Settings },
]

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const go = (path) => navigate(path)

  const openSettings = () => {
    Modal.info({
      title: '專案設定',
      content: '目前專案為「未來之境：人與科技的共生想像」，可管理展期、協作者與輸出格式。',
      okText: '完成',
    })
  }

  return (
    <Sider width={292} className="ra-sidebar">
      <div className="ra-brand" onClick={() => go('/')} role="button" tabIndex={0}>
        <span className="ra-brand-mark">R</span>
        <span>RA2</span>
      </div>

      <div className="ra-sidebar-scroll">
        <section className="ra-side-section">
          <div className="ra-side-label">專案</div>
          <div className="ra-project-card">
            <div className="ra-project-cover" />
            <div>
              <strong>未來之境：</strong>
              <span>人與科技的共生想像</span>
              <em>更新於 2025/05/19</em>
            </div>
          </div>
        </section>

        <nav className="ra-side-nav">
          <button className={location.pathname === '/home' ? 'active' : ''} onClick={() => go('/')}>
            <Home size={18} />
            <span>首頁</span>
          </button>

          {projectNav.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button key={item.title} className={active ? 'active' : ''} onClick={() => go(item.path)}>
                <Icon size={18} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
                <i />
              </button>
            )
          })}
        </nav>

        <div className="ra-side-divider" />

        <nav className="ra-side-nav compact">
          {libraryNav.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.title} onClick={() => go(item.path)}>
                <Icon size={18} />
                <span>{item.title}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="ra-sidebar-footer">
        <button onClick={() => message.success('已建立團隊邀請連結')}>
          <Users size={17} />
          邀請團隊成員
        </button>
        <button onClick={openSettings}>
          <Settings size={17} />
          專案設定
        </button>
        <button
          className="ra-logout"
          onClick={() => {
            authService.logout()
            navigate('/login')
          }}
        >
          登出
        </button>
      </div>
    </Sider>
  )
}

export default Sidebar
