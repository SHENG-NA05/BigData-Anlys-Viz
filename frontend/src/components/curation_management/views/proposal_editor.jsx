import React, { useState } from 'react'
import { message, Modal } from 'antd'
import {
  CheckCircleOutlined,
  CommentOutlined,
  DeleteOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  LinkOutlined,
  MoreOutlined,
  SaveOutlined,
  SettingOutlined,
  ShareAltOutlined,
  StarOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { proposalService } from '../../../services/proposalService'
import './ProposalEditor.css'

const outlineItems = [
  { title: '序章', desc: '人與科技，共構未來' },
  { title: '第一展區', desc: '感知擴張：延伸人類的邊界', active: true },
  { title: '第二展區', desc: '永續想像力：生態與科技的對話' },
  { title: '互動體驗區', desc: '未來實驗室' },
  { title: '結語', desc: '共生未來，從此開始' },
]

const tasks = [
  ['補充第一展區互動裝置說明', '05/20 到期', true],
  ['確認引用來源與授權', '05/21 到期'],
  ['校對全篇標題一致性', '05/22 到期'],
  ['新增展區導覽語音腳本', ''],
]

const suggestions = [
  '建議加入最新研究引用以強化專業性',
  '可補充跨文化觀點，提升多元性',
  '標題吸引力可再精煉以提升吸引力',
]

const comments = [
  ['王策展', '05/19 14:10', '這裡可補充一個具體案例，會更有說服力！'],
  ['策劃助理', '05/19 13:45', '圖像很棒，建議加上版權或來源說明。'],
  ['林顧問人（你）', '05/19 12:22', '引言語氣再朝一致性調整。'],
]

const ProposalEditor = () => {
  const [title, setTitle] = useState('感知擴張：延伸人類的邊界')
  const [intro, setIntro] = useState('科技的進步，讓我們突破了時間與空間的限制，擴展感官、延伸身體，重新定義「人」的邊界。從工具的延伸到意識的延展，我們如何在科技的協助下，看見更多、感受更深，並重新想像自己與世界的關係？')
  const [sections, setSections] = useState(outlineItems)
  const [activeSection, setActiveSection] = useState(1)
  const [todoItems, setTodoItems] = useState(tasks.map(([task, date, urgent]) => ({ task, date, urgent, done: false })))
  const [commentText, setCommentText] = useState('')
  const [commentItems, setCommentItems] = useState(comments)

  const showInfo = (titleText, content) => {
    Modal.info({
      title: titleText,
      content,
      okText: '知道了',
    })
  }

  const downloadFile = (filename, content, type) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const proposalHtml = () => `
    <html><head><meta charset="utf-8"><title>${title}</title></head>
    <body>
      <h1>${title}</h1>
      <p>${intro}</p>
      <h2>延伸的感官</h2>
      <p>從望遠鏡、顯微鏡到穿戴式裝置，人類不斷延伸自身的感官邊界。</p>
      <h2>身體的延伸</h2>
      <p>外骨骼、腦機與人機介面，讓身體能力得以擴展與修復。</p>
    </body></html>
  `

  const handleSave = async () => {
    const content = proposalHtml()
    localStorage.setItem('ra2_proposal_draft', content)
    try {
      await proposalService.updateProposal('DEMO-PROPOSAL-AI', content)
      message.success('草案已同步儲存')
    } catch (error) {
      message.success('草案已儲存在本機')
    }
  }

  const handleAddSection = () => {
    const nextIndex = sections.length + 1
    setSections((current) => [
      ...current,
      { title: `新增展區 ${nextIndex}`, desc: '請輸入展區主題與內容方向' },
    ])
    setActiveSection(sections.length)
    message.success('已新增展區')
  }

  const handleSuggestion = (item) => {
    setIntro((current) => `${current}\n\n補充建議：${item}`)
    message.success('已套用 AI 編輯建議')
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return
    setCommentItems((current) => [
      ['林顧問人（你）', new Date().toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }), commentText.trim()],
      ...current,
    ])
    setCommentText('')
    message.success('留言已新增')
  }

  const handleCopyShareLink = async () => {
    const link = `${window.location.origin}/proposal`
    try {
      await navigator.clipboard.writeText(link)
      message.success('分享連結已複製')
    } catch (error) {
      showInfo('分享連結', link)
    }
  }

  return (
    <div className="ra-page proposal-editor">
      <div className="ra-page-header">
        <div className="ra-title">
          <span className="ra-title-icon">✦</span>
          <div>
            <h1>策展內容整合與編排</h1>
            <p>整合素材、AI 協作生成與編排展區內容，規劃敘事動線並完成校稿輸出。</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="ra-button" type="button" onClick={() => showInfo('版本管理', '目前版本：v1.3.2。最近儲存：2025/05/19 14:32。') }><FileWordOutlined />版本管理</button>
          <button className="ra-button" type="button" onClick={() => showInfo('專案設定', '可調整協作者、校稿規則、輸出格式與展區權限。') }><SettingOutlined />專案設定</button>
        </div>
      </div>

      <section className="ra-card proposal-metrics">
        {[
          ['展區數量', '5', '組'],
          ['待校稿項目', '12', '篇'],
          ['協作者', '6', '人'],
          ['最新版本', 'v1.3.2', '更新於 05/19 14:32'],
        ].map(([label, value, suffix]) => (
          <div className="metric-cell" key={label}>
            <span>{label}</span>
            <strong>{value}<small>{suffix}</small></strong>
          </div>
        ))}
      </section>

      <section className="ra-card proposal-tool-strip">
        {[
          ['匯入素材', '文字 / 圖片 / 檔案'],
          ['AI 生成文案', '改寫、優化、摘要'],
          ['自動摘要', '濃縮重點內容'],
          ['生成展區標題', '多版本建議'],
          ['版本比較', '檢視差異內容'],
        ].map(([titleText, desc]) => (
          <button
            type="button"
            key={titleText}
            onClick={() => showInfo(titleText, `${desc} 已準備好，可套用到目前展區草案。`)}
          >
            <StarOutlined />
            <strong>{titleText}</strong>
            <span>{desc}</span>
          </button>
        ))}
        <button type="button" className="tool-more" onClick={() => showInfo('更多工具', '可加入翻譯、版面檢查、引用格式整理與圖片授權檢核。')}><MoreOutlined /></button>
      </section>

      <div className="proposal-grid">
        <aside className="proposal-left">
          <section className="ra-card outline-card">
            <div className="ra-card-header">
              <h3>展區結構與敘事動線</h3>
              <button type="button" onClick={handleAddSection}>+ 新增展區</button>
            </div>
            <div className="outline-list">
              {sections.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  className={index === activeSection ? 'is-active' : ''}
                  onClick={() => setActiveSection(index)}
                >
                  <span className="drag-handle">⋮⋮</span>
                  <div>
                    <small>{index === 0 ? '序章' : item.title}</small>
                    <strong>{item.desc}</strong>
                  </div>
                  <MoreOutlined />
                </button>
              ))}
            </div>
          </section>

          <section className="ra-card flow-card">
            <h3>敘事動線預覽</h3>
            <div className="flow-line">
              {[1, 2, 3, 4, 5].map((step) => <span key={step}>{step}</span>)}
            </div>
            <div className="flow-labels">
              <span>序章</span>
              <span>展區 1</span>
              <span>展區 2</span>
              <span>互動體驗區</span>
              <span>結語</span>
            </div>
          </section>

          <section className="ra-card task-card">
            <h3>待辦事項（6）</h3>
            {todoItems.map((item, index) => (
              <label key={item.task} className={item.urgent ? 'urgent' : ''}>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={(event) => {
                    setTodoItems((current) => current.map((todo, todoIndex) => (
                      todoIndex === index ? { ...todo, done: event.target.checked } : todo
                    )))
                  }}
                />
                <span>{item.task}</span>
                <small>{item.date}</small>
              </label>
            ))}
          </section>
        </aside>

        <main className="ra-card editor-card">
          <div className="editor-state-row">
            <h2>第一展區｜感知擴張：延伸人類的邊界</h2>
            <span>狀態：撰寫中</span>
          </div>

          <div className="field-group">
            <label>標題</label>
            <div className="title-field">
              <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={60} />
              <small>{title.length}/60</small>
            </div>
            <div className="field-actions">
              <button type="button" onClick={() => setTitle('感知擴張：人機共生的未來邊界')}>✦ AI 建議標題</button>
              <button type="button" onClick={() => {
                setTitle((current) => `${current}｜互動體驗版`)
                message.success('已改寫標題')
              }}><LinkOutlined /> 改寫</button>
            </div>
          </div>

          <div className="field-group intro-field">
            <label>引言</label>
            <textarea value={intro} onChange={(event) => setIntro(event.target.value)} />
            <div className="field-actions">
              <small>{intro.length}/300</small>
              <button type="button" onClick={() => {
                setIntro('科技讓人類感官穿越時間與空間的限制，也重新開啟我們理解世界的方式。本展區以互動裝置與案例敘事，邀請觀眾思考「人」的邊界如何在工具、身體與意識之間持續延伸。')
                message.success('AI 改寫已套用')
              }}>✦ AI 改寫</button>
              <button type="button" onClick={() => message.info('語氣已設定為：專業')}>語氣：專業⌄</button>
            </div>
          </div>

          <div className="editor-toolbar-ra">
            {['段落', 'B', 'I', 'U', '≡', '•', '“', '🔗', '▦', '⋯'].map((tool) => (
              <button key={tool} type="button" onClick={() => message.info(`已套用工具：${tool}`)}>{tool}</button>
            ))}
          </div>

          <article className="editor-body">
            <h2>延伸的感官</h2>
            <p>
              從望遠鏡、顯微鏡到穿戴式裝置，人類不斷延伸自身的感官邊界。感知原本無法觸及的世界，
              這些技術不僅擴大了我們的視野，更改變了我們理解世界的方式。
            </p>
            <div className="editor-image-wrap">
              <img
                src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=960&q=80"
                alt="沉浸式科技展場"
              />
              <div className="image-tools">
                <button type="button" onClick={() => showInfo('圖片資訊', '圖片用於沉浸式科技展場示意，請於正式輸出前補上授權來源。')}><FileImageOutlined /></button>
                <button type="button" onClick={handleCopyShareLink}><LinkOutlined /></button>
                <button type="button" onClick={() => message.warning('示範模式：圖片未實際刪除')}><DeleteOutlined /></button>
              </div>
            </div>
            <h3>身體的延伸</h3>
            <p>
              外骨骼、腦機與人機介面，讓身體能力得以擴展與修復，也開啟了人類與機械共生的新可能。
              參觀者不再只是觀看，而是可學習、可協作的體驗者。
            </p>
          </article>

          <div className="insert-strip">
            {['文字', '圖片', '互動裝置', '引用', '標籤', '分隔線'].map((item) => (
              <button key={item} type="button" onClick={() => message.success(`已插入${item}區塊`)}>{item}</button>
            ))}
          </div>

          <footer className="editor-footer">
            <span>已儲存於 14:32</span>
            <span>字數：862</span>
            <span>100%</span>
            <button className="ra-button" type="button" onClick={handleSave}>
              <SaveOutlined /> 儲存
            </button>
          </footer>
        </main>

        <aside className="proposal-right">
          <section className="ra-card rail-card">
            <div className="rail-title purple">
              <StarOutlined />
              <h3>AI 編輯建議 <small>3</small></h3>
            </div>
            {suggestions.map((item) => (
              <div className="suggestion-row" key={item}>
                <span />
                <p>{item}</p>
                <button type="button" onClick={() => handleSuggestion(item)}>查看建議</button>
              </div>
            ))}
            <button className="rail-action" type="button" onClick={() => showInfo('全部建議', suggestions.join('；'))}>全部建議 〉</button>
          </section>

          <section className="ra-card rail-card comment-card">
            <div className="rail-title">
              <CommentOutlined />
              <h3>協作留言（3）</h3>
            </div>
            <input
              placeholder="撰寫留言..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleAddComment()
              }}
            />
            {commentItems.map(([name, time, text], index) => (
              <div className="comment-row" key={`${name}-${time}`}>
                <img
                  src={`https://i.pravatar.cc/80?img=${index + 12}`}
                  alt={name}
                />
                <div>
                  <strong>{name}<small>{time}</small></strong>
                  <p>{text}</p>
                </div>
              </div>
            ))}
            <button className="rail-action" type="button" onClick={handleAddComment}>新增 / 查看全部留言</button>
          </section>

          <section className="ra-card rail-card export-card">
            <div className="rail-title">
              <FileImageOutlined />
              <h3>預覽與輸出</h3>
            </div>
            <div className="export-grid">
              <button type="button" onClick={() => showInfo('預覽版面', <div dangerouslySetInnerHTML={{ __html: proposalHtml() }} />)}><FileImageOutlined />預覽版面</button>
              <button type="button" onClick={() => message.success('已切換校稿模式，請依右側校稿狀態逐項確認')}><CheckCircleOutlined />校稿模式</button>
              <button type="button" onClick={() => downloadFile('策展企劃書.doc', proposalHtml(), 'application/msword;charset=utf-8')}><FileWordOutlined />匯出 Word</button>
              <button type="button" onClick={() => downloadFile('策展企劃書.pdf', proposalHtml(), 'application/pdf')}><FilePdfOutlined />匯出 PDF</button>
              <button type="button" onClick={handleCopyShareLink}><ShareAltOutlined />分享連結</button>
            </div>
          </section>

          <section className="ra-card rail-card review-card">
            <div className="rail-title">
              <CheckCircleOutlined />
              <h3>校稿狀態</h3>
            </div>
            <div className="review-meter">
              <strong>78%</strong>
            </div>
            {['內容完整性', '引用與授權', '語句流暢度', '圖像與版權', '格式一致性'].map((item, index) => (
              <p key={item}><CheckCircleOutlined className={index < 3 ? 'ok' : ''} />{item}</p>
            ))}
          </section>

          <section className="ra-card rail-card">
            <div className="rail-title red">
              <WarningOutlined />
              <h3>風險提醒 <small>2</small></h3>
            </div>
            <ul className="risk-list">
              <li>尚有 2 張圖片未標註來源或授權。</li>
              <li>引用來源中有 1 筆超過 5 年，建議更新。</li>
            </ul>
          </section>
        </aside>
      </div>
      <div className="ra-page-bottom" />
    </div>
  )
}

export default ProposalEditor
