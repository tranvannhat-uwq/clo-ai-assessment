'use client'

import { useState } from 'react'
import { updateCLOExamCount } from '@/actions/lecturer/clos'

export function CLOExamCountForm({ clo, courseId }: { clo: any, courseId: string }) {
  const [loading, setLoading] = useState(false)
  const [countKn, setCountKn] = useState(clo.exam_knowledge_count || 1)
  const [countCo, setCountCo] = useState(clo.exam_comprehension_count || 0)
  const [countAp, setCountAp] = useState(clo.exam_application_count || 0)
  const [examTime, setExamTime] = useState(clo.exam_time_minutes || 0)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    formData.append('cloId', clo.id)
    formData.append('courseId', courseId)
    formData.append('examKn', countKn.toString())
    formData.append('examCo', countCo.toString())
    formData.append('examAp', countAp.toString())
    formData.append('examTime', examTime.toString())
    await updateCLOExamCount(formData)
    setLoading(false)
  }

  return (
    <form onSubmit={handleUpdate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', marginLeft: '1rem', fontSize: '0.9rem' }}>
      <label style={{color: '#475569', fontWeight: 600}}>Bốc đề ngẫu nhiên:</label>
      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
        <span style={{color: '#64748b'}}>Nhận biết:</span>
        <input type="number" min="0" max="20" value={countKn} onChange={e => setCountKn(parseInt(e.target.value) || 0)} style={{ width: '45px', padding: '0.2rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', textAlign: 'center' }} />
      </div>
      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
        <span style={{color: '#64748b'}}>Hiểu:</span>
        <input type="number" min="0" max="20" value={countCo} onChange={e => setCountCo(parseInt(e.target.value) || 0)} style={{ width: '45px', padding: '0.2rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', textAlign: 'center' }} />
      </div>
      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
        <span style={{color: '#64748b'}}>Vận dụng:</span>
        <input type="number" min="0" max="20" value={countAp} onChange={e => setCountAp(parseInt(e.target.value) || 0)} style={{ width: '45px', padding: '0.2rem', borderRadius: '0.25rem', border: '1px solid #cbd5e1', textAlign: 'center' }} />
      </div>
      <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: '0.5rem'}}>
        <span style={{color: '#64748b', fontWeight: 600}}>⏱ Thời gian thi (phút):</span>
        <input type="number" min="0" max="180" value={examTime} onChange={e => setExamTime(parseInt(e.target.value) || 0)} placeholder="0=KX" style={{ width: '55px', padding: '0.2rem', borderRadius: '0.25rem', border: '2px solid #3b82f6', textAlign: 'center', fontWeight: 'bold' }} />
      </div>
      <button type="submit" disabled={loading} style={{ background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.25rem', padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
        {loading ? '...' : 'Lưu'}
      </button>
    </form>
  )
}
