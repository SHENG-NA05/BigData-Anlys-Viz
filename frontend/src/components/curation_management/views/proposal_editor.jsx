import React, { useEffect, useMemo, useState } from 'react'
import { Modal, Progress, message } from 'antd'
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  FileCog,
  FileDown,
  FileText,
  Image,
  LayoutGrid,
  Link2,
  ListChecks,
  MessageSquare,
  MoreVertical,
  PenLine,
  Plus,
  Quote,
  Save,
  Settings,
  Share2,
  Sparkles,
  Type,
} from 'lucide-react'
import { proposalService } from '../../../services/proposalService'
import './ProposalEditor.css'

const defaultSections = [
  { id: 'intro', title: '第一展區', subtitle: '感知擴張：延伸人類的邊界' },
  { id: 'future', title: '第二展區', subtitle: '永續想像力：生態與科技的對話' },
  { id: 'interactive', title: '互動體驗區', subtitle: '未來實驗室' },
  { id: 'ending', title: '結語', subtitle: '共生未來：從此開始' },
]

const defaultTasks = [
  { text: '補充第一展區互動裝置說明', due: '05/20', done: false },
  { text: '確認引用來源與授權', due: '05/21', done: false },
  { text: '校對全篇標題一致性', due: '05/22', done: false },
  { text: '新增展區導覽語音腳本', due: '', done: false },
]

const downloadBlob = (filename, content, type = 'text/plain;charset=utf-8') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const ProposalEditor = () => {
  const [proposalId, setProposalId] = useState('LOCAL-RA-PROPOSAL')
  const [title, setTitle] = useState('感知擴張：延伸人類的邊界')
  const [intro, setIntro] = useState(
    '科技的進步，讓我們突破了時間與空間的限制，擴展感官、延伸身體，重新定義「人」的邊界。從工具的延伸到智慧的延展，我們如何在科技的協助下，看見更多、感受更深，並重新想像自己與世界的關係？',
  )
  const [body, setBody] = useState(
    '從望遠鏡、顯微鏡到穿戴式裝置，人類不斷延伸自身的感官邊界。感知原本無法觸及的世界，這些技術不僅擴大了我們的視野，更改變了我們理解世界的方式。',
  )
  const [sections, setSections] = useState(defaultSections)
  const [activeSectionId, setActiveSectionId] = useState(defaultSections[0].id)
  const [tasks, setTasks] = useState(defaultTasks)
  const [comments, setComments] = useState([
    { author: '王策展', time: '05/19 14:10', text: '這裡可補充一個具體案例，會更有說服力。' },
    { author: '策劃助理', time: '05/19 13:45', text: '圖像很棒，建議加上版權或來源說明。' },
  ])
  const [newComment, setNewComment] = useState('')
  const [saving, setSaving] = useState(false)

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || sections[0],
    [activeSectionId, sections],
  )

  useEffect(() => {
    const stored = localStorage.getItem('exported_proposal')
    if (!stored) return

    try {
      const proposal = JSON.parse(stored)
      setProposalId(proposal.id || 'LOCAL-RA-PROPOSAL')
      setTitle(proposal.title || title)
      setIntro(proposal.content || intro)
    } catch (error) {
      console.info('Stored proposal could not be loaded.')
    }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      id: proposalId,
      title,
      content: `${intro}\n\n${body}`,
      sections,
      updatedAt: new Date().toISOString(),
    }

    try {
      if (!String(proposalId).startsWith('LOCAL')) {
        await proposalService.updateProposal(proposalId, title, payload.content, 'draft')
      }
      localStorage.setItem('ra-proposal-draft', JSON.stringify(payload))
      message.success('提案已儲存')
    } catch (error) {
      localStorage.setItem('ra-proposal-draft', JSON.stringify(payload))
      message.warning('後端暫時不可用，已儲存在本機草案')
    } finally {
      setSaving(false)
    }
  }

  const handleExport = async (format) => {
    const filename = `策展提案-${title}.${format === 'pdf' ? 'pdf' : 'docx'}`
    try {
      const blob = format === 'pdf'
        ? await proposalService.exportToPdf(proposalId)
        : await proposalService.exportToWord(proposalId)
      downloadBlob(filename, blob, format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      message.success(`已匯出 ${format.toUpperCase()}`)
    } catch (error) {
      downloadBlob(filename, `# ${title}\n\n${intro}\n\n${body}`)
      message.info(`後端匯出尚未完成，已下載本機 ${format.toUpperCase()} 草稿`)
    }
  }

  const addSection = () => {
    const next = {
      id: `section-${Date.now()}`,
      title: `新增展區 ${sections.length}`,
      subtitle: '請輸入展區敘事重點',
    }
    setSections((current) => [...current, next])
    setActiveSectionId(next.id)
    message.success('已新增展區')
  }

  const updateActiveSubtitle = (value) => {
    setSections((current) =>
      current.map((section) =>
        section.id === activeSectionId ? { ...section, subtitle: value } : section,
      ),
    )
  }

  const addComment = () => {
    if (!newComment.trim()) return
    setComments((current) => [
      { author: '林願展人', time: '剛剛', text: newComment.trim() },
      ...current,
    ])
    setNewComment('')
  }

  const showAction = (titleText, detail) => {
    Modal.info({
      title: titleText,
      content: detail,
      okText: '完成',
    })
  }

  return (
    <div className="proposal-page">
      <main className="proposal-main">
        <section className="proposal-hero">
          <div>
            <span className="ra-hero-icon"><Sparkles size={27} /></span>
            <h1>策展內容整合與編排</h1>
            <p>整合素材、AI 協作生成與編排展區內容，規劃敘事動線並完成校稿輸出。</p>
          </div>
          <div className="proposal-hero-actions">
            <button className="ra-secondary-button" onClick={() => showAction('版本管理', '目前版本 v1.3.2，可回復到前 5 次儲存紀錄。')}>
              <FileCog size={17} />
              版本管理
            </button>
            <button className="ra-secondary-button" onClick={() => showAction('專案設定', '可設定展覽語氣、輸出格式與協作者權限。')}>
              <Settings size={17} />
              專案設定
            </button>
          </div>
        </section>

        <section className="proposal-stats ra-panel">
          {[
            ['展區數量', '5 組'],
            ['待校稿項目', '12 篇'],
            ['協作者', '6 人'],
            ['最新版本', 'v1.3.2'],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <section className="proposal-tools ra-panel">
          {[
            [FileText, '匯入素材', '文字 / 圖片 / 檔案'],
            [Sparkles, 'AI 生成文案', '改寫、優化、摘要'],
            [ClipboardList, '自動摘要', '展線重點內容'],
            [LayoutGrid, '生成展區標題', '多版本建議'],
            [FileCog, '版本比較', '檢視差異內容'],
          ].map(([Icon, titleText, sub]) => (
            <button key={titleText} onClick={() => showAction(titleText, sub)}>
              <Icon size={22} />
              <span>
                <strong>{titleText}</strong>
                <small>{sub}</small>
              </span>
            </button>
          ))}
          <button onClick={() => showAction('更多工具', '引用格式、翻譯與無障礙檢查工具已備妥。')}>
            <MoreVertical size={22} />
          </button>
        </section>

        <section className="proposal-builder">
          <aside className="proposal-outline ra-panel">
            <div className="panel-title-row">
              <h2>展區結構與敘事動線</h2>
              <button onClick={addSection}><Plus size={16} />新增展區</button>
            </div>
            <div className="section-list">
              <button className="section-item">
                <span>序章</span>
                <strong>人與科技，共構未來</strong>
              </button>
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  className={`section-item ${activeSectionId === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  <span>{section.title} {index < 2 ? index + 1 : ''}</span>
                  <strong>{section.subtitle}</strong>
                </button>
              ))}
            </div>

            <div className="storyline">
              <h3>敘事動線預覽</h3>
              <div>{['序章', '展區 1', '展區 2', '互動體驗區', '結語'].map((step) => <span key={step}>{step}</span>)}</div>
            </div>

            <div className="task-list">
              <h3>待辦事項 ({tasks.length})</h3>
              {tasks.map((task, index) => (
                <label key={task.text}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => {
                      setTasks((current) =>
                        current.map((item, idx) => idx === index ? { ...item, done: !item.done } : item),
                      )
                    }}
                  />
                  <span>{task.text}</span>
                  <em>{task.due}</em>
                </label>
              ))}
            </div>
          </aside>

          <article className="proposal-editor-panel ra-panel">
            <div className="editor-top">
              <div>
                <strong>{activeSection?.title}</strong>
                <span>狀態：撰寫中</span>
              </div>
              <button onClick={() => showAction('AI 建議標題', '可嘗試「感官的延伸」、「身體之外的身體」、「被科技放大的世界」。')}>
                <Bot size={16} />
                AI 建議標題
              </button>
            </div>

            <label className="editor-field">
              <span>標題</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} />
              <em>{title.length}/60</em>
            </label>

            <label className="editor-field">
              <span>引言</span>
              <textarea value={intro} onChange={(event) => setIntro(event.target.value)} maxLength={300} />
              <em>{intro.length}/300</em>
            </label>

            <div className="editor-toolbar">
              {[Type, PenLine, ListChecks, Quote, Link2, Image, LayoutGrid, MoreVertical].map((Icon, index) => (
                <button key={index} onClick={() => showAction('編輯工具', '此工具已套用到目前段落。')}>
                  <Icon size={17} />
                </button>
              ))}
            </div>

            <h2>延伸的感官</h2>
            <div className="editor-body">
              <textarea value={body} onChange={(event) => setBody(event.target.value)} />
              <figure>
                <img src="https://images.unsplash.com/photo-1517971071642-34a2d3ecc9cd?auto=format&fit=crop&w=900&q=80" alt="沉浸式藍色數位展場" />
                <figcaption>
                  <button><Copy size={16} /></button>
                  <button><Link2 size={16} /></button>
                  <button><Image size={16} /></button>
                </figcaption>
              </figure>
            </div>

            <label className="editor-field compact">
              <span>小節主題</span>
              <input value={activeSection?.subtitle || ''} onChange={(event) => updateActiveSubtitle(event.target.value)} />
            </label>

            <div className="insert-strip">
              {[
                [Type, '文字'],
                [Image, '圖片'],
                [LayoutGrid, '互動裝置'],
                [Quote, '引用'],
                [FileText, '標籤'],
                [Download, '分隔線'],
              ].map(([Icon, label]) => (
                <button key={label} onClick={() => showAction(label, `已準備插入「${label}」區塊。`)}>
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </div>

            <div className="editor-footer">
              <span>已儲存於 14:32</span>
              <span>字數：862</span>
              <button onClick={handleSave} disabled={saving}>
                <Save size={16} />
                {saving ? '儲存中' : '儲存'}
              </button>
            </div>
          </article>
        </section>
      </main>

      <aside className="proposal-rail">
        <section className="ra-panel ai-suggestions">
          <h2><Sparkles size={20} />AI 編輯建議 <span>3</span></h2>
          {['建議加入最新研究引用以強化專業性', '可補充跨文化觀點，提升多元性', '標題可引言可再精練以提升吸引力'].map((item) => (
            <p key={item}>
              <span>{item}</span>
              <button onClick={() => message.success('已套用建議')}>套用建議</button>
            </p>
          ))}
        </section>

        <section className="ra-panel comment-panel">
          <h2><MessageSquare size={20} />協作留言 ({comments.length})</h2>
          <div className="comment-input">
            <input value={newComment} onChange={(event) => setNewComment(event.target.value)} placeholder="撰寫留言..." />
            <button onClick={addComment}>送出</button>
          </div>
          {comments.map((comment) => (
            <article key={`${comment.author}-${comment.time}-${comment.text}`}>
              <strong>{comment.author}</strong>
              <time>{comment.time}</time>
              <p>{comment.text}</p>
            </article>
          ))}
        </section>

        <section className="ra-panel output-panel">
          <h2><FileDown size={20} />預覽與輸出</h2>
          <button onClick={() => showAction('預覽版面', '已產生目前展區的閱讀版預覽。')}><Image size={18} />預覽版面</button>
          <button onClick={() => showAction('校稿模式', '已開啟校稿模式，待辦清單將同步高亮。')}><CheckCircle2 size={18} />校稿模式</button>
          <button onClick={() => handleExport('docx')}><FileText size={18} />匯出 Word</button>
          <button onClick={() => handleExport('pdf')}><FileDown size={18} />匯出 PDF</button>
          <button onClick={() => {
            navigator.clipboard?.writeText(window.location.href)
            message.success('已複製分享連結')
          }}><Share2 size={18} />分享連結</button>
        </section>

        <section className="ra-panel quality-panel">
          <h2><CheckCircle2 size={20} />校稿狀態</h2>
          <div className="quality-score">
            <Progress type="circle" percent={78} size={96} strokeColor="#9b7440" />
            <ul>
              <li>內容完整性</li>
              <li>引用與授權</li>
              <li>語句流暢度</li>
              <li>圖像與版權</li>
              <li>格式一致性</li>
            </ul>
          </div>
        </section>

        <section className="ra-panel risk-panel">
          <h2><AlertTriangle size={20} />風險提醒 <span>2</span></h2>
          <ul>
            <li>尚有 2 張圖片未標註來源或授權。</li>
            <li>引用來源中有 1 筆超過 5 年，建議更新。</li>
          </ul>
        </section>
      </aside>
    </div>
  )
}

export default ProposalEditor
