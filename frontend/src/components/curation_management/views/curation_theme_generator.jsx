import React, { useState } from 'react'
import { message, Modal } from 'antd'
import { useNavigate } from 'react-router-dom'
import {
  AlertOutlined,
  ArrowRightOutlined,
  BookOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  FileSearchOutlined,
  MoreOutlined,
  SaveOutlined,
  StarFilled,
} from '@ant-design/icons'
import { curationService } from '../../../services/curationService'
import { proposalService } from '../../../services/proposalService'
import './CurationThemeGenerator.css'

const themeCards = [
  {
    theme_id: 'DEMO-THEME-AI',
    title: '共生演算法',
    body: '探討人與自然在開放科技中尋求共生的未來路徑。',
    tags: ['科技', '自然', '共生'],
    views: 128,
    saves: 12,
    score: '92%',
    active: true,
  },
  {
    theme_id: 'DEMO-THEME-CITY',
    title: '感知擴張',
    body: '延伸人類感知邊界，重塑身體、科技與環境的連結。',
    tags: ['感知', '身體', '科技'],
    views: 96,
    saves: 8,
    score: '86%',
  },
  {
    title: '永續想像力',
    body: '從設計、文化與行動出發，激發面向未來的永續思維。',
    tags: ['永續', '設計', '文化'],
    views: 88,
    saves: 6,
    score: '81%',
  },
  {
    title: '未來日常',
    body: '日常物件與科技如何重新定義我們的生活方式。',
    tags: ['日常', '科技', '生活'],
    views: 72,
    saves: 5,
    score: '78%',
  },
]

const insightItems = [
  {
    icon: <BulbOutlined />,
    title: '觀點亮點',
    body: '「共生演算法」在研究與案例中關聯度最高，且具備觀眾互動與敘事延展性。',
  },
  {
    icon: <EyeOutlined />,
    title: '潛在觀眾輪廓',
    body: '一般大眾、青少年、科技與環境關注族群、教育工作者。',
  },
  {
    icon: <BookOutlined />,
    title: '展覽類型建議',
    body: '互動體驗、沉浸式裝置、資料視覺化、參與式共創。',
  },
]

const moodImages = [
  'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1486718448742-163732cd1544?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=480&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=480&q=80',
]

const nextSteps = [
  ['完善研究脈絡與參考案例', '建議補充 3-5 篇學術文章與 2 個在地案例。'],
  ['觀眾深度訪談', '建立觀眾同理地圖，強化主題共鳴。'],
  ['概念草圖與敘事線', '將主題轉化為展區分區與故事流程。'],
]

const CurationThemeGenerator = () => {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState(
    '以「未來感與永續共生」為核心，探索科技如何形塑人類與環境的關係，並思考文化與倫理的平衡。\n目標觀眾為一般大眾與青少年，適合互動式與沉浸式展覽。'
  )
  const [candidates, setCandidates] = useState(themeCards)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const selectedTheme = candidates[selectedIndex]

  const appendPrompt = (text) => {
    setPrompt((current) => `${current.trim()}\n${text}`)
  }

  const handleGenerateThemes = async () => {
    setIsGenerating(true)
    try {
      const keywords = Array.from(new Set(prompt.match(/[\u4e00-\u9fa5A-Za-z0-9]{2,}/g) || ['未來', '永續', '科技']))
        .slice(0, 6)
      const response = await curationService.generateThemes(keywords, '', '', prompt)
      const generated = (response.data || []).map((item, index) => ({
        theme_id: item.theme_id,
        title: item.title,
        body: item.outline,
        target_audience: item.target_audience,
        tags: keywords.slice(index, index + 3).length ? keywords.slice(index, index + 3) : ['策展', 'AI', '共創'],
        views: 100 - index * 9,
        saves: 10 - index,
        score: `${92 - index * 5}%`,
      }))

      if (generated.length > 0) {
        setCandidates(generated)
        setSelectedIndex(0)
        message.success('已由後端 AI 產生主題候選')
        return
      }
      throw new Error('AI 回傳為空')
    } catch (error) {
      const fallbackThemes = [
        {
          theme_id: 'DEMO-THEME-AI',
          title: '共生演算法',
          body: '以科技倫理、永續生活與公共參與為核心，規劃可互動、可討論的未來展覽。',
          tags: ['科技', '倫理', '共生'],
          views: 128,
          saves: 12,
          score: '92%',
        },
        {
          theme_id: 'DEMO-THEME-CITY',
          title: '城市感知實驗室',
          body: '串連地方記憶、環境資料與沉浸式互動，讓觀眾重新理解城市日常。',
          tags: ['城市', '資料', '互動'],
          views: 96,
          saves: 8,
          score: '86%',
        },
        {
          title: '永續想像力',
          body: '從設計、文化與行動出發，激發面向未來的永續思維。',
          tags: ['永續', '設計', '文化'],
          views: 88,
          saves: 6,
          score: '81%',
        },
      ]
      setCandidates(fallbackThemes)
      setSelectedIndex(0)
      message.warning('AI API 暫不可用，已改用本機示範資料生成候選主題')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveDraft = () => {
    localStorage.setItem('ra2_curation_prompt', prompt)
    localStorage.setItem('ra2_selected_theme', JSON.stringify(selectedTheme))
    message.success('已儲存策展草案')
  }

  const handleCreateProposal = async () => {
    if (!selectedTheme) return
    handleSaveDraft()
    try {
      if (selectedTheme.theme_id) {
        await proposalService.createProposal(selectedTheme.theme_id, selectedTheme.title, selectedTheme.body)
      }
      message.success('已建立策展方向，前往內容編排')
    } catch (error) {
      message.info('已用目前主題建立前端草案，後端企劃可稍後同步')
    }
    navigate('/proposal')
  }

  const showInfo = (title, content) => {
    Modal.info({
      title,
      content,
      okText: '知道了',
    })
  }

  return (
    <div className="ra-page curation-generator">
      <div className="ra-page-header">
        <div className="ra-title">
          <span className="ra-title-icon">✦</span>
          <div>
            <h1>AI 背景探索與主題生成</h1>
            <p>結合研究資料與生成式 AI，協助你從脈絡中發掘觀點，轉化為可執行的策展方向。</p>
          </div>
        </div>
        <button
          className="ra-button"
          type="button"
          onClick={() => showInfo('研究脈絡', '目前主題已整理全球趨勢、學術觀點、案例參考與視覺風格，可在下方背景脈絡摘要檢視。')}
        >
          <BookOutlined />
          查看研究脈絡
        </button>
      </div>

      <div className="ra-grid curation-layout">
        <div className="ra-main-column">
          <section className="ra-card prompt-panel">
            <div className="prompt-heading">
              <strong>Prompt 輸入與生成建議</strong>
              <span className="ra-tag">範例</span>
            </div>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <div className="prompt-actions">
              <div className="ra-chip-row">
                <button type="button" onClick={() => appendPrompt('關鍵詞：人機共生、永續科技、資料倫理、沉浸互動。')}>+ 關鍵詞建議</button>
                <button type="button" onClick={() => appendPrompt('參考素材：國際沉浸式展覽案例、地方文化資料、科技倫理研究。')}>+ 加入參考素材</button>
                <button type="button" onClick={() => appendPrompt('觀眾輪廓：一般大眾、青少年、科技與環境議題關注者。')}>+ 觀眾輪廓</button>
                <button type="button" onClick={() => appendPrompt('展覽類型：互動體驗、沉浸式裝置、資料視覺化、參與式共創。')}>+ 展覽類型</button>
              </div>
              <div className="prompt-buttons">
                <button
                  className="ra-button"
                  type="button"
                  onClick={() => showInfo('延伸研究', '已建議補充 Ars Electronica、V&A、國立自然科學博物館案例，以及科技倫理與環境人文研究。')}
                >
                  <FileSearchOutlined />
                  延伸研究
                </button>
                <button
                  className="ra-button primary"
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateThemes}
                >
                  ✦ {isGenerating ? '生成中...' : '生成構想'}
                </button>
                <button className="ra-button" type="button" onClick={handleSaveDraft}>
                  <SaveOutlined />
                  儲存草案
                </button>
              </div>
            </div>
          </section>

          <section className="theme-section">
            <div className="section-title-row">
              <h2>主題候選卡片</h2>
              <span>全部展開 〉</span>
            </div>
            <div className="theme-card-grid">
              {candidates.map((theme, index) => (
                <article
                  key={theme.title}
                  className={`theme-option ${index === selectedIndex ? 'is-active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') setSelectedIndex(index)
                  }}
                >
                  <div className="theme-option-top">
                    <h3>{theme.title}</h3>
                    {index === selectedIndex ? <StarFilled /> : <MoreOutlined />}
                  </div>
                  <p>{theme.body}</p>
                  <div className="theme-tags">
                    {theme.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="theme-meta">
                    <span><EyeOutlined /> {theme.views}</span>
                    <span><BookOutlined /> {theme.saves}</span>
                    <strong>相似度 {theme.score}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="context-grid">
            <section className="ra-card map-card">
              <div className="ra-card-header">
                <h3>關鍵詞與概念地圖</h3>
                <small>核心主題 / 子主題 / 延伸概念</small>
              </div>
              <div className="concept-map">
                <span className="map-node center">未來感與永續共生</span>
                <span className="map-node n1">人類與科技關係</span>
                <span className="map-node n2">透明與聯繫照護</span>
                <span className="map-node n3">數理與演算法</span>
                <span className="map-node n4">倫理與價值連續</span>
                <span className="map-node n5">文化敘事與記憶</span>
                <span className="map-node n6">視覺沉浸想像</span>
              </div>
              <div className="map-legend">
                <span><i />核心主題</span>
                <span><i />子主題</span>
                <span><i />延伸概念</span>
              </div>
            </section>

            <section className="ra-card research-card">
              <div className="ra-card-header">
                <h3>背景脈絡摘要</h3>
                <span className="ra-tag">來源 24</span>
              </div>
              <div className="research-list">
                <p><strong>全球趨勢</strong>後疫情時代加速數位轉型與遠距互動，永續發展目標持續影響博物館的展陳方向與社會角色。</p>
                <p><strong>學術觀點</strong>人機共生從人類主義、環境人文等研究，強調科技發展需與倫理、在地知識與生態平衡並行。</p>
                <p><strong>案例參考</strong>Ars Electronica、V&A、國立自然科學博物館等案例皆可作為敘事與互動規劃參考。</p>
              </div>
              <button
                className="inline-link"
                type="button"
                onClick={() => showInfo('更多脈絡資料', '建議補充：科技倫理白皮書、永續城市案例、青少年科技素養研究與互動展覽評估報告。')}
              >
                查看更多脈絡資料
              </button>
            </section>
          </div>

          <section className="ra-card moodboard">
            <div className="ra-card-header">
              <h3>視覺風格參考 / Moodboard</h3>
              <small>全部查看 〉</small>
            </div>
            <div className="mood-strip">
              {moodImages.map((src) => (
                <img key={src} src={src} alt="策展視覺參考" />
              ))}
              <button type="button" onClick={() => message.info('已切換下一組視覺參考素材')}><ArrowRightOutlined /></button>
            </div>
          </section>
        </div>

        <aside className="ra-rail">
          <section className="ra-card rail-card">
            <div className="rail-title purple">
              <BulbOutlined />
              <h3>AI 洞察與建議</h3>
            </div>
            {insightItems.map((item) => (
              <div className="rail-list-item" key={item.title}>
                <span>{item.icon}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
            <button className="rail-action" type="button" onClick={() => showInfo('完整分析報告', '主題強度：高。建議優先發展「共生演算法」，並補足多元觀點與互動設備成本評估。')}>查看完整分析報告</button>
          </section>

          <section className="ra-card rail-card">
            <div className="rail-title red">
              <AlertOutlined />
              <h3>風險提醒</h3>
            </div>
            <ul className="risk-list">
              <li>科技倫理議題可能引發爭議，建議加入多元觀點。</li>
              <li>資料來源需注意時效性與地域代表性。</li>
              <li>互動裝置維護成本與技術穩定性須納入評估。</li>
            </ul>
            <button className="rail-action" type="button" onClick={() => showInfo('風險評估詳情', '主要風險為科技倫理爭議、資料來源代表性與互動設備維護成本。建議在企劃階段加入審查清單。')}>檢視風險評估詳情</button>
          </section>

          <section className="ra-card rail-card next-card">
            <div className="rail-title blue">
              <ClockCircleOutlined />
              <h3>推薦下一步</h3>
            </div>
            {nextSteps.map(([title, body], index) => (
              <div className="next-step" key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{body}</p>
                </div>
              </div>
            ))}
            <button className="ra-button primary wide" type="button" onClick={handleCreateProposal}>
              建立策展方向
              <ArrowRightOutlined />
            </button>
          </section>
        </aside>
      </div>
      <div className="ra-page-bottom" />
    </div>
  )
}

export default CurationThemeGenerator
