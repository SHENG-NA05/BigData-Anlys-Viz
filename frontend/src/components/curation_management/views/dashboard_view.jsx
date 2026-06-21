import React from 'react'
import { message, Modal } from 'antd'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpOutlined,
  CalendarOutlined,
  DownloadOutlined,
  FilePptOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'
import './DashboardView.css'

const metrics = [
  ['總參觀人次', '128,457', '人', '+18.6%'],
  ['互動參與率', '48.7', '%', '+6.2pp'],
  ['滿意度（平均）', '4.6', '/ 5', '+0.4'],
  ['內容分享率', '12.3', '%', '+2.8pp'],
  ['預估 ROI', '212', '%', '+32pp'],
]

const dwellData = [
  { zone: '沉浸劇場：未來城市', time: 8.7 },
  { zone: 'AI 共創實驗室', time: 7.3 },
  { zone: '資料之海', time: 6.6 },
  { zone: '人機共生互動區', time: 5.4 },
  { zone: '未來工作間', time: 4.15 },
]

const engagementData = [
  { name: 'AI 共創牆', value: 93 },
  { name: '未來城市模擬器', value: 81 },
  { name: '資料互動桌', value: 69 },
  { name: '聲音未來郵局', value: 57 },
  { name: '體感互動區', value: 62 },
]

const trendData = [
  { date: '02/15', visits: 24, interactions: 12 },
  { date: '03/01', visits: 48, interactions: 26 },
  { date: '03/15', visits: 72, interactions: 42 },
  { date: '03/29', visits: 52, interactions: 29 },
  { date: '04/12', visits: 66, interactions: 33 },
  { date: '04/26', visits: 44, interactions: 24 },
  { date: '05/10', visits: 62, interactions: 35 },
  { date: '05/18', visits: 39, interactions: 22 },
]

const npsTrend = [
  { date: '02/15', score: 4.2 },
  { date: '03/08', score: 4.5 },
  { date: '03/29', score: 4.8 },
  { date: '04/19', score: 4.6 },
  { date: '05/10', score: 4.7 },
  { date: '05/18', score: 4.9 },
]

const kpis = [
  ['總參觀人次', '120,000', '128,457', '107%'],
  ['互動參與率', '42%', '48.7%', '116%'],
  ['滿意度（平均）', '4.2 / 5', '4.6 / 5', '110%'],
  ['內容分享率', '10%', '12.3%', '123%'],
  ['教育推廣觸及人次', '30,000', '36,842', '123%'],
]

const DashboardView = () => {
  const reportText = `策展成效分析報告
總參觀人次：128,457
互動參與率：48.7%
滿意度：4.6 / 5
預估 ROI：212%

AI 洞察：
1. 互動參與率顯著高於上檔期。
2. 25-34 歲族群偏好高度互動與視覺震撼內容。
3. 週末下午 2-4 點為高峰。`

  const showInfo = (title, content) => {
    Modal.info({
      title,
      content,
      okText: '知道了',
    })
  }

  const downloadFile = (filename, content, type = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success(`已匯出 ${filename}`)
  }

  const copySummaryLink = async () => {
    const link = `${window.location.origin}/dashboard`
    try {
      await navigator.clipboard.writeText(link)
      message.success('摘要連結已複製')
    } catch (error) {
      showInfo('分享摘要連結', link)
    }
  }

  return (
    <div className="ra-page dashboard-view">
      <div className="ra-page-header">
        <div className="ra-title">
          <span className="ra-title-icon">✦</span>
          <div>
            <h1>策展成效分析與洞察</h1>
            <p>整合觀眾行為、內容表現與回饋數據，量化策展成效並提出洞察與後續建議。</p>
          </div>
        </div>
        <div className="dashboard-actions">
          <button
            className="ra-button"
            type="button"
            onClick={() => showInfo('分析日期區間', '目前報表區間為 2025/02/15 - 2025/05/18。')}
          >
            <CalendarOutlined />2025/02/15 - 2025/05/18
          </button>
          <button className="ra-button" type="button" onClick={() => downloadFile('策展成效報表.txt', reportText)}>
            <DownloadOutlined />匯出報表
          </button>
        </div>
      </div>

      <section className="ra-card metric-strip">
        {metrics.map(([label, value, suffix, change]) => (
          <div className="dash-metric" key={label}>
            <span>{label}</span>
            <strong>{value}<small>{suffix}</small></strong>
            <p><ArrowUpOutlined /> {change}</p>
          </div>
        ))}
      </section>

      <div className="dashboard-grid">
        <main className="dashboard-main">
          <section className="ra-card chart-card source-card">
            <div className="ra-card-header">
              <h3>觀眾來源與輪廓</h3>
            </div>
            <div className="source-layout">
              <div className="source-donut">
                <strong>128,457</strong>
                <span>總人次</span>
              </div>
              <div className="source-profile">
                {['18-24 歲 22.1%', '25-34 歲 32.4%', '35-44 歲 24.5%', '45-54 歲 13.2%', '55 歲以上 7.8%'].map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
            <footer>主要來自：北部地區 68%、中部 21%、南部 11%</footer>
          </section>

          <section className="ra-card chart-card dwell-card">
            <div className="ra-card-header">
              <h3>展區熱度（依平均停留時間）</h3>
              <small>全部展區⌄</small>
            </div>
            <div className="dwell-list">
              {dwellData.map((item, index) => (
                <div className="dwell-row" key={item.zone}>
                  <span>{index + 1}</span>
                  <strong>{item.zone}</strong>
                  <div><i style={{ width: `${item.time * 10}%` }} /></div>
                  <small>{String(Math.floor(item.time)).padStart(2, '0')}:{String(Math.round((item.time % 1) * 60)).padStart(2, '0')}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="ra-card chart-card nps-card">
            <div className="ra-card-header">
              <h3>滿意度 / NPS / 回饋摘要</h3>
            </div>
            <div className="nps-layout">
              <div className="nps-ring"><strong>+62</strong><span>NPS</span></div>
              <div className="nps-breakdown">
                <p><i className="good" />推薦者 68%</p>
                <p><i className="neutral" />被動者 24%</p>
                <p><i className="bad" />批評者 8%</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={npsTrend}>
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[3.8, 5]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#d79230" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="ra-card chart-card engagement-card">
            <div className="ra-card-header">
              <h3>互動裝置使用情況</h3>
              <small>全部裝置⌄</small>
            </div>
            <div className="engagement-summary">
              <div><span>總互動次數</span><strong>215,634</strong></div>
              <div><span>平均拍攝時間</span><strong>04:12</strong></div>
              <div><span>完成率</span><strong>74.3%</strong></div>
            </div>
            <div className="engagement-bars">
              {engagementData.map((item) => (
                <div key={item.name}>
                  <span>{item.name}</span>
                  <div><i style={{ width: `${item.value}%` }} /></div>
                  <small>{item.value}%</small>
                </div>
              ))}
            </div>
          </section>

          <section className="ra-card chart-card kpi-card">
            <div className="ra-card-header">
              <h3>目標達成度（KPI）</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>目標指標</th>
                  <th>目標值</th>
                  <th>實際成績</th>
                  <th>進度</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((row) => (
                  <tr key={row[0]}>
                    {row.map((cell) => <td key={cell}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="ra-card chart-card trend-card">
            <div className="ra-card-header">
              <h3>活動後續推廣成效</h3>
            </div>
            <div className="trend-metrics">
              <div><span>社群觸及人數</span><strong>892,147</strong><small>+45.3%</small></div>
              <div><span>貼文互動數</span><strong>24,318</strong><small>+31.7%</small></div>
              <div><span>媒體曝光篇數</span><strong>96</strong><small>+28.2%</small></div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee5da" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="visits" stroke="#8c6dd8" strokeWidth={2} />
                <Line type="monotone" dataKey="interactions" stroke="#d79230" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="ra-card chart-card roi-card">
            <div className="ra-card-header">
              <h3>ROI 與資源效益摘要</h3>
            </div>
            <div className="roi-layout">
              <div className="roi-ring"><strong>212%</strong><span>ROI</span></div>
              <div className="roi-numbers">
                <p><span>總收益（估）</span><strong>$ 8,942,000</strong></p>
                <p><span>總成本</span><strong>$ 4,208,000</strong></p>
                <p><span>淨效益</span><strong>$ 4,734,000</strong></p>
              </div>
              <div className="roi-costs">
                {['人事費用 38%', '內容製作 28%', '行銷推廣 18%', '場地與設備 10%', '其他 6%'].map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            </div>
          </section>
        </main>

        <aside className="dashboard-rail">
          <section className="ra-card rail-card">
            <div className="rail-title purple">
              <span>✦</span>
              <h3>AI 洞察摘要</h3>
            </div>
            <ul className="dash-rail-list">
              <li>互動參與率顯著高於上檔期，AI 共創與沉浸體驗是主要驅動因素。</li>
              <li>25-34 歲族群偏好高度互動與視覺震撼內容。</li>
              <li>週末下午 2-4 點為高峰，建議下次擴增工作坊時段。</li>
            </ul>
            <button
              className="rail-action"
              type="button"
              onClick={() => showInfo('更多洞察分析', '建議優先投資互動內容與週末導覽資源，並針對 25-34 歲觀眾設計可分享的視覺節點。')}
            >
              更多洞察分析
            </button>
          </section>

          <section className="ra-card rail-card">
            <div className="rail-title">
              <span>↗</span>
              <h3>改進建議</h3>
            </div>
            <ul className="dash-rail-list check">
              <li>補強「永續科技」主題內容，回應觀眾關注。</li>
              <li>增加導覽人力於高峰時段，提升體驗滿意度。</li>
              <li>優化館內裝置的拍照動線與說明指引。</li>
              <li>深化數位互動內容，提升教育價值與停留時間。</li>
            </ul>
            <button
              className="rail-action"
              type="button"
              onClick={() => showInfo('完整改善方案', '改善重點：補強永續科技內容、增加高峰時段人力、優化拍照動線、深化數位互動教育價值。')}
            >
              查看完整改善方案
            </button>
          </section>

          <section className="ra-card rail-card">
            <div className="rail-title">
              <span>▣</span>
              <h3>下次策展建議</h3>
            </div>
            <div className="next-exhibition">
              <p><strong>延伸主題：</strong>永續未來 × 科技創新</p>
              <p><strong>建議展型：</strong>沉浸體驗 × 跨域共創</p>
              <p><strong>目標受眾：</strong>親子家庭、青年族群</p>
              <p><strong>建議檔期：</strong>2025/11 - 2026/02</p>
            </div>
            <button
              className="rail-action"
              type="button"
              onClick={() => {
                localStorage.setItem('ra2_next_exhibition', JSON.stringify({
                  title: '永續未來 × 科技創新',
                  type: '沉浸體驗 × 跨域共創',
                }))
                message.success('已生成再策展企劃草案')
              }}
            >
              生成再策展企劃草案
            </button>
          </section>

          <section className="ra-card rail-card">
            <div className="rail-title">
              <DownloadOutlined />
              <h3>報表匯出</h3>
            </div>
            <div className="report-actions">
              <button type="button" onClick={() => downloadFile('策展成效完整報告.pdf', reportText, 'application/pdf')}><DownloadOutlined />下載報告<small>PDF 完整報告</small></button>
              <button type="button" onClick={() => downloadFile('策展成效簡報.ppt', reportText, 'application/vnd.ms-powerpoint')}><FilePptOutlined />匯出簡報<small>PPT 簡報檔</small></button>
              <button type="button" onClick={copySummaryLink}><ShareAltOutlined />分享摘要<small>連結檔案</small></button>
            </div>
          </section>
        </aside>
      </div>
      <div className="ra-page-bottom" />
    </div>
  )
}

export default DashboardView
