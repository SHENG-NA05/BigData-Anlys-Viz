import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import MainLayout from './components/common/MainLayout'
import CurationThemeGenerator from './components/curation_management/views/curation_theme_generator'
import ProposalEditor from './components/curation_management/views/proposal_editor'
import DashboardView from './components/curation_management/views/dashboard_view'
import CatalogImport from './components/curation_management/views/catalog_import'
import './App.css'

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<CurationThemeGenerator />} />
            <Route path="/proposal" element={<ProposalEditor />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/import" element={<CatalogImport />} />
          </Routes>
        </MainLayout>
      </Router>
    </ConfigProvider>
  )
}

export default App
