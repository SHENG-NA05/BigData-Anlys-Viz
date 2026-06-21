import { Layout } from 'antd'
import { BarChart3, BookOpen, Database, LogOut, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../../services/authService'
import './Sidebar.css'

const { Sider } = Layout

const navigation = [
  { path: '/', title: '主題發想', subtitle: 'AI 主題生成與館藏媒合', icon: Sparkles },
  { path: '/proposal', title: '提案編輯', subtitle: '內容編輯、媒合與匯出', icon: BookOpen },
  { path: '/dashboard', title: '成效儀表板', subtitle: '工時、成本與系統設定', icon: BarChart3 },
  { path: '/import', title: '館藏匯入', subtitle: '驗證並匯入館藏資料', icon: Database },
]

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
        <nav className="ra-side-nav" aria-label="主要功能">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button key={item.path} className={active ? 'active' : ''} onClick={() => navigate(item.path)}>
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
