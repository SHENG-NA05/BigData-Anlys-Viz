import React, { useEffect, useMemo, useState } from 'react'
import { Spin, message } from 'antd'
import { BookOpen, FileDown, FileText, RefreshCw, Save, Sparkles } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { proposalService } from '../../../services/proposalService'
import './ProposalEditor.css'

const normalizeProposal = (proposal) => ({
  id: proposal.proposal_id,
  themeId: proposal.theme_id,
  title: proposal.title,
  content: proposal.content || '',
  matchedBooks: proposal.matched_books || [],
  status: proposal.status || 'draft',
  createdAt: proposal.created_at,
  updatedAt: proposal.updated_at,
})

const errorMessage = (error, defaultMessage) =>
  error.response?.data?.detail || error.message || defaultMessage

const downloadBlob = (filename, blob) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const ProposalEditor = () => {
  const location = useLocation()
  const requestedProposalId = location.state?.proposalId
  const [proposals, setProposals] = useState([])
  const [selectedProposalId, setSelectedProposalId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')
  const [matchedBooks, setMatchedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [matching, setMatching] = useState(false)

  const selectedProposal = useMemo(
    () => proposals.find((proposal) => proposal.id === selectedProposalId) || null,
    [proposals, selectedProposalId],
  )

  const applyProposal = (proposal) => {
    setSelectedProposalId(proposal.id)
    setTitle(proposal.title)
    setContent(proposal.content)
    setStatus(proposal.status)
    setMatchedBooks(proposal.matchedBooks)
  }

  const loadProposals = async (showSuccess = false) => {
    setLoading(true)
    try {
      const response = await proposalService.listProposals()
      const items = (response?.data || []).map(normalizeProposal)
      setProposals(items)
      const next = items.find((item) => item.id === (requestedProposalId || selectedProposalId)) || items[0]
      if (next) {
        applyProposal(next)
      } else {
        setSelectedProposalId(null)
        setTitle('')
        setContent('')
        setMatchedBooks([])
      }
      if (showSuccess) message.success('已更新企劃書清單')
    } catch (error) {
      message.error(errorMessage(error, '無法讀取企劃書'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProposals()
  }, [])

  const handleSave = async () => {
    if (!selectedProposalId || !title.trim()) return
    setSaving(true)
    try {
      const response = await proposalService.updateProposal(
        selectedProposalId,
        title.trim(),
        content,
        status,
      )
      const updated = normalizeProposal(response.data)
      setProposals((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )))
      applyProposal(updated)
      message.success('企劃書已儲存至資料庫')
    } catch (error) {
      message.error(errorMessage(error, '儲存企劃書失敗'))
    } finally {
      setSaving(false)
    }
  }

  const handleMatchCatalog = async () => {
    if (!selectedProposalId) return
    setMatching(true)
    try {
      const response = await proposalService.matchCatalog(selectedProposalId)
      const updated = normalizeProposal(response.data)
      setProposals((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )))
      applyProposal(updated)
      message.success(`已匹配 ${updated.matchedBooks.length} 筆館藏`)
    } catch (error) {
      message.error(errorMessage(error, '館藏匹配失敗'))
    } finally {
      setMatching(false)
    }
  }

  const handleExport = async (format) => {
    if (!selectedProposalId) return
    setExporting(true)
    try {
      const blob = format === 'pdf'
        ? await proposalService.exportToPdf(selectedProposalId)
        : await proposalService.exportToWord(selectedProposalId)
      downloadBlob(`策展企劃-${title}.${format === 'pdf' ? 'pdf' : 'docx'}`, blob)
      message.success(`已匯出 ${format.toUpperCase()}`)
    } catch (error) {
      message.error(errorMessage(error, '匯出失敗'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="proposal-page">
      <main className="proposal-main">
        <section className="proposal-hero">
          <div>
            <span className="ra-hero-icon"><Sparkles size={27} /></span>
            <h1>策展企劃管理</h1>
            <p>讀取、編輯、匹配與匯出資料庫中的企劃書。</p>
          </div>
          <button className="ra-secondary-button" onClick={() => loadProposals(true)}>
            <RefreshCw size={17} />更新清單
          </button>
        </section>

        <Spin spinning={loading}>
          <section className="proposal-editor-grid">
            <aside className="ra-panel proposal-list-panel">
              <h2>企劃書清單</h2>
              {proposals.map((proposal) => (
                <button
                  key={proposal.id}
                  className={proposal.id === selectedProposalId ? 'active' : ''}
                  onClick={() => applyProposal(proposal)}
                >
                  <strong>{proposal.title}</strong>
                  <span>{proposal.updatedAt || proposal.createdAt}</span>
                </button>
              ))}
              {!proposals.length && <p>尚無企劃書。</p>}
            </aside>

            <section className="ra-panel proposal-edit-panel">
              {selectedProposal ? (
                <>
                  <label htmlFor="proposal-title">標題</label>
                  <input
                    id="proposal-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                  />
                  <label htmlFor="proposal-status">狀態</label>
                  <select id="proposal-status" value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="draft">草稿</option>
                    <option value="review">審核中</option>
                    <option value="published">已發布</option>
                  </select>
                  <label htmlFor="proposal-content">內容</label>
                  <textarea
                    id="proposal-content"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    rows={20}
                  />
                  <div className="proposal-hero-actions">
                    <button className="ra-primary-button" onClick={handleSave} disabled={saving}>
                      <Save size={17} />{saving ? '儲存中...' : '儲存'}
                    </button>
                    <button className="ra-secondary-button" onClick={handleMatchCatalog} disabled={matching}>
                      <BookOpen size={17} />{matching ? '匹配中...' : '匹配館藏'}
                    </button>
                    <button className="ra-secondary-button" onClick={() => handleExport('docx')} disabled={exporting}>
                      <FileText size={17} />Word
                    </button>
                    <button className="ra-secondary-button" onClick={() => handleExport('pdf')} disabled={exporting}>
                      <FileDown size={17} />PDF
                    </button>
                  </div>
                </>
              ) : <p className="empty-state">請先建立企劃書。</p>}
            </section>
          </section>
        </Spin>

        {selectedProposal && matchedBooks.length > 0 && (
          <section className="ra-panel matched-book-list">
            <h2>匹配館藏 ({matchedBooks.length})</h2>
            {matchedBooks.map((book) => (
              <article key={book.book_id}>
                <strong>{book.title}</strong>
                <span>{book.author || '作者未詳'} · {book.classification_no}</span>
                <em>{book.match_score}%</em>
                {book.match_reason && <p>{book.match_reason}</p>}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}

export default ProposalEditor
