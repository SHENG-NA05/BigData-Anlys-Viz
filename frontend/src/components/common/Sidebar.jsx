import { Layout } from 'antd'
import { BarChart3, BookOpen, Database, Home, LogOut, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import './Sidebar.css'

const { Sider } = Layout

const phaseNavigation = [
  { path: '/curation', title: '策展前', subtitle: 'AI 主題發想與館藏媒合', icon: Sparkles },
  { path: '/proposal', title: '策展中', subtitle: '企劃編輯、媒合與匯出', icon: BookOpen },
  { path: '/dashboard', title: '策展後', subtitle: '效益分析與系統設定', icon: BarChart3 },
]

const toolNavigation = [
  { path: '/import', title: '館藏匯入', subtitle: '驗證並匯入館藏資料', icon: Database },
]

const NavigationGroup = ({ label, items, currentPath, onNavigate }) => (
  <section className="ra-side-section">
    <div className="ra-side-label">{label}</div>
    <nav className="ra-side-nav" aria-label={label}>
      {items.map((item) => {
        const Icon = item.icon
        const active = currentPath === item.path
        return (
          <button
            key={item.path}
            className={active ? 'active' : ''}
            aria-label={`${item.title}：${item.subtitle}`}
            onClick={() => onNavigate(item.path)}
          >
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
  </section>
)

const Sidebar = () => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Sider width={292} className="ra-sidebar">
      <div className="ra-brand" onClick={() => navigate('/')} role="button" tabIndex={0}>
        <span className="ra-brand-mark">R</span>
        <span>RA2</span>
      </div>

      <div className="ra-sidebar-scroll">
        <NavigationGroup
          label="工作台"
          items={[{ path: '/', title: '首頁', subtitle: '進度、數據與快速入口', icon: Home }]}
          currentPath={location.pathname}
          onNavigate={navigate}
        />
        <div className="ra-side-divider" />
        <NavigationGroup
          label="策展流程"
          items={phaseNavigation}
          currentPath={location.pathname}
          onNavigate={navigate}
        />
        <div className="ra-side-divider" />
        <NavigationGroup
          label="資料工具"
          items={toolNavigation}
          currentPath={location.pathname}
          onNavigate={navigate}
        />
      </div>

      <div className="ra-sidebar-footer">
        <button
          className="ra-logout"
          onClick={() => {
            authService.logout()
            navigate('/login')
          }}
        >
          <LogOut size={17} />
          登出
        </button>
      </div>
    </Sider>
  )
}

export default Sidebar
