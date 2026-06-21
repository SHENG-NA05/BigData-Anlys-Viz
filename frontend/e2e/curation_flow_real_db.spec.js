import { test, expect } from '@playwright/test'

test.describe('Smart Curation System real backend workflow', () => {
  test('runs login, catalog, theme, proposal, export and dashboard flows', async ({ page }) => {
    test.setTimeout(180_000)
    const runId = Date.now()

    await page.goto('/login')
    await expect(page.getByRole('heading', { name: '策展工作台登入' })).toBeVisible()
    await page.getByPlaceholder('帳號 / Email').fill('demo_curator')
    await page.getByPlaceholder('密碼').fill('demo-password-for-local-testing-only')
    await page.getByRole('button', { name: '登入' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'AI 主題生成' })).toBeVisible()

    await page.getByRole('button', { name: /館藏匯入/ }).click()
    await expect(page).toHaveURL(/\/import$/)
    await expect(page.getByRole('heading', { name: '資料庫與素材管理' })).toBeVisible()
    await expect(page.getByText('fake_catalog_sample.csv')).toBeVisible()

    const filename = `e2e_catalog_${runId}.csv`
    const uploadResponse = page.waitForResponse((response) => (
      response.url().endsWith('/catalog/import') && response.request().method() === 'POST'
    ))
    await page.locator('input[type="file"]').setInputFiles({
      name: filename,
      mimeType: 'text/csv',
      buffer: Buffer.from(
        `title,isbn,classification_no,summary\nE2E Vector Book ${runId},978${String(runId).slice(-10)},540.1,AI data visualization integration test`,
      ),
    })
    expect((await uploadResponse).status()).toBe(200)
    await expect(page.getByText(filename)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /主題發想/ }).click()
    await expect(page.getByRole('heading', { name: 'AI 主題生成' })).toBeVisible()
    await page.getByLabel('關鍵詞').fill(`AI、資料閱讀、${runId}`)
    await page.getByLabel('補充需求').fill('產生適合公共圖書館的策展主題')
    const initialThemeCount = await page.locator('.theme-option-card').count()
    const generateResponse = page.waitForResponse((response) => (
      response.url().endsWith('/generate_themes') && response.request().method() === 'POST'
    ))
    await page.getByRole('button', { name: '產生主題' }).click()
    expect((await generateResponse).status()).toBe(200)
    await expect(page.locator('.theme-option-card')).toHaveCount(initialThemeCount + 3, { timeout: 60_000 })

    const createResponse = page.waitForResponse((response) => (
      response.url().endsWith('/export_to_proposal') && response.request().method() === 'POST'
    ))
    await page.getByRole('button', { name: /建立企劃書/ }).click()
    expect((await createResponse).status()).toBe(200)
    await expect(page).toHaveURL(/\/proposal$/)
    await expect(page.getByRole('heading', { name: '策展企劃管理' })).toBeVisible()

    const titleInput = page.getByLabel('標題')
    await expect(titleInput).not.toHaveValue('')
    await titleInput.fill(`E2E 企劃 ${runId}`)
    const updateResponse = page.waitForResponse((response) => (
      /\/proposals\/[^/]+$/.test(new URL(response.url()).pathname) && response.request().method() === 'PUT'
    ))
    await page.getByRole('button', { name: '儲存' }).click()
    expect((await updateResponse).status()).toBe(200)

    const matchResponse = page.waitForResponse((response) => (
      response.url().endsWith('/match') && response.request().method() === 'POST'
    ))
    await page.getByRole('button', { name: '匹配館藏' }).click()
    expect((await matchResponse).status()).toBe(200)
    await expect(page.locator('.matched-book-list article').first()).toBeVisible({ timeout: 30_000 })

    await page.evaluate(() => {
      window.__lastDownloadAnchor = null
      const originalClick = HTMLAnchorElement.prototype.click
      HTMLAnchorElement.prototype.click = function click() {
        window.__lastDownloadAnchor = {
          filename: this.getAttribute('download'),
          href: this.href,
        }
        return originalClick.call(this)
      }
    })
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'PDF' }).click()
    const download = await downloadPromise
    const downloadAnchor = await page.evaluate(() => window.__lastDownloadAnchor)
    expect(downloadAnchor.filename).toMatch(/\.pdf$/)
    expect(downloadAnchor.href).toMatch(/^blob:/)
    expect(await download.createReadStream()).not.toBeNull()

    await page.getByRole('button', { name: /成效儀表板/ }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByRole('heading', { name: '工時與成本效益' })).toBeVisible()
    await expect(page.getByText('累計節省工時')).toBeVisible()

    await page.getByRole('button', { name: '登出' }).click()
    await expect(page).toHaveURL(/\/login$/)
  })
})
