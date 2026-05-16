'use client'

import { useState, useEffect, useRef } from 'react'
import { submitQuizAnswers } from '@/actions/student/quiz'
import styles from './page.module.css'
import { createClient } from '@supabase/supabase-js'

export function QuizInterface({ sessionId, classId, isCompleted, startTime, examTimeMinutes }: { sessionId: string, classId: string, isCompleted: boolean, startTime?: string, examTimeMinutes?: number }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [scoreInfo, setScoreInfo] = useState<{score: number, correct: number, total: number} | null>(null)
  
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [violations, setViolations] = useState(0)
  const answersRef = useRef(answers)
  
  useEffect(() => { answersRef.current = answers }, [answers])

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
         setSubmitting(true)
         submitQuizAnswers(sessionId, classId, answersRef.current).then(res => {
           if (res && res.success) {
             setScoreInfo({ score: res.score || 0, correct: res.correct || 0, total: res.total || 0 })
           }
           setSubmitting(false)
           alert('Đã hết thời gian làm bài! Hệ thống tự động nộp bài.')
           window.location.reload()
         })
      }
    }
    
    tick()
    timer = setInterval(tick, 1000)
    return () => {
       if (timer) clearInterval(timer)
    }
  }, [startTime, examTimeMinutes, isCompleted, sessionId, classId])

  useEffect(() => {
    if (violations >= 3 && !isCompleted && !submitting) {
         setSubmitting(true)
         submitQuizAnswers(sessionId, classId, answersRef.current).then(res => {
           if (res && res.success) {
             setScoreInfo({ score: res.score || 0, correct: res.correct || 0, total: res.total || 0 })
           }
           setSubmitting(false)
           alert('Hệ thống đã hủy bài thi và tự động nộp do bạn vi phạm quy chế (chuyển tab/copy) quá 3 lần!')
           window.location.reload()
         })
    }
  }, [violations, isCompleted, submitting, sessionId, classId])

  // Anti-cheat mechanisms
  useEffect(() => {
    if (isCompleted || submitting) return;

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
  }, [isCompleted, submitting])

  useEffect(() => {
    async function loadQuestions() {
      // Vì đây là Client Component, ta gọi supabase client hoăc fetch API.
      // Thay vì setup thêm API, ta có thể inject supabase
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data } = await supabase
        .from('session_questions')
        .select('*, questions!inner(id, content, options, clos(code))')
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true })
      
      if (data) {
        setQuestions(data)
        const initAns: Record<string, string> = {}
        let cCount = 0
        data.forEach(q => {
          if (q.student_answer) initAns[q.question_id] = q.student_answer
          if (q.is_correct) cCount++
        })
        setAnswers(initAns)
        if (isCompleted && data.length > 0) {
           setScoreInfo({ score: Math.round((cCount / data.length) * 10), correct: cCount, total: data.length })
        }
      }
      setLoading(false)
    }
    loadQuestions()
  }, [sessionId])

  const handleSelect = (questionId: string, option: string) => {
    if (isCompleted) return
    setAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const handleSubmit = async () => {
    if (!confirm('Bạn có chắc chắn muốn nộp bài? Khng thể sửa sau khi đã nộp.')) return
    setSubmitting(true)
    const res = await submitQuizAnswers(sessionId, classId, answers)
    if (res && res.success) {
      setScoreInfo({ score: res.score || 0, correct: res.correct || 0, total: res.total || 0 })
    }
    setSubmitting(false)
  }

  if (loading) return <div style={{padding: '2rem', textAlign: 'center'}}>Đang tải đề thi ngẫu nhiên...</div>

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', height: '100%', overflowY: 'auto' }}>
      {violations > 0 && !isCompleted && (
        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.6rem', textAlign: 'center', fontWeight: 'bold', fontSize: '0.95rem', borderBottom: '1px solid #fecaca', marginBottom: '1.5rem', borderRadius: '0.5rem' }}>
          ⚠️ CẢNH BÁO VI PHẠM {violations}/3 LẦN (Chuyển tab/Copy-Paste) - Phạt tự động nộp bài!
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{color: '#1e3a8a', margin: 0}}>📑 BÀI THI TRẮC NGHIỆM</h2>
        
        {timeLeft !== null && !isCompleted && (
          <div style={{ 
            background: timeLeft < 60 ? '#fef2f2' : '#eff6ff', 
            color: timeLeft < 60 ? '#ef4444' : '#2563eb', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.5rem', 
            fontWeight: 700,
            border: `2px solid ${timeLeft < 60 ? '#fca5a5' : '#bfdbfe'}`,
            animation: timeLeft < 60 ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
          }}>
            ⏱ Thời gian còn lại: {formatTime(timeLeft)}
          </div>
        )}

        {isCompleted && scoreInfo && (
           <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
             <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '1.1rem' }}>Điểm: <strong style={{color: '#ef4444', fontSize: '1.3rem'}}>{scoreInfo.score}/10</strong> ({scoreInfo.correct}/{scoreInfo.total})</span>
             <span style={{background: '#10b981', color: 'white', padding: '0.4rem 0.75rem', borderRadius: '1rem', fontSize: '0.9rem', fontWeight: 600}}>✅ Đã Nộp Bài</span>
           </div>
        )}
      </div>
      
      {Object.entries(
        questions.reduce((acc, sq) => {
          const qObj = Array.isArray(sq.questions) ? sq.questions[0] : sq.questions
          const cloCode = qObj?.clos?.code || 'Câu hỏi'
          if (!acc[cloCode]) acc[cloCode] = []
          acc[cloCode].push(sq)
          return acc
        }, {} as Record<string, any[]>)
      ).map(([cloCode, groupQs]: [string, any]) => (
        <div key={cloCode} style={{marginBottom: '2.5rem'}}>
          <h3 style={{color: '#0284c7', marginBottom: '1rem', borderBottom: '2px solid #e0f2fe', paddingBottom: '0.5rem'}}>
            Phần: {cloCode}
          </h3>
          
          {groupQs.map((sq: any, index: number) => {
            const qObj = Array.isArray(sq.questions) ? sq.questions[0] : sq.questions
            const isCorrect = sq.is_correct
            return (
              <div key={sq.id} style={{marginBottom: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'}}>
                <p style={{fontWeight: 600, fontSize: '1.05rem', color: '#1e293b', marginBottom: '1rem', lineHeight: 1.5}}>
                  <span style={{background: '#38bdf8', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', marginRight: '0.5rem', fontSize: '0.8rem'}}>Câu {index + 1}</span>
                  {qObj.content}
                </p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  {(qObj.options || []).map((opt: string, i: number) => {
                    const selected = answers[qObj.id] === opt
                    
                    let optBg = selected ? '#eff6ff' : '#f8fafc'
                    let optBorder = selected ? '1px solid #3b82f6' : '1px solid #e2e8f0'
                    
                    if (isCompleted) {
                      if (selected && isCorrect) {
                        optBg = '#dcfce7'; optBorder = '1px solid #22c55e'
                      } else if (selected && !isCorrect) {
                        optBg = '#fee2e2'; optBorder = '1px solid #ef4444'
                      }
                    }

                    return (
                      <label key={i} style={{display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: optBg, border: optBorder, borderRadius: '0.5rem', cursor: isCompleted ? 'default' : 'pointer', transition: '0.2s'}}>
                        <input 
                          type="radio" 
                          name={`q-${qObj.id}`} 
                          disabled={isCompleted}
                          checked={selected}
                          onChange={() => handleSelect(qObj.id, opt)}
                          style={{width: '1.2rem', height: '1.2rem'}}
                        />
                        <span style={{color: '#334155'}}>{opt}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {!isCompleted && questions.length > 0 && (
        <div style={{textAlign: 'center', marginTop: '2rem', marginBottom: '1rem'}}>
          <button 
            onClick={handleSubmit} 
            disabled={submitting} 
            style={{background: '#3b82f6', color: 'white', padding: '1rem 3rem', borderRadius: '2rem', border: 'none', fontSize: '1.1rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'}}>
            {submitting ? 'Đang chấm điểm...' : 'Nộp Bài & Xem Điểm'}
          </button>
        </div>
      )}
      {questions.length === 0 && (
        <p style={{color: '#64748b', textAlign: 'center', marginTop: '3rem'}}>Không có câu hỏi nào trong đề thi này.</p>
      )}
    </div>
  )
}
