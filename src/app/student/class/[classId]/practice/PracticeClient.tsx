'use client'

import { useState } from 'react'
import { generatePracticeQuestions } from '@/actions/student/practice'
import Link from 'next/link'

export function PracticeClient({ classId, courseId, courseName, clos }: any) {
  const [selectedClo, setSelectedClo] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [error, setError] = useState('')
  const [results, setResults] = useState<any>({}) // { qIndex: { chosen, isCorrect } }
  const [showExplanation, setShowExplanation] = useState<number | null>(null)

  const handleStartPractice = async () => {
    if (!selectedClo) return
    setLoading(true)
    setError('')
    setQuestions([])
    setResults({})
    setShowExplanation(null)
    
    try {
      const res = await generatePracticeQuestions(courseId, selectedClo)
      if (res.error) setError(res.error)
      else setQuestions(res.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (qIdx: number, answer: string) => {
    if (results[qIdx]) return // Already answered
    const isCorrect = answer === questions[qIdx].correct_answer
    setResults({ ...results, [qIdx]: { chosen: answer, isCorrect } })
    setShowExplanation(qIdx)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
      <Link href={`/student/class/${classId}`} style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        🔙 Quay lại lớp học
      </Link>
      
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '2rem', borderRadius: '1rem', color: 'white', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '1.75rem' }}>🤖 Ôn tập cá nhân cùng AI</h1>
        <p style={{ margin: '0.5rem 0 0', opacity: 0.9 }}>Môn học: {courseName}</p>
      </div>

      {!questions.length ? (
        <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>Chọn nội dung bạn muốn rèn luyện:</h3>
          <select 
            value={selectedClo} 
            onChange={(e) => setSelectedClo(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1.5px solid #cbd5e1', fontSize: '1rem', marginBottom: '1.5rem', outline: 'none' }}
          >
            <option value="">-- Chọn Chuẩn đầu ra (CLO) --</option>
            {clos.map((clo: any) => (
              <option key={clo.id} value={clo.id}>{clo.code}: {clo.content}</option>
            ))}
          </select>

          <button 
            onClick={handleStartPractice}
            disabled={!selectedClo || loading}
            style={{ width: '100%', padding: '1rem', background: '#1e3a8a', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', opacity: (!selectedClo || loading) ? 0.6 : 1, fontSize: '1rem' }}
          >
            {loading ? '🤖 AI đang soạn câu hỏi...' : '🔥 Bắt đầu rèn luyện ngay'}
          </button>
          
          {error && <div style={{ marginTop: '1rem', color: '#ef4444', background: '#fef2f2', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fca5a5' }}>{error}</div>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0, color: '#1e3a8a' }}>✍️ Bài tập rèn luyện (5 câu)</h3>
             <button onClick={() => setQuestions([])} style={{ background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>Chọn lại CLO</button>
          </div>
          
          {questions.map((q, idx) => (
            <div key={idx} style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '1.1rem', marginBottom: '1rem' }}>Câu {idx + 1}: {q.content}</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {q.options.map((opt: string, oIdx: number) => {
                  const res = results[idx]
                  const isChosen = res?.chosen === opt
                  const isCorrect = opt === q.correct_answer
                  
                  let borderColor = '#cbd5e1'
                  let bgColor = 'white'
                  if (res) {
                    if (isCorrect) { borderColor = '#10b981'; bgColor = '#f0fdf4' }
                    else if (isChosen) { borderColor = '#ef4444'; bgColor = '#fef2f2' }
                  } else if (isChosen) {
                    borderColor = '#3b82f6'
                  }

                  return (
                    <button 
                      key={oIdx}
                      onClick={() => handleAnswer(idx, opt)}
                      disabled={!!res}
                      style={{ padding: '1rem', textAlign: 'left', borderRadius: '0.5rem', border: `2px solid ${borderColor}`, background: bgColor, cursor: res ? 'default' : 'pointer', fontSize: '0.95rem', transition: '0.2s', fontWeight: isChosen ? 700 : 400 }}
                    >
                      {opt}
                      {res && isCorrect && <span style={{ float: 'right', color: '#10b981' }}>✅</span>}
                      {res && isChosen && !isCorrect && <span style={{ float: 'right', color: '#ef4444' }}>❌</span>}
                    </button>
                  )
                })}
              </div>

              {results[idx] && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.5rem', borderLeft: '4px solid #3b82f6' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>
                    <strong>💡 Giải thích từ AI:</strong> {q.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}

          <div style={{ textAlign: 'center', padding: '2rem' }}>
             <button 
               onClick={handleStartPractice}
               style={{ background: '#10b981', color: 'white', padding: '1rem 2rem', borderRadius: '2rem', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.4)' }}
             >
               🔄 Làm bộ câu hỏi khác
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
