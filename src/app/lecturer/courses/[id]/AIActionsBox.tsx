'use client'

import { useState } from 'react'
import { uploadAndParseMaterial, generateQuestionsByAI } from '@/actions/lecturer/ai-generation'

export function AIActionsBox({ courseId, materials, clos }: any) {
  const [upLoading, setUpLoading] = useState(false)
  const [upError, setUpError] = useState('')
  
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  
  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUpLoading(true)
    setUpError('')
    const formData = new FormData(e.currentTarget)
    try {
       const res = await uploadAndParseMaterial(formData)
       if (res?.error) setUpError(res.error)
       else (e.target as HTMLFormElement).reset()
    } finally {
       setUpLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAiLoading(true)
    setAiError('')
    const formData = new FormData(e.currentTarget)
    const matId = formData.get('materialId') as string
    const cloId = formData.get('cloId') as string
    
    const countKn = parseInt(formData.get('countKnowledge') as string) || 0
    const countCo = parseInt(formData.get('countComprehension') as string) || 0
    const countAp = parseInt(formData.get('countApplication') as string) || 0
    
    try {
      if (countKn + countCo + countAp === 0) {
        setAiError('Vui lòng nhập số lượng câu hỏi ít nhất cho 1 cấp độ.')
        return
      }
      const res = await generateQuestionsByAI(courseId, matId, cloId, countKn, countCo, countAp)
      if (res?.error) setAiError(res.error)
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div style={{display: 'flex', gap: '2rem', flexWrap: 'wrap'}}>
       <div style={{flex: 1, minWidth: '300px', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px dashed #cbd5e1'}}>
          <h3 style={{marginBottom: '1.25rem', fontSize: '1.1rem', color: '#1e293b'}}>📥 Upload Giáo Trình (DOCX/PDF)</h3>
          <form onSubmit={handleUpload} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <input type="hidden" name="courseId" value={courseId} />
             <input type="file" name="file" accept=".pdf,.docx" required style={{border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '0.3rem', background: 'white'}} />
             <button type="submit" disabled={upLoading} style={{background: '#10b981', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', opacity: upLoading ? 0.7 : 1}}>
               {upLoading ? 'Đang trích xuất văn bản (Vui lòng đợi)...' : 'Tải lên & Khởi tạo Vector Text'}
             </button>
             {upError && <p style={{color: '#ef4444', fontSize: '0.85rem', fontWeight: 500}}>{upError}</p>}
          </form>

          <div style={{marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem'}}>
            <h4 style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem'}}>Giáo trình khả dụng cho môn học này:</h4>
            <ul style={{fontSize: '0.95rem', color: '#334155', listStyleType: 'square', paddingLeft: '1.2rem', gap: '0.5rem', display: 'flex', flexDirection: 'column'}}>
              {materials?.map((m: any) => <li key={m.id}>{m.file_name}</li>)}
              {(!materials || materials.length === 0) && <li style={{color: '#94a3b8', listStyle: 'none', marginLeft: '-1.2rem'}}>Chưa có tài liệu nào</li>}
            </ul>
          </div>
       </div>

       <div style={{flex: 1, minWidth: '300px', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', border: '1px dashed #cbd5e1'}}>
          <h3 style={{marginBottom: '1.25rem', fontSize: '1.1rem', color: '#1e293b'}}>🤖 Yêu cầu AI sinh đề tự động</h3>
          <form onSubmit={handleGenerate} style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
             <select name="materialId" required style={{padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1'}}>
               <option value="">-- Mục 1: Chọn tài liệu tham chiếu --</option>
               {materials?.map((m: any) => <option value={m.id} key={m.id}>{m.file_name}</option>)}
             </select>
             
             <select name="cloId" required style={{padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1'}}>
               <option value="">-- Mục 2: Chọn chuẩn đầu ra (CLO) --</option>
               {clos?.map((c: any) => <option value={c.id} key={c.id}>[{c.code}] {c.content.substring(0,40)}...</option>)}
             </select>

             <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
               <div style={{flex: 1, minWidth: '80px'}}>
                 <label style={{fontSize: '0.8rem', color: '#64748b'}}>Nhận biết</label>
                 <input type="number" name="countKnowledge" min="0" max="20" placeholder="0" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
               </div>
               <div style={{flex: 1, minWidth: '80px'}}>
                 <label style={{fontSize: '0.8rem', color: '#64748b'}}>Thông hiểu</label>
                 <input type="number" name="countComprehension" min="0" max="20" placeholder="0" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
               </div>
               <div style={{flex: 1, minWidth: '80px'}}>
                 <label style={{fontSize: '0.8rem', color: '#64748b'}}>Vận dụng cao</label>
                 <input type="number" name="countApplication" min="0" max="20" placeholder="0" style={{ width: '100%', padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }} />
               </div>
             </div>

             <button type="submit" disabled={aiLoading || !materials || materials.length === 0 || !clos || clos.length === 0} style={{background: '#3b82f6', color: 'white', padding: '0.75rem', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', opacity: aiLoading ? 0.7 : 1}}>
               {aiLoading ? 'Trí tuệ Nhân tạo đang phân tích...' : 'Khởi tạo Bằng AI Ngay'}
             </button>
             {aiError && <p style={{color: '#ef4444', fontSize: '0.85rem', fontWeight: 500}}>{aiError}</p>}
          </form>
       </div>
    </div>
  )
}
