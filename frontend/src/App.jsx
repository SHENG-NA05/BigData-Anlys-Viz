import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import CurationThemeGenerator from './components/curation_management/views/curation_theme_generator'
import ProposalEditor from './components/curation_management/views/proposal_editor'
import DashboardView from './components/curation_management/views/dashboard_view'
import CatalogImport from './components/curation_management/views/catalog_import'

function App() {
  return (
    <Router>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ width: '250px', background: '#001529', color: '#fff', padding: '20px' }}>
          <h3>智慧策展系統</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ margin: '15px 0' }}><a href="/" style={{ color: '#fff', textDecoration: 'none' }}>AI 智慧發想</a></li>
            <li style={{ margin: '15px 0' }}><a href="/proposal" style={{ color: '#fff', textDecoration: 'none' }}>企劃管理中心</a></li>
            <li style={{ margin: '15px 0' }}><a href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>效益戰情室</a></li>
            <li style={{ margin: '15px 0' }}><a href="/import" style={{ color: '#fff', textDecoration: 'none' }}>館藏導入</a></li>
          </ul>
        </div>
        <div style={{ flex: 1, padding: '20px', background: '#f5f5f5' }}>
          <Routes>
            <Route path="/" element={<CurationThemeGenerator />} />
            <Route path="/proposal" element={<ProposalEditor />} />
            <Route path="/dashboard" element={<DashboardView />} />
            <Route path="/import" element={<CatalogImport />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
