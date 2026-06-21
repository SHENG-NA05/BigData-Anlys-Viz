import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './components/common/MainLayout'
import CurationThemeGenerator from './components/curation_management/views/curation_theme_generator'
import ProposalEditor from './components/curation_management/views/proposal_editor'
import DashboardView from './components/curation_management/views/dashboard_view'
import CatalogImport from './components/curation_management/views/catalog_import'
import LoginView from './components/curation_management/views/login_view'
import HomeView from './components/curation_management/views/home_view'
import { authService } from './services/authService'
import './App.css'

const ProtectedLayout = ({ children }) => {
  if (!authService.isLoggedIn()) {
    return <Navigate to="/login" replace />
  }
  return <MainLayout>{children}</MainLayout>
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route
            path="/*"
            element={
              <ProtectedLayout>
                <Routes>
                  <Route path="/" element={<HomeView />} />
                  <Route path="/curation" element={<CurationThemeGenerator />} />
                  <Route path="/proposal" element={<ProposalEditor />} />
                  <Route path="/dashboard" element={<DashboardView />} />
                  <Route path="/import" element={<CatalogImport />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ProtectedLayout>
            }
          />
        </Routes>
      </Router>
    </ConfigProvider>
  )
}

export default App
