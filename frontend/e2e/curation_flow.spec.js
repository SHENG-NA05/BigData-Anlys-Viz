import { test, expect } from '@playwright/test'

const json = (route, body, status = 200) => route.fulfill({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
})

const proposal = {
  proposal_id: 'P001',
  theme_id: 'T001',
  title: '世界閱讀日智慧策展',
  content: '<h1>策展宗旨與目標</h1><p>推廣閱讀與數位素養。</p>',
  matched_books: [],
  status: 'draft',
  created_at: '2026-06-21 10:00:00',
  updated_at: '2026-06-21 10:00:00',
}

test.describe('Smart Curation frontend workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/curation_management/backend/**', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const path = url.pathname.replace('/curation_management/backend', '')
      const method = request.method()

      if (path === '/login' && method === 'POST') {
        return json(route, {
          status: 'success',
          access_token: 'frontend-isolation-token',
          token_type: 'bearer',
          username: 'demo_curator',
          role: 'curator',
        })
      }
      if (path === '/history' && method === 'GET') return json(route, { total: 0, data: [] })
      if (path === '/rss/trends' && method === 'GET') return json(route, { status: 'success', data: ['閱讀', 'AI'] })
      if (path === '/catalog/upload-history' && method === 'GET') {
        return json(route, [{
          source_file: 'history_catalog.csv',
          records_count: 120,
          vectorized_count: 120,
          imported_at: '2026-06-19T12:00:00Z',
        }])
      }
      if (path === '/catalog/validate' && method === 'POST') {
        return json(route, { valid: true, records_count: 50, errors: [] })
      }
      if (path === '/catalog/import' && method === 'POST') {
        return json(route, { status: 'success', imported_count: 50 })
      }
      if (path === '/catalog/match' && method === 'POST') {
        return json(route, {
          status: 'success',
          data: [{
            book_id: 7,
            title: 'AI 時代的閱讀力',
            author: '測試作者',
            classification_no: '020',
            match_score: 91,
            match_reason: 'pgvector語意相似度: 91%',
          }],
        })
      }
      if (path === '/generate_themes' && method === 'POST') {
        return json(route, {
          status: 'success',
          data: [{
            theme_id: 'T001',
            title: '世界閱讀日智慧策展',
            outline: '以閱讀、AI 與公共知識為核心的節慶策展。',
            target_audience: '全體市民',
            keywords: ['閱讀', 'AI'],
          }],
        })
      }
      if (path === '/export_to_proposal' && method === 'POST') {
        return json(route, { status: 'success', proposal_id: 'P001' })
      }
      if (path === '/proposals' && method === 'GET') {
        return json(route, { status: 'success', data: [proposal] })
      }
      if (path === '/proposals/P001' && method === 'PUT') {
        const body = request.postDataJSON()
        return json(route, {
          status: 'success',
          data: { ...proposal, ...body, updated_at: '2026-06-21 11:00:00' },
        })
      }
      if (path === '/proposals/P001/match' && method === 'POST') {
        return json(route, {
          status: 'success',
          data: {
            ...proposal,
            matched_books: [{
              book_id: 7,
              title: 'AI 時代的閱讀力',
              author: '測試作者',
              classification_no: '020',
              match_score: 91,
            }],
          },
        })
      }
      if (path === '/proposals/P001/export' && method === 'GET') {
        const format = url.searchParams.get('format')
        return route.fulfill({
          status: 200,
          contentType: format === 'pdf'
            ? 'application/pdf'
            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          headers: { 'Content-Disposition': `attachment; filename="proposal.${format}"` },
          body: Buffer.from(`${format}-content`),
        })
      }
      if (path === '/dashboard/stats' && method === 'GET') {
        return json(route, {
          cumulative_hours_saved: 134,
          cumulative_cost_saved: 67000,
          theme_generation_count: 15,
          proposal_export_count: 24,
        })
      }
      if (path === '/dashboard/monthly-stats' && method === 'GET') {
        return json(route, [{ month: '2026-06', hours: 42, cost: 21000 }])
      }
      if (path === '/dashboard/quarterly-stats' && method === 'GET') {
        return json(route, [{ quarter: '2026-Q2', hours: 134, cost: 67000 }])
      }
      if (path === '/dashboard/settings' && method === 'GET') {
        return json(route, { hourly_rate: 500, base_hours: 8 })
      }
      if (path === '/dashboard/settings' && method === 'POST') {
        return json(route, { status: 'success' })
      }

      return json(route, { detail: `Unhandled frontend test route: ${method} ${path}` }, 404)
    })
  })

  test('runs the current UI workflow with isolated API responses', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: '填入測試帳密' }).click()
    await page.getByRole('button', { name: '登入', exact: true }).click()
    await expect(page.getByRole('heading', { name: /從館藏資料到策展成果/ })).toBeVisible()
    await expect(page.getByText('134 小時').first()).toBeVisible()
    await expect(page.getByRole('button', { name: /策展前/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /策展中/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /策展後/ })).toBeVisible()

    await page.getByRole('button', { name: /策展中/ }).click()
    await expect(page.getByRole('heading', { name: '策展企劃管理' })).toBeVisible()
    await expect(page.locator('.ra-topbar-title')).toHaveText('策展中｜企劃編輯與匯出')
    await page.getByRole('button', { name: /策展後/ }).click()
    await expect(page.getByRole('heading', { name: '工時與成本效益' })).toBeVisible()
    await expect(page.locator('.ra-topbar-title')).toHaveText('策展後｜效益分析戰情室')
    await page.getByRole('button', { name: /策展前/ }).click()
    await expect(page.locator('.ra-topbar-title')).toHaveText('策展前｜AI 智慧策展發想')

    await page.getByRole('button', { name: /館藏匯入/ }).click()
    await page.locator('input[type="file"]').setInputFiles({
      name: 'catalog.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('title,isbn,classification_no\nBook A,9781234567890,733.4'),
    })
    await expect(page.getByText('history_catalog.csv')).toBeVisible()

    await page.getByRole('button', { name: /策展前/ }).click()
    await page.getByText('節慶策展', { exact: true }).click()
    await page.getByLabel('節慶或檔期').fill('世界閱讀日')
    await page.getByLabel('活動年份').fill('2027')
    await page.getByLabel('關鍵詞').fill('閱讀、AI')
    await page.getByRole('button', { name: '產生主題' }).click()
    await expect(page.getByText('世界閱讀日智慧策展').first()).toBeVisible()

    await page.getByRole('button', { name: '比對館藏' }).click()
    await expect(page.getByText('AI 時代的閱讀力')).toBeVisible()
    await page.getByRole('button', { name: /建立企劃書/ }).click()
    await expect(page).toHaveURL(/\/proposal$/)

    await expect(page.locator('.ql-toolbar')).toBeVisible()
    await page.getByLabel('標題').fill('世界閱讀日智慧策展（更新）')
    await page.locator('.ql-editor').fill('更新後的富文本企劃內容')
    await page.getByRole('button', { name: '儲存' }).click()
    await page.getByRole('button', { name: '匹配館藏' }).click()
    await expect(page.getByText('AI 時代的閱讀力')).toBeVisible()

    await page.getByRole('button', { name: /策展後/ }).click()
    await expect(page.getByText('134 小時')).toBeVisible()
    await page.getByRole('button', { name: '設定參數' }).click()
    await page.getByLabel('平均時薪 (NT$)').fill('250')
    await page.getByRole('button', { name: '儲存參數' }).click()

    await page.getByRole('button', { name: '登出' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('keeps editor and settings usable on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/login')
    await page.getByRole('button', { name: '填入測試帳密' }).click()
    await page.getByRole('button', { name: '登入', exact: true }).click()

    await page.goto('/proposal')
    await expect(page.locator('.ql-toolbar')).toBeVisible()
    await page.locator('.ql-editor').fill('行動版富文本內容')
    await page.getByRole('button', { name: '儲存' }).click()

    await page.goto('/dashboard')
    await page.getByRole('button', { name: '設定參數' }).click()
    await expect(page.getByRole('dialog', { name: '效益計算參數' })).toBeVisible()
    await page.getByLabel('平均時薪 (NT$)').fill('300')
    await page.getByRole('button', { name: '儲存參數' }).click()
  })
})
