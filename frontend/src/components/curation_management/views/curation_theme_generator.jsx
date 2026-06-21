import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Spin, message } from 'antd'
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bookmark,
  Bot,
  ChevronLeft,
  ChevronRight,
  Eye,
  Image,
  Info,
  Lightbulb,
  MoreVertical,
  Network,
  Save,
  Settings,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { catalogService } from '../../../services/catalogService'
import { curationService } from '../../../services/curationService'
import { proposalService } from '../../../services/proposalService'
import './CurationThemeGenerator.css'

const promptSeed =
  '以「未來感與永續共生」為核心，探索科技如何形塑人類與環境的關係，並思考文化與倫理的平衡。目標觀眾為一般大眾與青少年，適合互動式與沉浸式展覽。'

const themeSeeds = [
  {
    id: 'theme-symbiotic-algorithm',
    title: '共生演算法',
    outline: '探討人與自然在智慧科技中尋求共生的未來路徑。',
    keywords: ['科技', '自然', '共生'],
    views: 128,
    saves: 12,
    match: 92,
  },
  {
    id: 'theme-sensory-extension',
    title: '感知擴張',
    outline: '延伸人類感知邊界，重塑身體、科技與環境的連結。',
    keywords: ['感知', '身體', '科技'],
    views: 96,
    saves: 8,
    match: 86,
  },
  {
    id: 'theme-sustainable-imagination',
    title: '永續想像力',
    outline: '從設計、文化與行動出發，激發面向未來的永續思維。',
    keywords: ['永續', '設計', '文化'],
    views: 88,
    saves: 6,
    match: 81,
  },
  {
    id: 'theme-future-daily',
    title: '未來日常',
    outline: '日常物件與科技如何重新定義我們的生活方式。',
    keywords: ['日常', '科技', '生活'],
    views: 72,
    saves: 5,
    match: 78,
  },
]

const insightItems = [
  { icon: Sparkles, title: '觀點亮點', text: '「共生演算法」在研究與案例中關聯度最高，且具備敘述的互動與敘事延展性。' },
  { icon: Users, title: '潛在觀眾輪廓', text: '一般大眾、青少年、科技與環境議題關注族群、教育工作者。' },
  { icon: Image, title: '展覽類型建議', text: '互動體驗、沉浸式裝置、資料視覺化、參與式共創。' },
]

const moodboard = [
  'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=420&q=80',
  'https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?auto=format&fit=crop&w=420&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=420&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=420&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=420&q=80',
  'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=420&q=80',
]

const normalizeThemes = (themes) =>
  (themes || []).map((theme, index) => ({
    id: theme.id || theme.theme_id || `generated-${Date.now()}-${index}`,
    theme_id: theme.theme_id,
    title: theme.title || `AI 主題 ${index + 1}`,
    outline: theme.outline || theme.content || '由目前研究脈絡生成的策展主題。',
    keywords: Array.isArray(theme.keywords) && theme.keywords.length ? theme.keywords : ['科技', '文化', '未來'],
    views: theme.views || 80 + index * 12,
    saves: theme.saves || 4 + index,
    match: theme.match || Math.max(72, 92 - index * 5),
  }))

const CurationThemeGenerator = () => {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState(promptSeed)
  const [themes, setThemes] = useState(themeSeeds)
  const [selectedThemeId, setSelectedThemeId] = useState(themeSeeds[0].id)
  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)
  const [matchedBooks, setMatchedBooks] = useState([])

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) || themes[0],
    [selectedThemeId, themes],
  )

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await curationService.getThemeHistory()
        const remoteThemes = normalizeThemes(result?.data)
        if (remoteThemes.length) {
          setThemes(remoteThemes)
          setSelectedThemeId(remoteThemes[0].id)
        }
      } catch (error) {
        console.info('Theme history unavailable, using local seed data.')
      }
    }

    loadHistory()
  }, [])

  const appendPrompt = (text) => {
    setPrompt((current) => `${current.trim()}\n${text}`)
    message.success('已加入 Prompt')
  }

  const showResearchContext = () => {
    Modal.info({
      title: '研究脈絡',
      width: 620,
      content: (
        <div className="ra-modal-list">
          <p>目前脈絡聚焦於永續城市、科技倫理與沉浸式互動設計。</p>
          <p>建議補充：地方社群案例、能源資料視覺化、AI 與人類協作的倫理討論。</p>
        </div>
      ),
      okText: '完成',
    })
  }

  const handleGenerateThemes = async () => {
    setLoading(true)
    try {
      const response = await curationService.generateThemes(
        '未來之境, 人與科技, 永續共生',
        prompt,
        '',
        prompt,
      )
      const generatedThemes = normalizeThemes(response)
      const nextThemes = generatedThemes.length ? generatedThemes : themeSeeds
      setThemes(nextThemes)
      setSelectedThemeId(nextThemes[0].id)
      message.success('已生成主題構想')
    } catch (error) {
      const fallback = normalizeThemes([
        {
          title: '人機共感實驗室',
          outline: '以 AI、感測資料與互動裝置呈現人與城市環境的共同感知。',
          keywords: ['AI', '感測', '城市'],
          match: 89,
        },
        {
          title: '未來棲地圖譜',
          outline: '從永續材料、能源流與公民參與出發，描繪下一代生活場景。',
          keywords: ['永續', '能源', '生活'],
          match: 84,
        },
      ])
      setThemes(fallback)
      setSelectedThemeId(fallback[0].id)
      message.warning('後端 AI 暫時不可用，已產生示範構想')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = () => {
    localStorage.setItem(
      'ra-theme-draft',
      JSON.stringify({ prompt, selectedTheme, savedAt: new Date().toISOString() }),
    )
    message.success('草案已儲存')
  }

  const handleMatchCatalog = async () => {
    if (!selectedTheme) return
    setMatching(true)
    try {
      const result = await catalogService.matchCatalog([selectedTheme.title, ...selectedTheme.keywords], 6)
      setMatchedBooks(result?.data || [])
      message.success(`已比對 ${result?.data?.length || 0} 筆館藏`)
    } catch (error) {
      setMatchedBooks([
        { title: 'Human Ecosystems and Machine Imagination', author: 'M. Rivera', match_score: 94 },
        { title: 'Designing with More-than-Human Worlds', author: 'A. Chen', match_score: 88 },
        { title: 'AI, Culture and Sustainable Futures', author: 'L. Huang', match_score: 82 },
      ])
      message.info('目前使用示範館藏比對結果')
    } finally {
      setMatching(false)
    }
  }

  const handleCreateProposal = async () => {
    if (!selectedTheme) return
    setLoading(true)
    try {
      const response = await proposalService.createProposal(
        selectedTheme.theme_id || selectedTheme.id,
        selectedTheme.title,
        selectedTheme.outline,
      )
      localStorage.setItem(
        'exported_proposal',
        JSON.stringify({
          id: response?.proposal_id || 'LOCAL-RA-PROPOSAL',
          title: selectedTheme.title,
          content: selectedTheme.outline,
          themeId: selectedTheme.theme_id || selectedTheme.id,
          createdAt: new Date().toISOString(),
          status: 'draft',
          matched_books: matchedBooks,
        }),
      )
      message.success('已建立策展方向')
      navigate('/proposal')
    } catch (error) {
      localStorage.setItem(
        'exported_proposal',
        JSON.stringify({
          id: 'LOCAL-RA-PROPOSAL',
          title: selectedTheme.title,
          content: selectedTheme.outline,
          themeId: selectedTheme.id,
          createdAt: new Date().toISOString(),
          status: 'draft',
          matched_books: matchedBooks,
        }),
      )
      message.warning('後端暫時不可用，已建立本機草案')
      navigate('/proposal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="curation-generator ra-workspace">
      <main className="ra-work-main">
        <section className="ra-page-hero">
          <div>
            <span className="ra-hero-icon"><Sparkles size={27} /></span>
            <h1>AI 背景探索與主題生成</h1>
            <p>結合研究資料與生成式 AI，協助你從脈絡中發掘觀點，轉化為可執行的策展方向。</p>
          </div>
          <button className="ra-secondary-button" onClick={showResearchContext}>
            查看研究脈絡
            <BookOpen size={18} />
          </button>
        </section>

        <section className="ra-panel prompt-panel">
          <div className="prompt-panel-header">
            <strong>Prompt 輸入與生成建議</strong>
            <button onClick={() => appendPrompt('請補充可操作的觀眾互動方式與展場分區。')}>範例</button>
          </div>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <div className="prompt-actions">
            <div className="prompt-chips">
              <button onClick={() => appendPrompt('+ 關鍵詞建議')}>+ 關鍵詞建議</button>
              <button onClick={() => appendPrompt('+ 加入參考素材')}>+ 加入參考素材</button>
              <button onClick={() => appendPrompt('+ 觀眾輪廓')}>+ 觀眾輪廓</button>
              <button onClick={() => appendPrompt('+ 展覽類型')}>+ 展覽類型</button>
            </div>
            <div className="prompt-buttons">
              <button className="ra-secondary-button" onClick={() => appendPrompt('請延伸為三段研究問題與兩個案例方向。')}>
                <Settings size={17} />
                延伸研究
              </button>
              <button className="ra-primary-button" onClick={handleGenerateThemes}>
                <Wand2 size={17} />
                生成構想
              </button>
              <button className="ra-secondary-button" onClick={handleSaveDraft}>
                <Save size={17} />
                儲存草案
              </button>
            </div>
          </div>
        </section>

        <section className="ra-section-heading">
          <h2>主題候選卡片</h2>
          <Info size={15} />
          <button onClick={() => message.info('已展開全部候選主題')}>
            全部展開
            <ChevronRight size={16} />
          </button>
        </section>

        <Spin spinning={loading}>
          <section className="theme-card-grid">
            {themes.map((theme) => (
              <article
                key={theme.id}
                className={`theme-option-card ${selectedThemeId === theme.id ? 'active' : ''}`}
                onClick={() => setSelectedThemeId(theme.id)}
              >
                <div className="theme-card-top">
                  <h3>{theme.title}</h3>
                  <MoreVertical size={18} />
                </div>
                <p>{theme.outline}</p>
                <div className="theme-tags">
                  {theme.keywords.map((keyword) => (
                    <span key={keyword}>{keyword}</span>
                  ))}
                </div>
                <div className="theme-card-meta">
                  <span><Eye size={14} />{theme.views}</span>
                  <span><Bookmark size={14} />{theme.saves}</span>
                  <span>相似度 {theme.match}%</span>
                </div>
              </article>
            ))}
          </section>
        </Spin>

        <section className="ra-two-column">
          <div className="ra-panel concept-map">
            <div className="panel-title-row">
              <h2>關鍵詞與概念地圖</h2>
              <div>
                <button><Network size={16} /></button>
                <button><BookOpen size={16} /></button>
              </div>
            </div>
            <div className="map-stage">
              {['人類與科技關係', '透明異質接觸', '數理與演算法', '倫理與價值連續', '文化敘事與記憶', '教育與參與', '視覺浸演想像'].map((node, index) => (
                <span key={node} className={`map-node node-${index}`}>{node}</span>
              ))}
              <strong>{selectedTheme?.title || '未來感與永續共生'}</strong>
            </div>
            <div className="map-legend">
              <span><i className="gold" />核心主題</span>
              <span><i />子主題</span>
              <span><i className="blue" />延伸概念</span>
            </div>
          </div>

          <div className="ra-panel research-summary">
            <div className="panel-title-row">
              <h2>背景脈絡摘要</h2>
              <span>來源 24</span>
            </div>
            <ul>
              <li>
                <strong>全球趨勢</strong>
                後疫情時代加速數位轉型與永續互動，永續發展目標成為社會角色的展覽語彙。
              </li>
              <li>
                <strong>學術觀點</strong>
                人機共生、後人類主義、環境人文等研究，強調科技發展需與倫理、在地知識共進。
              </li>
              <li>
                <strong>案例參考</strong>
                Ars Electronica Festival 2024、V&A Future Starts Here、國立自然科學博物館案例。
              </li>
            </ul>
            <button className="ra-text-button" onClick={handleMatchCatalog} disabled={matching}>
              {matching ? '比對中...' : '查看多節脈絡資料'}
            </button>
          </div>
        </section>

        <section className="ra-panel moodboard-panel">
          <div className="panel-title-row">
            <h2>視覺風格參考 / Moodboard</h2>
            <button onClick={() => message.info('已切換下一組視覺參考')}>
              全部查看
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="moodboard-strip">
            <button className="mood-nav"><ChevronLeft size={18} /></button>
            {moodboard.map((imageUrl) => (
              <div key={imageUrl} className="mood-tile" style={{ backgroundImage: `url(${imageUrl})` }} />
            ))}
            <button className="mood-nav"><ChevronRight size={18} /></button>
          </div>
        </section>
      </main>

      <aside className="ra-insight-rail">
        <section className="ra-panel">
          <h2><Sparkles size={20} />AI 洞察與建議</h2>
          <div className="insight-list">
            {insightItems.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title}>
                  <Icon size={18} />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              )
            })}
          </div>
          <button className="ra-secondary-button full" onClick={showResearchContext}>查看完整分析報告</button>
        </section>

        <section className="ra-panel risk-panel">
          <h2><AlertTriangle size={20} />風險提醒</h2>
          <ul>
            <li>科技倫理議題可能引發爭議，建議加入多元觀點。</li>
            <li>資料來源需注意時效性與地域代表性。</li>
            <li>互動裝置維護成本與技術穩定性須納入評估。</li>
          </ul>
          <button className="ra-secondary-button full" onClick={() => message.info('已開啟風險評估詳情')}>檢視風險評估詳情</button>
        </section>

        <section className="ra-panel next-step-panel">
          <h2><Bot size={20} />推薦下一步</h2>
          <ol>
            <li>
              <strong>完善研究脈絡與參考案例</strong>
              <span>建議補充 3-5 篇學術文章與 2 個在地案例。</span>
              <button onClick={showResearchContext}>前往研究脈絡</button>
            </li>
            <li>
              <strong>觀眾深度訪談</strong>
              <span>建立觀眾問題地圖，強化主題共鳴。</span>
              <button onClick={() => message.success('已建立訪談計畫')}>建立訪談計畫</button>
            </li>
            <li>
              <strong>概念草圖與敘事線</strong>
              <span>將主題轉化為展區分區與敘事流程。</span>
              <button onClick={() => message.success('已加入規劃清單')}>開始規劃</button>
            </li>
          </ol>
          <button className="ra-primary-button full" onClick={handleCreateProposal}>
            建立策展方向（基於此提案）
            <ArrowRight size={18} />
          </button>
        </section>

        {matchedBooks.length > 0 && (
          <section className="ra-panel matched-panel">
            <h2><Lightbulb size={20} />館藏比對</h2>
            {matchedBooks.map((book) => (
              <p key={`${book.title}-${book.match_score}`}>
                <strong>{book.title}</strong>
                <span>{book.author || '未列作者'} · {book.match_score || 80}%</span>
              </p>
            ))}
          </section>
        )}
      </aside>
    </div>
  )
}

export default CurationThemeGenerator
