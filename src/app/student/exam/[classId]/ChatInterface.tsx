'use client'

import { useState, useEffect, useRef } from 'react'
import { submitExamAnswer, forceCompleteSession } from '@/actions/student/exam'

export function ChatInterface({ logs, sessionId, classId, isCompleted, startTime, examTimeMinutes }: any) {
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [localLogs, setLocalLogs] = useState(logs)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timeUpLock, setTimeUpLock] = useState(false)
  const [violations, setViolations] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLocalLogs(logs)
  }, [logs])

  useEffect(() => {
    if (isCompleted || !startTime || !examTimeMinutes || examTimeMinutes <= 0) return

    const startTimestamp = new Date(startTime).getTime()
    const endTime = startTimestamp + examTimeMinutes * 60 * 1000
    
    let timer: NodeJS.Timeout;

    const tick = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)
      
      if (remaining === 0) {
         if (timer) clearInterval(timer)
         setTimeUpLock(true)
         // Dùng timeout để tránh alert block UI quá lâu trước khi timer re-render xong
         setTimeout(() => { alert('Thời gian vấn đáp đã kết thúc!') }, 0)
      }
    }
    
    tick()
    timer = setInterval(tick, 1000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [startTime, examTimeMinutes, isCompleted])

  useEffect(() => {
    if (violations >= 3 && !timeUpLock && !isCompleted) {
      setTimeUpLock(true)
      forceCompleteSession(sessionId, classId).then(() => {
        alert('Hệ thống đã hủy bài thi và tự động nộp do bạn vi phạm quy chế (chuyển tab/copy) quá 3 lần!')
      })
    }
  }, [violations, timeUpLock, isCompleted, sessionId, classId])

  // Anti-cheat mechanisms
  useEffect(() => {
    if (isCompleted || timeUpLock) return;

    const handleViolation = (e?: Event) => {
      if (e && e.type !== 'blur') e.preventDefault()
      setViolations(prev => prev + 1)
    }

    const handleContextMenu = (e: MouseEvent) => handleViolation(e)
    const handleCopyPaste = (e: ClipboardEvent) => handleViolation(e)
    const handleBlur = () => handleViolation()

    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopyPaste)
    document.addEventListener('paste', handleCopyPaste)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopyPaste)
      document.removeEventListener('paste', handleCopyPaste)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isCompleted, timeUpLock])

  // Tự động cuộn xuống cuối màn hình hội thoại
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [localLogs])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const tempText = inputText
    setInputText('')
    
    // Optimistic UI update
    setLocalLogs((prev: any) => [...prev, { id: Date.now().toString(), sender: 'STUDENT', message: tempText }])
    
    setLoading(true)
    const formData = new FormData()
    formData.append('sessionId', sessionId)
    formData.append('classId', classId)
    formData.append('message', tempText)
    
    await submitExamAnswer(formData)
    setLoading(false)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', border: '4px solid #cbd5e1', borderRadius: '1rem', background: 'white', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
      {violations > 0 && !isCompleted && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: '1px solid #fecaca' }}>
          ⚠️ CẢNH BÁO VI PHẠM {violations}/3 LẦN (Chuyển tab/Copy-Paste) - Phạt tự động nộp bài!
        </div>
      )}
      
      {timeLeft !== null && !isCompleted && !timeUpLock && (
        <div style={{ background: timeLeft < 60 ? '#fef2f2' : '#eff6ff', color: timeLeft < 60 ? '#ef4444' : '#2563eb', padding: '0.75rem 1.5rem', fontWeight: 700, borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
           <span>⏳ Vấn đáp tính giờ</span>
           <span style={{ animation: timeLeft < 60 ? 'pulse 2s infinite' : 'none' }}>Còn lại: {formatTime(timeLeft)}</span>
        </div>
      )}
      {timeUpLock && (
        <div style={{ background: '#ef4444', color: 'white', padding: '0.75rem 1.5rem', fontWeight: 700, textAlign: 'center' }}>
          🛑 ĐÃ HẾT THỜI GIAN LÀM BÀI VẤN ĐÁP
        </div>
      )}

      {/* Box Hội thoại của AI */}
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: '#f1f5f9' }}>
        {localLogs.map((log: any) => {
          const isStudent = log.sender === 'STUDENT'
          return (
            <div key={log.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isStudent ? 'flex-end' : 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem', fontWeight: 600, padding: '0 0.5rem' }}>
                {log.sender === 'AI' ? '🤖 Giảng viên Trí Tuệ Nhân Tạo' : isStudent ? '👨‍🎓 Bản thân' : '⚠️ Cảnh báo Hệ thống'}
              </span>
              <div 
                style={{ 
                  background: isStudent ? '#3b82f6' : log.sender === 'SYSTEM' ? '#ef4444' : 'white',
                  color: isStudent || log.sender === 'SYSTEM' ? 'white' : '#1e293b',
                  padding: '1.25rem', 
                  borderRadius: '1rem',
                  borderTopRightRadius: isStudent ? '0' : '1rem',
                  borderTopLeftRadius: isStudent ? '1rem' : '0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  maxWidth: '80%',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap',
                  fontSize: '1.05rem',
                  border: isStudent ? 'none' : '1px solid #e2e8f0'
                }}>
                {log.message}
              </div>
            </div>
          )
        })}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#64748b', fontSize: '1rem', padding: '1rem', fontStyle: 'italic', fontWeight: 'bold' }}>
            <span>⏳ Lõi Server Gemini đang đối chiếu tham chiếu chấm điểm...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Box nhập liệu Sinh viên */}
      <div style={{ borderTop: '2px solid #e2e8f0', padding: '1.5rem', background: 'white' }}>
        {isCompleted ? (
          <div style={{ textAlign: 'center', color: '#10b981', fontWeight: 800, padding: '1.5rem', fontSize: '1.5rem', textTransform: 'uppercase' }}>
            🎉 BÀI ĐÁNH GIÁ ĐÃ KẾT THÚC THÀNH CÔNG 🎉
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={timeUpLock ? "Đã hết thời gian thao tác..." : "Gõ đầy đủ chi tiết câu trả lời của bạn vào đây..."}
              style={{ flex: 1, padding: '1.25rem', border: '2px solid #cbd5e1', borderRadius: '0.75rem', fontSize: '1.1rem', outline: 'none', background: '#f8fafc' }}
              disabled={loading || timeUpLock}
              autoComplete="off"
              onPaste={(e) => { e.preventDefault(); alert('⚠️ CẢNH BÁO: Không được phép dán (paste) nội dung trong khi thi vấn đáp!') }}
              onDrop={(e) => { e.preventDefault(); alert('⚠️ CẢNH BÁO: Kéo thả (drop) văn bản bị vô hiệu hoá!') }}
            />
            <button 
              type="submit" 
              disabled={loading || !inputText.trim() || timeUpLock} 
              style={{ padding: '0 2.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer', transition: '0.2s', opacity: (loading || !inputText.trim() || timeUpLock) ? 0.5 : 1 }}
            >
              Gửi tin nhắn phản hồi
            </button>
          </form>
        )}
      </div>

    </div>
  )
}
