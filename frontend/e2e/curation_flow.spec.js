import { test, expect } from '@playwright/test';

test.describe('Smart Curation System E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept and mock API requests to isolate frontend E2E from backend dependencies

    // 1. Authentication Mock
    await page.route('**/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          access_token: 'mock-jwt-token-abcd-1234',
          token_type: 'bearer',
          username: 'test-curator',
          role: 'curator',
        }),
      });
    });

    // 2. Catalog Import Mocks
    await page.route('**/catalog/upload-history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            filename: 'history_catalog.csv',
            records_count: 120,
            imported_at: '2026-06-19T12:00:00Z',
            status: 'success',
          },
        ]),
      });
    });

    await page.route('**/catalog/validate', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          records_count: 50,
        }),
      });
    });

    await page.route('**/catalog/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          records_count: 50,
          vectorized_count: 48,
          message: '成功匯入 50 筆館藏記錄',
        }),
      });
    });

    // 3. AI Theme Generation Mocks
    await page.route('**/curation/theme-history', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            theme_id: 'T000',
            title: '舊策展主題歷史',
            outline: '舊主題的策展規劃大綱內容。',
            target_audience: '一般市民',
          },
        ]),
      });
    });

    await page.route('**/curation/generate-themes', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          theme_id: 'T001',
          title: 'AI 智慧科技大潮特展',
          outline: '展區規劃包括：AI 發展史、AI 在各產業的應用，以及我們與 AI 共生的未來書籍特展。',
          target_audience: '全體市民與大專院校學生',
        }),
      });
    });

    // 4. Proposal Management Mocks
    await page.route('**/proposal/create', async (route) => {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          proposal_id: 'P001',
          message: '已成功建立企劃書草案，請至企劃管理中心編輯。',
        }),
      });
    });

    // Get proposal detail
    await page.route('**/proposal/P001', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              proposal_id: 'P001',
              title: 'AI 智慧科技大潮特展',
              content: '<h1>E2E Test Modded Content</h1>',
              status: 'completed',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            data: {
              proposal_id: 'P001',
              title: 'AI 智慧科技大潮特展',
              content: '<h1>策展宗旨與目標</h1><p>預設擴寫企劃書內容...</p>',
              status: 'draft',
              theme_id: 'T001',
            },
          }),
        });
      }
    });

    await page.route('**/proposal/P001/match-catalog', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          matched_count: 5,
        }),
      });
    });

    await page.route('**/proposal/P001/export-word', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        body: Buffer.from('mock-docx-binary'),
      });
    });

    await page.route('**/proposal/P001/export-pdf', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('mock-pdf-binary'),
      });
    });

    // 5. Dashboard Mocks
    await page.route('**/dashboard/stats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          cumulative_hours_saved: 134.0,
          cumulative_cost_saved: 67000.0,
          theme_generation_count: 15,
          proposal_export_count: 24,
          monthly_stats: [
            { month: '1月', savedHours: 12, savedCost: 6000 },
            { month: '2月', savedHours: 18, savedCost: 9000 },
            { month: '3月', savedHours: 24, savedCost: 12000 },
            { month: '4月', savedHours: 20, savedCost: 10000 },
            { month: '5月', savedHours: 28, savedCost: 14000 },
            { month: '6月', savedHours: 32, savedCost: 16000 },
          ],
        }),
      });
    });

    await page.route('**/dashboard/settings', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ status: 'success' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hourly_rate: '500',
            base_hours: '8',
          }),
        });
      }
    });
  });

  test('successfully runs complete curation user workflow', async ({ page }) => {
    // ----------------------------------------------------
    // STEP 1: SSO Login Flow
    // ----------------------------------------------------
    await page.goto('/login');
    await expect(page.locator('h2')).toContainText('智慧策展系統');

    // Perform SSO Login
    await page.click('button:has-text("SSO 單一登入")');
    await expect(page).toHaveURL('/');

    // ----------------------------------------------------
    // STEP 2: Catalog Books Import Flow
    // ----------------------------------------------------
    await page.click('.sidebar .ant-menu-item:has-text("館藏導入")');
    await expect(page.locator('.page-header h1')).toContainText('館藏資料匯入中心');

    // Simulate drop or upload a CSV file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('.ant-upload-drag');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'catalog.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('title,isbn,classification_no\nBook A,9781234567890,733.4'),
    });

    // Check successful import message and table row updates
    await expect(page.locator('.ant-message-success:has-text("成功匯入 50 筆館藏記錄")')).toBeVisible();
    await expect(page.locator('.ant-table-row').first()).toContainText('catalog.csv');

    // ----------------------------------------------------
    // STEP 3: AI Theme Generation Flow
    // ----------------------------------------------------
    await page.click('.sidebar .ant-menu-item:has-text("AI 智慧發想")');
    await expect(page.locator('.page-header h1')).toContainText('AI 智慧策展發想');

    // Fill parameters
    await page.fill('textarea[placeholder="例如：科技、未來、創新"]', '科技, 智慧');
    await page.fill('textarea[placeholder="例如：AI 快速發展、氣候變遷"]', 'AI 快速發展');

    // Trigger AI generation
    await page.click('button:has-text("生成策展主題")');

    // Expect the theme outline card is rendered
    await expect(page.locator('.theme-card h4')).toContainText('AI 智慧科技大潮特展');

    // ----------------------------------------------------
    // STEP 4: Catalog Matching & Proposal Creation Flow
    // ----------------------------------------------------
    // Select the card by clicking it
    await page.click('.ant-card-hoverable:has-text("AI 智慧科技大潮特展")');
    
    // Perform Catalog matching
    await page.click('button:has-text("比對館藏庫")');
    await expect(page.locator('.ant-message-success:has-text("已匹配 5 本館藏")')).toBeVisible();

    // Export theme details to proposal草稿
    await page.click('button:has-text("拋轉至企劃中心")');
    await expect(page.locator('.ant-message-success:has-text("已成功建立企劃書草案")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 5: Proposal Editor Online Editing & Document Export Flow
    // ----------------------------------------------------
    await expect(page).toHaveURL('/proposal');
    await expect(page.locator('.page-header h1')).toContainText('策展企劃管理中心');
    await expect(page.locator('.proposal-item').first()).toContainText('AI 智慧科技大潮特展');

    // Simulate editing proposal title and content
    await page.fill('input[placeholder="輸入企劃書標題"]', 'AI 智慧科技大潮特展 (E2E Mod)');
    
    // Simulate rich editor text input
    await page.locator('.rich-editor').fill('<h1>Modified Header</h1><p>New E2E Content</p>');

    // Click Save
    await page.click('button:has-text("儲存企劃書")');
    await expect(page.locator('.ant-message-success:has-text("企劃書已更新")')).toBeVisible();

    // Click Export Word
    await page.click('button:has-text("匯出 Word")');
    await expect(page.locator('.ant-message-success:has-text("已匯出為 Word")')).toBeVisible();

    // Click Export PDF
    await page.click('button:has-text("匯出 PDF")');
    await expect(page.locator('.ant-message-success:has-text("已匯出為 PDF")')).toBeVisible();

    // ----------------------------------------------------
    // STEP 6: Dashboard Statistics Verification & Admin settings Flow
    // ----------------------------------------------------
    await page.click('.sidebar .ant-menu-item:has-text("效益戰情室")');
    await expect(page.locator('.page-header h1')).toContainText('效益分析戰情室');

    // Verify cost savings statistics match mock data
    await expect(page.locator('.stat-card:has-text("累計節省工時") .ant-statistic-content-value-int')).toContainText('134');
    await expect(page.locator('.stat-card:has-text("累計節省經費") .ant-statistic-content-value')).toContainText('67,000');

    // Click parameter settings
    await page.click('button:has-text("參數設置")');
    await expect(page.locator('.ant-modal-header')).toContainText('效益分析參數設置');

    // Modify hourly rate input (hourly rate is the first spinbutton)
    const inputs = page.locator('input[type="number"]');
    await inputs.nth(0).fill('250');

    // Submit settings Modal
    await page.click('.ant-modal-footer button.ant-btn-primary');
    await expect(page.locator('.ant-message-success:has-text("設置已更新")')).toBeVisible();
  });
});
