import React, { useEffect, useMemo, useState } from 'react'
import { Spin, message } from 'antd'
import { ArrowRight, BookOpen, RefreshCw, Sparkles, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { catalogService } from '../../../services/catalogService'
import { curationService } from '../../../services/curationService'
import { proposalService } from '../../../services/proposalService'
import './CurationThemeGenerator.css'

const normalizeThemes = (themes) =>
  (themes || []).map((theme) => ({
    id: theme.theme_id,
    theme_id: theme.theme_id,
    title: theme.title,
    outline: theme.outline,
    target_audience: theme.target_audience,
    keywords: Array.isArray(theme.keywords) ? theme.keywords : [],
    created_at: theme.create_time || theme.created_at,
  })).filter((theme) => theme.id && theme.title)

const errorMessage = (error, defaultMessage) =>
  error.response?.data?.detail || error.message || defaultMessage

const CurationThemeGenerator = () => {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [keywords, setKeywords] = useState('')
  const [themes, setThemes] = useState([])
  const [trends, setTrends] = useState([])
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [matchedBooks, setMatchedBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)

  const selectedTheme = useMemo(
    () => themes.find((theme) => theme.id === selectedThemeId) || null,
    [selectedThemeId, themes],
  )

  const loadHistory = async (showSuccess = false) => {
    try {
      const result = await curationService.getThemeHistory()
      const remoteThemes = normalizeThemes(result?.data)
      setThemes(remoteThemes)
      setSelectedThemeId((current) => (
        remoteThemes.some((theme) => theme.id === current) ? current : remoteThemes[0]?.id || null
      ))
      if (showSuccess) message.success('已更新主題歷史')
    } catch (error) {
      message.error(errorMessage(error, '無法讀取主題歷史'))
    }
  }

  useEffect(() => {
    loadHistory()
    curationService.getTrendingKeywords()
      .then((items) => setTrends(Array.isArray(items) ? items : []))
      .catch((error) => message.error(errorMessage(error, '無法讀取熱門關鍵詞')))
  }, [])

  const handleGenerateThemes = async () => {
    if (!keywords.trim()) {
      message.warning('請先輸入至少一個關鍵詞')
      return
    }

    setLoading(true)
    try {
      const generated = normalizeThemes(await curationService.generateThemes(
        keywords,
        trends.join('、'),
        '',
        prompt,
      ))
      if (!generated.length) throw new Error('AI 服務未回傳主題')
      setThemes((current) => [...generated, ...current.filter(
        (theme) => !generated.some((item) => item.id === theme.id),
      )])
      setSelectedThemeId(generated[0].id)
      setMatchedBooks([])
      message.success(`已產生 ${generated.length} 個主題`)
    } catch (error) {
      message.error(errorMessage(error, '主題生成失敗'))
    } finally {
      setLoading(false)
    }
  }

  const handleMatchCatalog = async () => {
    if (!selectedTheme) return
    setMatching(true)
    try {
      const result = await catalogService.matchCatalog(
        [selectedTheme.title, ...selectedTheme.keywords],
        6,
      )
      const books = Array.isArray(result?.data) ? result.data : []
      setMatchedBooks(books)
      message.success(`已比對 ${books.length} 筆館藏`)
    } catch (error) {
      setMatchedBooks([])
      message.error(errorMessage(error, '館藏比對失敗'))
    } finally {
      setMatching(false)
    }
  }

  const handleCreateProposal = async () => {
    if (!selectedTheme) return
    setLoading(true)
    try {
      const response = await proposalService.createProposal(
        selectedTheme.theme_id,
        selectedTheme.title,
        selectedTheme.outline,
      )
      const proposalId = response?.proposal_id || response?.data?.proposal_id
      if (!proposalId) throw new Error('建立企劃書後未取得編號')
      message.success('已建立企劃書')
      navigate('/proposal', { state: { proposalId } })
    } catch (error) {
      message.error(errorMessage(error, '建立企劃書失敗'))
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
            <h1>AI 主題生成</h1>
            <p>輸入關鍵詞與規劃需求，由後端 AI 產生並儲存策展主題。</p>
          </div>
          <button className="ra-secondary-button" onClick={() => loadHistory(true)}>
            <RefreshCw size={17} />更新歷史
          </button>
        </section>

        <section className="ra-panel prompt-panel">
          <label htmlFor="theme-keywords">關鍵詞</label>
          <input
            id="theme-keywords"
            value={keywords}
            onChange={(event) => setKeywords(event.target.value)}
            placeholder="例如：AI、資料視覺化、永續"
          />
          {trends.length > 0 && (
            <div className="prompt-chips">
              {trends.map((trend) => (
                <button key={trend} onClick={() => setKeywords((current) => (
                  current ? `${current}、${trend}` : trend
                ))}>{trend}</button>
              ))}
            </div>
          )}
          <label htmlFor="theme-prompt">補充需求</label>
          <textarea
            id="theme-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="輸入目標觀眾、策展方向或限制條件"
          />
          <div className="prompt-buttons">
            <button className="ra-primary-button" onClick={handleGenerateThemes} disabled={loading}>
              <Wand2 size={17} />{loading ? '產生中...' : '產生主題'}
            </button>
          </div>
        </section>

        <section className="ra-section-heading">
          <h2>已儲存主題</h2>
          <span>{themes.length} 筆</span>
        </section>

        <Spin spinning={loading}>
          <section className="theme-card-grid">
            {themes.map((theme) => (
              <article
                key={theme.id}
                className={`theme-option-card ${selectedThemeId === theme.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedThemeId(theme.id)
                  setMatchedBooks([])
                }}
              >
                <h3>{theme.title}</h3>
                <p>{theme.outline}</p>
                <div className="theme-tags">
                  {theme.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
                </div>
                <small>{theme.target_audience || '未設定目標觀眾'}</small>
              </article>
            ))}
            {!themes.length && <p className="empty-state">尚無主題，請輸入關鍵詞後產生。</p>}
          </section>
        </Spin>

        {selectedTheme && (
          <section className="ra-panel">
            <div className="panel-title-row">
              <h2>{selectedTheme.title}</h2>
              <div>
                <button className="ra-secondary-button" onClick={handleMatchCatalog} disabled={matching}>
                  <BookOpen size={17} />{matching ? '比對中...' : '比對館藏'}
                </button>
                <button className="ra-primary-button" onClick={handleCreateProposal} disabled={loading}>
                  建立企劃書<ArrowRight size={17} />
                </button>
              </div>
            </div>
            <p>{selectedTheme.outline}</p>
            {matchedBooks.length > 0 && (
              <div className="matched-book-list">
                {matchedBooks.map((book) => (
                  <article key={book.book_id}>
                    <strong>{book.title}</strong>
                    <span>{book.author || '作者未詳'} · {book.classification_no}</span>
                    <em>{book.match_score}%</em>
                    {book.match_reason && <p>{book.match_reason}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}

export default CurationThemeGenerator
