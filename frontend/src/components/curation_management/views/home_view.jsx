import { useEffect, useState } from 'react'
import { BarChart3, BookOpen, Clock3, Database, FileText, MoveRight, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { catalogService } from '../../../services/catalogService'
import { curationService } from '../../../services/curationService'
import { dashboardService } from '../../../services/dashboardService'
import { proposalService } from '../../../services/proposalService'
import './HomeView.css'

const getItems = (result) => {
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.data)) return result.data
  return []
}

const HomeView = () => {
  const navigate = useNavigate()
  const [summary, setSummary] = useState({ themes: null, proposals: null, imports: null, hours: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const loadSummary = async () => {
      const [stats, themes, proposals, imports] = await Promise.allSettled([
        dashboardService.getDashboardStats(),
        curationService.getThemeHistory(),
        proposalService.listProposals(),
        catalogService.getUploadHistory(),
      ])
      if (!active) return
      setSummary({
        hours: stats.status === 'fulfilled' ? stats.value.cumulative_hours_saved : null,
        themes: themes.status === 'fulfilled' ? getItems(themes.value).length : null,
        proposals: proposals.status === 'fulfilled' ? getItems(proposals.value).length : null,
        imports: imports.status === 'fulfilled' ? getItems(imports.value).length : null,
      })
      setLoading(false)
    }
    loadSummary()
    return () => { active = false }
  }, [])

  const metrics = [
    { label: '已產生主題', value: summary.themes, suffix: '個', icon: Sparkles },
    { label: '企劃書', value: summary.proposals, suffix: '份', icon: FileText },
    { label: '館藏匯入批次', value: summary.imports, suffix: '次', icon: Database },
    { label: '累積節省工時', value: summary.hours, suffix: '小時', icon: Clock3 },
  ]

  const phases = [
    { step: '01', title: '策展前', description: '從趨勢與關鍵詞產生策展主題，並以向量搜尋比對館藏。', action: '開始主題發想', path: '/curation', icon: Sparkles },
    { step: '02', title: '策展中', description: '編輯策展企劃、調整內容、匹配館藏並輸出正式文件。', action: '管理策展企劃', path: '/proposal', icon: BookOpen },
    { step: '03', title: '策展後', description: '查看主題生成、企劃輸出、節省工時與成本效益。', action: '查看效益分析', path: '/dashboard', icon: BarChart3 },
  ]

  return (
    <main className="home-page">
      <section className="home-intro">
        <div>
          <span className="home-kicker">RA2 SMART CURATION</span>
          <h1>從館藏資料到策展成果，<br />都在同一個工作台。</h1>
          <p>依照策展前、中、後流程完成主題發想、企劃製作與成果分析。</p>
          <button className="home-primary-action" onClick={() => navigate('/curation')}>
            <Sparkles size={18} />開始策展<MoveRight size={18} />
          </button>
        </div>
        <div className="home-signal" aria-label="系統流程示意">
          <span>館藏資料</span><MoveRight size={20} /><strong>AI 策展引擎</strong><MoveRight size={20} /><span>策展企劃</span>
        </div>
      </section>

      <section className="home-metrics" aria-label="系統資料摘要">
        {metrics.map(({ label, value, suffix, icon: Icon }) => (
          <article key={label}>
            <Icon size={20} />
            <span>{label}</span>
            <strong>{loading ? '讀取中' : value === null ? '暫無資料' : `${value.toLocaleString()} ${suffix}`}</strong>
          </article>
        ))}
      </section>

      <section className="home-workflow">
        <div className="home-section-heading">
          <div><span>CURATION WORKFLOW</span><h2>策展工作流程</h2></div>
          <button onClick={() => navigate('/import')}><Database size={17} />匯入館藏資料</button>
        </div>
        <div className="home-phase-grid">
          {phases.map(({ step, title, description, action, path, icon: Icon }) => (
            <article key={step} className="home-phase">
              <div className="home-phase-top"><span>{step}</span><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
              <button onClick={() => navigate(path)}>{action}<MoveRight size={17} /></button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default HomeView
