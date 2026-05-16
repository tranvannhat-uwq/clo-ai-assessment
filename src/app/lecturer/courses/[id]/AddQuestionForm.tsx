'use client'

import { useState } from 'react'

export function AddQuestionForm({ cloId, courseId }: { cloId: string, courseId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const [bloom, setBloom] = useState('Nhận biết')
  
  const [opts, setOpts] = useState(['', '', '', '']) 
  const [correct, setCorrect] = useState('0') 

  const handleOptChange = (idx: number, val: string) => {
    const newOpts = [...opts]
    newOpts[idx] = val
    setOpts(newOpts)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('cloId', cloId)
    formData.append('courseId', courseId)
    formData.append('type', 'BOTH')
    formData.append('bloom_level', bloom)
    formData.append('options', JSON.stringify(opts.filter(v => v.trim() !== '')))
    
    const correctAnswerStr = opts[parseInt(correct)] || ''
    formData.set('correct_answer', correctAnswerStr)

    // Call server action Create Question
    const { createQuestionManual } = await import('@/actions/lecturer/questions')
    await createQuestionManual(formData)
    
    setLoading(false)
    setOpen(false)
  }

  if (!open) return <button onClick={() => setOpen(true)} style={{padding: '0.5rem 1rem', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, marginBottom: '1rem'}}>+ Tạo câu hỏi thủ công</button>

  return (
    <form onSubmit={handleSubmit} style={{marginBottom: '1rem', padding: '1rem', background: '#f8fafc', border: '1px dashed #94a3b8', borderRadius: '0.5rem'}}>
      <h4 style={{marginBottom: '1rem', color: '#1e293b'}}>Thêm câu hỏi mới</h4>
      
      <div style={{marginBottom: '1rem'}}>
        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem'}}>Mức độ nhận thức (Bloom):</label>
        <select value={bloom} onChange={e => setBloom(e.target.value)} style={{padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', width: '100%'}}>
           <option value="Nhận biết">Nhận biết</option>
           <option value="Thông hiểu">Thông hiểu</option>
           <option value="Vận dụng cao">Vận dụng cao</option>
        </select>
      </div>

      <div style={{marginBottom: '1rem'}}>
        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem'}}>Nội dung Đề:</label>
        <textarea name="content" required rows={3} style={{width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontFamily: 'inherit'}} />
      </div>

      <div style={{marginBottom: '1rem'}}>
        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem'}}>Rubric / Tiêu chí chấm (dành cho tự luận/vấn đáp):</label>
        <textarea name="criteria" required rows={3} style={{width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #cbd5e1', fontFamily: 'inherit'}} />
      </div>

      <div style={{marginBottom: '1rem'}}>
        <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem'}}>Các đáp án lựa chọn (A,B,C,D):</label>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          {opts.map((opt, i) => (
            <div key={i} style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
              <input type="radio" name="correctIndex" value={i} checked={correct === i.toString()} onChange={e => setCorrect(e.target.value)} />
              <input type="text" placeholder={`Đáp án ${i+1}`} value={opt} onChange={e => handleOptChange(i, e.target.value)} required style={{flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '0.3rem'}} />
            </div>
          ))}
        </div>
        <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem'}}>* Chọn nút tròn biểu thị cho đáp án ĐÚNG.</p>
      </div>

      <div style={{display: 'flex', gap: '0.5rem'}}>
        <button type="submit" disabled={loading} style={{padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', borderRadius: '0.3rem', border: 'none', fontWeight: 500, cursor: 'pointer'}}>{loading ? 'Đang tạo...' : 'Tạo câu hỏi'}</button>
        <button type="button" onClick={() => setOpen(false)} disabled={loading} style={{padding: '0.5rem 1rem', background: '#e2e8f0', color: '#334155', borderRadius: '0.3rem', border: 'none', cursor: 'pointer'}}>Hủy</button>
      </div>
    </form>
  )
}
