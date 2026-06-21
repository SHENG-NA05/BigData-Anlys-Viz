import { useEffect, useState } from 'react'
import { Spin, message } from 'antd'
import { BarChart3, Clock3, DollarSign, FileDown, RefreshCw, Sparkles } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { dashboardService } from '../../../services/dashboardService'
import './DashboardView.css'

const errorMessage = (error, defaultMessage) =>
  error.response?.data?.detail || error.message || defaultMessage

const DashboardView = () => {
  const [stats, setStats] = useState(null)
  const [monthlyStats, setMonthlyStats] = useState([])
  const [quarterlyStats, setQuarterlyStats] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const loadDashboard = async (showSuccess = false) => {
    setLoading(true)
    try {
      const [statsResult, monthlyResult, quarterlyResult, settingsResult] = await Promise.all([
        dashboardService.getDashboardStats(),
        dashboardService.getMonthlyStats(),
        dashboardService.getQuarterlyStats(),
        dashboardService.getSettings(),
      ])
      setStats(statsResult)
      setMonthlyStats(Array.isArray(monthlyResult) ? monthlyResult : [])
      setQuarterlyStats(Array.isArray(quarterlyResult) ? quarterlyResult : [])
      setSettings(settingsResult)
      if (showSuccess) message.success('已更新儀表板')
    } catch (error) {
      message.error(errorMessage(error, '無法讀取儀表板資料'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const handleSaveSettings = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await dashboardService.updateSettings(
        Number(settings.hourly_rate),
        Number(settings.base_hours),
      )
      message.success('系統參數已儲存')
      await loadDashboard()
    } catch (error) {
      message.error(errorMessage(error, '儲存系統參數失敗'))
    } finally {
      setSaving(false)
    }
  }

  const metrics = stats ? [
    { label: '累計節省工時', value: `${stats.cumulative_hours_saved.toLocaleString()} 小時`, icon: Clock3 },
    { label: '累計節省成本', value: `NT$ ${stats.cumulative_cost_saved.toLocaleString()}`, icon: DollarSign },
    { label: '主題生成次數', value: stats.theme_generation_count.toLocaleString(), icon: Sparkles },
    { label: '企劃匯出次數', value: stats.proposal_export_count.toLocaleString(), icon: FileDown },
  ] : []

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <section className="dashboard-hero">
          <div>
            <span className="ra-hero-icon"><BarChart3 size={27} /></span>
            <h1>工時與成本效益</h1>
            <p>顯示後端資料庫累計的策展作業次數、節省工時與成本。</p>
          </div>
          <button className="ra-secondary-button" onClick={() => loadDashboard(true)}>
            <RefreshCw size={17} />更新資料
          </button>
        </section>

        <Spin spinning={loading}>
          <section className="metric-strip ra-panel">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <article key={metric.label}>
                  <Icon size={24} />
                  <div>
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                </article>
              )
            })}
            {!metrics.length && !loading && <p>尚無效益統計資料。</p>}
          </section>

          <section className="analytics-grid">
            <article className="ra-panel analytics-card wide">
              <h2>月度效益</h2>
              {monthlyStats.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="hours" />
                    <YAxis yAxisId="cost" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="hours" dataKey="hours" name="節省小時" fill="#397a6f" />
                    <Bar yAxisId="cost" dataKey="cost" name="節省成本" fill="#d68b22" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="empty-state">尚無月度資料。</p>}
            </article>

            <article className="ra-panel analytics-card wide">
              <h2>季度效益</h2>
              {quarterlyStats.length ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={quarterlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="quarter" />
                    <YAxis yAxisId="hours" />
                    <YAxis yAxisId="cost" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="hours" dataKey="hours" name="節省小時" fill="#397a6f" />
                    <Bar yAxisId="cost" dataKey="cost" name="節省成本" fill="#d68b22" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="empty-state">尚無季度資料。</p>}
            </article>
          </section>

          {settings && (
            <section className="ra-panel dashboard-settings">
              <h2>效益計算參數</h2>
              <label htmlFor="hourly-rate">平均時薪 (NT$)</label>
              <input
                id="hourly-rate"
                type="number"
                min="0"
                value={settings.hourly_rate}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  hourly_rate: event.target.value,
                }))}
              />
              <label htmlFor="base-hours">每日基準工時</label>
              <input
                id="base-hours"
                type="number"
                min="0"
                step="0.5"
                value={settings.base_hours}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  base_hours: event.target.value,
                }))}
              />
              <button className="ra-primary-button" onClick={handleSaveSettings} disabled={saving}>
                {saving ? '儲存中...' : '儲存參數'}
              </button>
            </section>
          )}
        </Spin>
      </main>
    </div>
  )
}

export default DashboardView
