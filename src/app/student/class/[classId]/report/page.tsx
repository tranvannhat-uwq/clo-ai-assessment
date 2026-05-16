'use client'

import { useEffect, useState } from 'react'
import { generateAIReport } from '@/actions/student/report'
import Link from 'next/link'
import { use } from 'react'

export default function AIReportPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [loadingRegen, setLoadingRegen] = useState(false)

  const fetchReport = async (force: boolean = false) => {
    if (force) setLoadingRegen(true)
    else setLoading(true)

    try {
       const res = await generateAIReport(classId, force)
       if (res.error) setError(res.error)
       else setData(res.data)
    } catch (err: any) {
       setError(err.message || 'Lỗi không xác định khi kết nối API')
    } finally {
       setLoading(false)
       setLoadingRegen(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [classId])

  if (loading) {
     return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
           <div style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>🤖</div>
           <h2 style={{ color: '#3b82f6' }}>Trợ lý AI đang thu thập và phân tích dữ liệu môn học...</h2>
           <p style={{ color: '#64748b' }}>Quá trình này có thể tốn từ 10 - 20 giây do đọc lại hội thoại vấn đáp.</p>
        </div>
     )
  }

  if (error) {
     return (
        <div style={{ padding: '2rem', background: '#fef2f2', color: '#ef4444', borderRadius: '1rem', border: '1px solid #fecaca' }}>
           <h3>❌ Lỗi kết nối AI</h3>
           <p>{error}</p>
           <Link href={`/student/class/${classId}`} style={{ color: '#3b82f6', marginTop: '1rem', display: 'inline-block' }}>🔙 Quay lại lớp học</Link>
        </div>
     )
  }

  if (!data) return <div>Không tìm thấy dữ liệu báo cáo</div>

  const scores = data.score_data || {}
  const cloKeys = Object.keys(scores)

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#f8fafc', padding: '2rem', borderRadius: '1.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
         <div>
           <Link href={`/student/class/${classId}`} style={{ color: '#64748b', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
             🔙 Về Bảng Điều Khiển
           </Link>
           <h1 style={{ color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             📊 Báo Cáo Đánh Giá Năng Lực AI
           </h1>
           <p style={{ color: '#64748b', margin: '0.5rem 0 0 0' }}>Tạo lúc: {new Date(data.generated_at).toLocaleString('vi-VN')}</p>
         </div>
         <button 
           onClick={() => fetchReport(true)} 
           disabled={loadingRegen}
           style={{ background: '#10b981', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', fontWeight: 700, cursor: 'pointer', opacity: loadingRegen ? 0.7 : 1, transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)' }}
         >
           {loadingRegen ? '🔄 Đang chạy lại AI...' : '♻️ Viết Lại Phân Tích Mới'}
         </button>
      </div>

      {/* SCOREBOARD */}
      <div style={{ marginBottom: '3rem' }}>
         <h2 style={{ color: '#1e3a8a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🎯 Bảng Đánh Giá Điểm Số Theo CLO
         </h2>
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {cloKeys.length === 0 ? (
               <div style={{ color: '#64748b', fontStyle: 'italic' }}>Sinh viên chưa phát sinh dữ liệu bài làm trắc nghiệm nào để tính điểm chuẩn CLO.</div>
            ) : (
               cloKeys.map((clo, i) => {
                  const s = scores[clo]
                  const percent = Math.round((s.correct / s.total) * 100) || 0
                  
                  return (
                     <div key={i} style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>📝 {clo}</div>
                        <div style={{ color: '#64748b', marginBottom: '1rem' }}>Đúng: <strong style={{ color: '#10b981' }}>{s.correct}</strong> / Tổng: <strong>{s.total}</strong></div>
                        
                        {/* Progress bar */}
                        <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                           <div style={{ width: `${percent}%`, height: '100%', background: percent >= 80 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444', transition: 'width 1s' }} />
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginTop: '0.5rem' }}>
                           Điểm Tỷ lệ: {percent}%
                        </div>
                     </div>
                  )
               })
            )}
         </div>
      </div>

      {/* AI ADVICE */}
      <div>
         <h2 style={{ color: '#1e3a8a', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🤖 Cố Vấn Trí Tuệ Nhân Tạo (Phân tích Lỗi & Bài Tập Rèn Luyện)
         </h2>
         <div style={{ background: 'white', border: '2px dashed #93c5fd', padding: '2.5rem', borderRadius: '1rem', lineHeight: 1.8, fontSize: '1.05rem', color: '#1e293b' }}>
            <div 
               style={{ whiteSpace: 'pre-wrap', fontFamily: 'system-ui, -apple-system, sans-serif' }}
               dangerouslySetInnerHTML={{
                  // Quy đổi nhẹ markdown text sang thẻ HTML thủ công nếu cần in đậm
                  __html: data.ai_markdown
                     .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                     .replace(/\*(.*?)\*/g, '<em>$1</em>')
                     .replace(/### (.*?)\n/g, '<h3 style="color:#2563eb; margin-top:1.5rem; border-bottom:1px solid #bfdbfe; padding-bottom:0.5rem">$1</h3>\n')
                     .replace(/\n\n/g, '<br/><br/>')
               }}
            />
         </div>
      </div>

    </div>
  )
}
