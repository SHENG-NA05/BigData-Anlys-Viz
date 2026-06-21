import React, { useEffect, useState } from 'react'
import { Modal, message } from 'antd'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Download,
  FileDown,
  Gauge,
  Globe2,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardService } from '../../../services/dashboardService'
import './DashboardView.css'

const metricSeeds = [
  { label: '總參觀人次', value: '128,457 人', trend: '+18.6%', icon: Users },
  { label: '互動參與率', value: '48.7%', trend: '+6.2pp', icon: Sparkles },
  { label: '滿意度（平均）', value: '4.6 / 5', trend: '+0.4', icon: CheckCircle2 },
  { label: '內容分享率', value: '12.3%', trend: '+2.8pp', icon: Share2 },
  { label: '預估 ROI', value: '212%', trend: '+32pp', icon: Gauge },
]

const sourceData = [
  { name: '現場購票', value: 36, color: '#d68b22' },
  { name: '線上預約', value: 28, color: '#557da5' },
  { name: '合作單位', value: 18, color: '#7c66c7' },
  { name: '團體預約', value: 12, color: '#5fa77d' },
  { name: '其他', value: 6, color: '#c8bfb1' },
]

const dwellData = [
  { name: '沉浸劇場：未來城市', minutes: 8.7 },
  { name: 'AI 共創實驗室', minutes: 7.3 },
  { name: '資料之海', minutes: 6.6 },
  { name: '人機共生互動區', minutes: 5.4 },
  { name: '未來工作間', minutes: 4.1 },
]

const engagementData = [
  { label: '02/15', visitors: 12000, interactions: 6500 },
  { label: '03/01', visitors: 24000, interactions: 12500 },
  { label: '03/15', visitors: 68000, interactions: 30000 },
  { label: '03/29', visitors: 38000, interactions: 19000 },
  { label: '04/12', visitors: 64000, interactions: 36000 },
  { label: '04/26', visitors: 42000, interactions: 21000 },
  { label: '05/10', visitors: 61000, interactions: 30500 },
  { label: '05/18', visitors: 50000, interactions: 25000 },
]

const kpiData = [
  { name: '總參觀人次', target: '120,000', actual: '128,457', rate: 107 },
  { name: '互動參與率', target: '42%', actual: '48.7%', rate: 116 },
  { name: '滿意度（平均）', target: '4.2 / 5', actual: '4.6 / 5', rate: 110 },
  { name: '內容分享率', target: '10%', actual: '12.3%', rate: 123 },
  { name: '教育推廣觸及人次', target: '30,000', actual: '36,842', rate: 123 },
]

const downloadReport = (name, text) => {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

const DashboardView = () => {
  const [metrics, setMetrics] = useState(metricSeeds)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await dashboardService.getDashboardStats('quarter')
        if (!data) return

        setMetrics([
          { label: '總參觀人次', value: '128,457 人', trend: '+18.6%', icon: Users },
          { label: '互動參與率', value: '48.7%', trend: '+6.2pp', icon: Sparkles },
          { label: '滿意度（平均）', value: '4.6 / 5', trend: '+0.4', icon: CheckCircle2 },
          { label: '內容分享率', value: `${data.proposal_export_count || 12.3}%`, trend: '+2.8pp', icon: Share2 },
          { label: '預估 ROI', value: '212%', trend: '+32pp', icon: Gauge },
        ])
      } catch (error) {
        console.info('Dashboard API unavailable, using local analytics data.')
      }
    }

    loadStats()
  }, [])

  const showDetail = (title, content) => {
    Modal.info({
      title,
      content,
      okText: '完成',
    })
  }

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div>
            <span className="ra-hero-icon"><Sparkles size={27} /></span>
            <h1>策展成效分析與洞察</h1>
            <p>整合觀眾行為、內容表現與回饋數據，量化策展成效並提出洞察與後續建議。</p>
          </div>
          <div className="dashboard-actions">
            <button className="ra-secondary-button" onClick={() => showDetail('日期區間', '目前分析區間為 2025/02/15 - 2025/05/18。')}>
              <CalendarDays size={17} />
              2025/02/15 - 2025/05/18
            </button>
            <button
              className="ra-secondary-button"
              onClick={() => downloadReport('策展成效分析報表.txt', '策展成效分析摘要：總參觀人次 128,457，互動參與率 48.7%，ROI 212%。')}
            >
              <Download size={17} />
              匯出報表
            </button>
          </div>
        </section>

        <section className="metric-strip ra-panel">
          {metrics.map((metric) => {
            const Icon = metric.icon
            return (
              <article key={metric.label}>
                <Icon size={24} />
                <div>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <em>{metric.trend}</em>
                </div>
              </article>
            )
          })}
        </section>

        <section className="analytics-grid">
          <article className="ra-panel analytics-card">
            <h2>觀眾來源與輪廓</h2>
            <div className="source-card-body">
              <ResponsiveContainer width="48%" height={180}>
                <PieChart>
                  <Pie data={sourceData} innerRadius={48} outerRadius={78} paddingAngle={3} dataKey="value">
                    {sourceData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <ul>
                {sourceData.map((item) => (
                  <li key={item.name}>
                    <i style={{ background: item.color }} />
                    <span>{item.name}</span>
                    <strong>{item.value}%</strong>
                  </li>
                ))}
              </ul>
            </div>
            <p>主要來自：北部地區 68% · 中部 21% · 南部 11%</p>
          </article>

          <article className="ra-panel analytics-card">
            <h2>展區熱度（依平均停留時間）</h2>
            <div className="dwell-list">
              {dwellData.map((item, index) => (
                <div key={item.name}>
                  <span>{index + 1}</span>
                  <strong>{item.name}</strong>
                  <i><b style={{ width: `${item.minutes * 10}%` }} /></i>
                  <em>0{Math.floor(item.minutes)}:{String(Math.round((item.minutes % 1) * 60)).padStart(2, '0')}</em>
                </div>
              ))}
            </div>
            <button onClick={() => showDetail('展區熱度', '平均停留時間 06:05，互動型展區表現最佳。')}>全部展區</button>
          </article>

          <article className="ra-panel analytics-card tall">
            <h2>滿意度 / NPS / 回饋摘要</h2>
            <div className="nps-gauge">
              <div>
                <span>NPS</span>
                <strong>+62</strong>
                <em>優秀</em>
              </div>
            </div>
            <ul className="nps-breakdown">
              <li><i className="green" />推薦者 <strong>68%</strong></li>
              <li><i className="amber" />被動者 <strong>24%</strong></li>
              <li><i className="red" />批評者 <strong>8%</strong></li>
            </ul>
            <ResponsiveContainer width="100%" height={118}>
              <LineChart data={engagementData}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis hide domain={[0, 80000]} />
                <Tooltip />
                <Line type="monotone" dataKey="visitors" stroke="#d68b22" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="feedback-list">
              <p>沉浸體驗非常震撼，能感受到科技帶來的未來想像！</p>
              <p>互動內容很有趣，孩子很喜歡 AI 共創區的體驗。</p>
              <p>希望增加更多關於永續議題的內容與案例。</p>
            </div>
          </article>

          <article className="ra-panel analytics-card">
            <h2>互動裝置使用情況</h2>
            <div className="device-summary">
              <strong>215,634</strong><span>總互動次數</span>
              <strong>04:12</strong><span>平均體驗時間</span>
              <strong>74.3%</strong><span>完成率</span>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={dwellData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={118} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="minutes" fill="#d68b22" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </article>

          <article className="ra-panel analytics-card">
            <h2>目標達成度（KPI）</h2>
            <table className="kpi-table">
              <thead>
                <tr>
                  <th>目標指標</th>
                  <th>目標值</th>
                  <th>實際成績</th>
                  <th>達成率</th>
                </tr>
              </thead>
              <tbody>
                {kpiData.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.target}</td>
                    <td>{item.actual}</td>
                    <td><span style={{ width: `${Math.min(item.rate, 130)}px` }} />{item.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>

          <article className="ra-panel analytics-card wide">
            <h2>活動後續推廣成效</h2>
            <div className="line-summary">
              <div><strong>892,147</strong><span>社群觸及人數</span><em>+45.3%</em></div>
              <div><strong>24,318</strong><span>貼文互動數</span><em>+31.7%</em></div>
              <div><strong>96 則</strong><span>媒體曝光則數</span><em>+28.2%</em></div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="visitors" stroke="#7c66c7" strokeWidth={2} />
                <Line type="monotone" dataKey="interactions" stroke="#d68b22" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </article>

          <article className="ra-panel analytics-card wide roi-card">
            <h2>ROI 與資源效益摘要</h2>
            <div className="roi-layout">
              <div className="roi-ring"><strong>ROI<br />212%</strong></div>
              <div className="roi-numbers">
                <p><span>總收益（估）</span><strong>$ 8,942,000</strong></p>
                <p><span>總成本</span><strong>$ 4,208,000</strong></p>
                <p><span>淨效益</span><strong>$ 4,734,000</strong></p>
              </div>
              <ul>
                <li>人事費用 <strong>38%</strong></li>
                <li>內容製作 <strong>28%</strong></li>
                <li>行銷推廣 <strong>18%</strong></li>
                <li>場地與設備 <strong>10%</strong></li>
                <li>其他 <strong>6%</strong></li>
              </ul>
            </div>
          </article>
        </section>
      </main>

      <aside className="dashboard-rail">
        <section className="ra-panel">
          <h2><Sparkles size={20} />AI 洞察摘要</h2>
          <ul className="rail-list">
            <li>互動參與率較高於上檔期，AI 共創與沉浸體驗是主要驅動因素。</li>
            <li>25-34 歲族群為主力觀眾，偏好高度互動與視覺震撼內容。</li>
            <li>週末下午 2-4 點為入場與互動高峰，建議下次規劃導覽時段。</li>
          </ul>
          <button className="ra-secondary-button full" onClick={() => showDetail('深度分析', '建議強化 AI 共創區排隊動線與導覽分流。')}>更多洞察分析</button>
        </section>

        <section className="ra-panel">
          <h2><Target size={20} />改進建議</h2>
          <ul className="rail-checks">
            <li>補強「永續科技」主題內容，回應觀眾關注。</li>
            <li>增加導覽人力於高峰時段，提升體驗流暢度。</li>
            <li>優化部分裝置說明與故障回報機制。</li>
            <li>深化數位互動內容，提升教育價值與停留時間。</li>
          </ul>
          <button className="ra-secondary-button full" onClick={() => showDetail('改善方案', '已整理成下一檔策展優化清單。')}>查看完整改善方案</button>
        </section>

        <section className="ra-panel next-exhibition">
          <h2><Globe2 size={20} />下次策展建議</h2>
          <p><strong>延伸主題：</strong>永續未來 × 科技創新</p>
          <p><strong>建議展型：</strong>沉浸體驗 × 跨域共創</p>
          <p><strong>目標受眾：</strong>親子家庭、青年族群</p>
          <p><strong>建議檔期：</strong>2025/11 - 2026/02</p>
          <button className="ra-primary-button full" onClick={() => message.success('已產生再策展企劃草案')}>
            生成再策展企劃草案
            <ArrowRight size={18} />
          </button>
        </section>

        <section className="ra-panel report-panel">
          <h2><FileDown size={20} />報表匯出</h2>
          <button onClick={() => downloadReport('策展成效報告.txt', 'PDF 完整報告內容') }><Download size={18} />下載報告</button>
          <button onClick={() => downloadReport('策展簡報.txt', 'PPT 簡報大綱內容') }><BarChart3 size={18} />匯出簡報</button>
          <button onClick={() => {
            navigator.clipboard?.writeText(window.location.href)
            message.success('已複製分享摘要連結')
          }}><Share2 size={18} />分享摘要</button>
        </section>

        <section className="ra-panel risk-panel">
          <h2><AlertTriangle size={20} />風險提醒</h2>
          <ul>
            <li>高峰人流仍集中於兩個展區，需規劃分流。</li>
            <li>互動設備維護成本高於預估，需調整預算。</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}

export default DashboardView
