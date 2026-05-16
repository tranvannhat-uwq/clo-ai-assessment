'use client'

import { useState } from 'react'
import { deleteQuestion, updateQuestion, toggleQuestionActive } from '@/actions/lecturer/questions'

export function EditableQuestion({ q, courseId }: { q: any, courseId: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState(q.content || '')
  const [criteria, setCriteria] = useState(q.rubrics?.[0]?.criteria || '')
  
  const [bloom, setBloom] = useState(q.bloom_level || 'Nhận biết')
  
  const [opts, setOpts] = useState<string[]>(q.options || ['', '', '', ''])
  const [correct, setCorrect] = useState<string>(q.correct_answer || '')

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) return
    setLoading(true)
    await deleteQuestion(q.id, courseId)
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    formData.append('questionId', q.id)
    formData.append('courseId', courseId)
    formData.append('content', content)
    formData.append('type', 'BOTH')
    formData.append('bloom_level', bloom)
    formData.append('options', JSON.stringify(opts.filter(v => v.trim() !== '')))
    formData.append('correct_answer', correct)
    
    if (q.rubrics?.[0]?.id) {
      formData.append('rubricId', q.rubrics[0].id)
      formData.append('criteria', criteria)
    }
    await updateQuestion(formData)
    setIsEditing(false)
    setLoading(false)
  }

  if (isEditing) {
    return (
      <form onSubmit={handleUpdate} style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #3b82f6', borderRadius: '0.75rem', background: '#eff6ff'}}>
        <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
          <div style={{flex: 1}}>
            <label style={{fontWeight: 600, fontSize: '0.9rem', color: '#1e40af'}}>Mức độ nhận thức (Bloom):</label>
            <select value={bloom} onChange={e => setBloom(e.target.value)} style={{width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', marginTop: '0.5rem', fontFamily: 'inherit'}}>
              <option value="Nhận biết">Nhận biết</option>
              <option value="Thông hiểu">Thông hiểu</option>
              <option value="Vận dụng cao">Vận dụng cao</option>
            </select>
          </div>
        </div>
        <div style={{marginBottom: '1rem'}}>
          <label style={{fontWeight: 600, fontSize: '0.9rem', color: '#1e40af'}}>Nội dung câu hỏi ({q.clos.code}):</label>
          <textarea 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            rows={3} 
            required
            style={{width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', marginTop: '0.5rem', fontFamily: 'inherit'}} 
          />
        </div>
        <div style={{marginBottom: '1rem'}}>
          <label style={{fontWeight: 600, fontSize: '0.9rem', color: '#1e40af'}}>Rubric / Tiêu chí chấm:</label>
          <textarea 
            value={criteria} 
            onChange={e => setCriteria(e.target.value)} 
            rows={4} 
            required
            style={{width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe', marginTop: '0.5rem', fontFamily: 'inherit'}} 
          />
        </div>
        <div style={{marginBottom: '1rem', background: 'white', padding: '1rem', borderRadius: '0.5rem'}}>
          <label style={{fontWeight: 600, fontSize: '0.9rem', color: '#1e40af'}}>Các lựa chọn Trắc nghiệm (A, B, C, D):</label>
          <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem'}}>
            {opts.map((opt, i) => (
              <div key={i} style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                <input type="radio" checked={correct === opt && opt !== ''} onChange={() => setCorrect(opt)} />
                <input type="text" placeholder={`Đáp án ${i+1}`} value={opt} onChange={e => {
                   const newOpts = [...opts]; newOpts[i] = e.target.value; setOpts(newOpts)
                }} style={{flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.3rem'}} />
              </div>
            ))}
          </div>
          <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem'}}>* Chọn nút tròn để định vị đáp án Đúng nhất.</p>
        </div>
        <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'flex-end'}}>
          <button type="button" onClick={() => setIsEditing(false)} disabled={loading} style={{padding: '0.5rem 1rem', background: '#cbd5e1', borderRadius: '0.5rem', border: 'none', cursor: 'pointer'}}>Hủy</button>
          <button type="submit" disabled={loading} style={{padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 600}}>{loading ? 'Đang lưu...' : 'Lưu cập nhật'}</button>
        </div>
      </form>
    )
  }

  return (
    <div style={{marginBottom: '1.5rem', padding: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem', background: q.is_active ? '#f8fafc' : '#f1f5f9', opacity: q.is_active ? 1 : 0.6, position: 'relative'}}>
      <div style={{position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
        <label style={{display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.8rem', cursor: 'pointer', background: q.is_active ? '#dcfce7' : '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1'}}>
          <input type="checkbox" checked={q.is_active} onChange={() => toggleQuestionActive(q.id, q.is_active, courseId)} disabled={loading} style={{cursor: 'pointer'}} /> {q.is_active ? 'Sử dụng thi' : 'Đang ẩn'}
        </label>
        <button onClick={() => setIsEditing(true)} disabled={loading} style={{padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.3rem', cursor: 'pointer'}}>Sửa</button>
        <button onClick={handleDelete} disabled={loading} style={{padding: '0.35rem 0.75rem', fontSize: '0.8rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.3rem', cursor: 'pointer'}}>Xóa</button>
      </div>
      
      <p style={{fontWeight: 600, marginBottom: '0.75rem', color: '#1e293b', paddingRight: '12rem', lineHeight: '1.6'}}>
        <span style={{background: '#38bdf8', color: 'white', marginRight: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', fontSize: '0.8rem'}}>{q.clos.code}</span> 
        <span style={{background: '#e2e8f0', color: '#475569', marginRight: '0.5rem', padding: '0.2rem 0.5rem', borderRadius: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase'}}>{q.bloom_level || 'Nhận biết'}</span> 
        {q.content}
      </p>
      
      <div style={{display: 'flex', gap: '1rem'}}>
        <div style={{flex: 1, fontSize: '0.9rem', color: '#475569', background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed #cbd5e1'}}>
          <strong>Rubric Vấn đáp: </strong> <br/>
          <div style={{whiteSpace: 'pre-wrap', marginTop: '0.5rem'}}>{q.rubrics?.[0]?.criteria}</div>
        </div>
        <div style={{flex: 1, fontSize: '0.9rem', color: '#475569', background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed #cbd5e1'}}>
          <strong>Trắc nghiệm ({(q.options || []).length} Options): </strong>
          <ul style={{marginTop: '0.5rem', paddingLeft: '1.5rem'}}>
            {(q.options || []).map((opt: string, i: number) => (
               <li key={i} style={{marginBottom: '0.25rem', color: opt === q.correct_answer ? '#15803d' : 'inherit', fontWeight: opt === q.correct_answer ? 600 : 400}}>
                 {opt} {opt === q.correct_answer && ' (Đáp án đúng)'}
               </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
