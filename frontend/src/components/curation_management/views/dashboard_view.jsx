import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Form, Input, Button, Modal, Select, message, Spin } from 'antd'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { SettingOutlined, DollarOutlined, ClockCircleOutlined } from 'antd/icons'
import { dashboardService } from '../../../services/dashboardService'
import './DashboardView.css'

const DashboardView = () => {
  const [form] = Form.useForm()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settingsVisible, setSettingsVisible] = useState(false)
  const [hourlyRate, setHourlyRate] = useState(500)
  const [baseHours, setBaseHours] = useState(8)
  const [timeRange, setTimeRange] = useState('month')

  // 模擬數據
  const mockMonthlyData = [
    { month: '1月', savedHours: 12, savedCost: 6000 },
    { month: '2月', savedHours: 18, savedCost: 9000 },
    { month: '3月', savedHours: 24, savedCost: 12000 },
    { month: '4月', savedHours: 20, savedCost: 10000 },
    { month: '5月', savedHours: 28, savedCost: 14000 },
    { month: '6月', savedHours: 32, savedCost: 16000 },
  ]

  const mockCategoryData = [
    { name: '編目工作', value: 35, color: '#8884d8' },
    { name: '主題策劃', value: 30, color: '#82ca9d' },
    { name: '內容維護', value: 20, color: '#ffc658' },
    { name: '使用者服務', value: 15, color: '#ff7c7c' },
  ]

  const loadSettings = async () => {
    try {
      const settings = await dashboardService.getSettings()
      setHourlyRate(settings.hourly_rate)
      setBaseHours(settings.base_hours)
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    loadDashboardStats()
  }, [timeRange])

  const loadDashboardStats = async () => {
    setLoading(true)
    try {
      const data = await dashboardService.getDashboardStats(timeRange)
      const mappedMonthlyData = (data.monthly_stats || []).map(item => ({
        month: item.month,
        savedHours: item.hours,
        savedCost: item.cost
      }))

      setStats({
        totalSavedHours: data.cumulative_hours_saved,
        totalSavedCost: data.cumulative_cost_saved,
        monthlyData: mappedMonthlyData,
        categoryData: mockCategoryData,
        projectCount: data.proposal_export_count,
        themeCount: data.theme_generation_count,
      })
    } catch (error) {
      message.error('載入數據失敗')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateSettings = async () => {
    try {
      await dashboardService.updateSettings(parseFloat(hourlyRate), parseFloat(baseHours))
      message.success('設置已更新')
      setSettingsVisible(false)
      loadDashboardStats()
    } catch (error) {
      message.error('更新失敗')
    }
  }

  if (loading) {
    return <Spin style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }} />
  }

  return (
    <div className="dashboard-view">
      <div className="page-header">
        <h1>📊 效益分析戰情室</h1>
        <p>即時查看策展系統帶來的工時與經費效益</p>
      </div>

      {/* 關鍵指標卡片 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="累計節省工時"
              value={stats?.totalSavedHours || 0}
              suffix="小時"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="累計節省經費"
              value={stats?.totalSavedCost || 0}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="完成策展案件"
              value={stats?.projectCount || 0}
              suffix="件"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable className="stat-card">
            <Statistic
              title="生成策展主題"
              value={stats?.themeCount || 0}
              suffix="個"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 圖表 */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="工時與經費趨勢 (每月)" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="savedHours" stroke="#8884d8" name="節省工時 (小時)" />
                <Line yAxisId="right" type="monotone" dataKey="savedCost" stroke="#82ca9d" name="節省經費 (元)" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="工作類型分布" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats?.categoryData || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 月份詳細數據 */}
      <Row style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <Card title="月份詳細統計" bordered={false}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="savedHours" fill="#8884d8" name="節省工時 (小時)" />
                <Bar dataKey="savedCost" fill="#82ca9d" name="節省經費 (元)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 控制按鈕 */}
      <Row style={{ marginTop: '24px' }} gutter={16}>
        <Col>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120 }}
            options={[
              { label: '按月份', value: 'month' },
              { label: '按季度', value: 'quarter' },
              { label: '按年份', value: 'year' },
            ]}
          />
        </Col>
        <Col>
          <Button type="primary" icon={<SettingOutlined />} onClick={() => setSettingsVisible(true)}>
            參數設置
          </Button>
        </Col>
      </Row>

      {/* 設置 Modal */}
      <Modal
        title="效益分析參數設置"
        open={settingsVisible}
        onOk={handleUpdateSettings}
        onCancel={() => setSettingsVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="時薪 (元/小時)">
            <Input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="基準工作時數 (小時/天)">
            <Input
              type="number"
              value={baseHours}
              onChange={(e) => setBaseHours(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DashboardView
