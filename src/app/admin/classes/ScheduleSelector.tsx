'use client'
import { useState, useEffect } from 'react'

export function ScheduleSelector({ lecturerId, initialSchedule }: { lecturerId: string, initialSchedule?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [schedules, setSchedules] = useState<any[]>([])

  useEffect(() => {
    if (initialSchedule && typeof initialSchedule === 'string') {
       try {
          const parsed = JSON.parse(initialSchedule)
          if (Array.isArray(parsed)) setSchedules(parsed)
       } catch (e) {
          console.warn("Lịch cũ chưa chuẩn quy cách JSON, thiết lập rỗng.", e)
       }
    }
  }, [initialSchedule])

  const addSchedule = () => {
    // Lấy ngày hôm nay làm mặc định định dạng YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0]
    setSchedules([...schedules, { date: today, startPeriod: 1, endPeriod: 3, room: '' }])
  }

  const removeSchedule = (idx: number) => {
    setSchedules(schedules.filter((_, i) => i !== idx))
  }

  const updateSchedule = (idx: number, field: string, value: any) => {
    const newSchedules = [...schedules]
    newSchedules[idx] = { ...newSchedules[idx], [field]: value }
    setSchedules(newSchedules)
  }

  const getSummaryText = () => {
    if (schedules.length === 0) return "📅 Lịch học không gán tĩnh"
    return `✅ Đã gán ${schedules.length} buổi học`
  }


  const periods = [1,2,3,4,5,6,7,8,9,10]

  return (
    <>
      <input type="hidden" name={`schedule_${lecturerId}`} value={schedules.length > 0 ? JSON.stringify(schedules) : ''} />
      
      <button 
        type="button" 
        onClick={(e) => { e.preventDefault(); setIsOpen(true) }}
        style={{ 
           flex: 1, padding: '0.4rem 0.5rem', borderRadius: '0.25rem', 
           border: schedules.length > 0 ? '1px solid #10b981' : '1px dashed #cbd5e1', 
           background: schedules.length > 0 ? '#ecfdf5' : 'white',
           color: schedules.length > 0 ? '#15803d' : '#64748b',
           fontSize: '0.85rem', cursor: 'pointer', textAlign: 'center', transition: '0.2s',
           fontWeight: schedules.length > 0 ? 600 : 400
        }}
        title="Bấm để bung khung thời khóa biểu nâng cao"
      >
        {getSummaryText()}
      </button>

      {isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsOpen(false)}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', width: '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>📅 Trình Cấu Hình Lịch Học: Đa Tiết, Đa Ngày</h3>
              <button type="button" onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#ef4444' }}>&times;</button>
            </div>
            
            <p style={{fontSize: '0.9rem', color: '#475569', marginBottom: '1.5rem'}}>
               Bạn có thể chia khóa học này cho Giảng viên học rải rác ở nhiều khung giờ khác nhau trong tuần. Mọi thời khóa biểu sẽ tự kết nối về danh sách Lớp ở Portal Sinh Viên.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {schedules.map((sch, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', padding: '0.75rem', borderRadius: '0.35rem', border: '1px solid #e2e8f0' }}>
                   <div style={{ display: 'flex', flex: 1, gap: '0.5rem', flexWrap: 'wrap' }}>
                      <input 
                         type="date"
                         value={sch.date || ''} 
                         onChange={e => updateSchedule(idx, 'date', e.target.value)}
                         style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                      />
                      <select 
                         value={sch.startPeriod} 
                         onChange={e => updateSchedule(idx, 'startPeriod', Number(e.target.value))}
                         style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                      >
                         {periods.map(p => <option key={p} value={p}>Từ tiết {p}</option>)}
                      </select>
                      <select 
                         value={sch.endPeriod} 
                         onChange={e => updateSchedule(idx, 'endPeriod', Number(e.target.value))}
                         style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.85rem' }}
                      >
                         {periods.map(p => <option key={p} value={p}>Đến tiết {p}</option>)}
                      </select>
                      <input 
                         type="text" 
                         value={sch.room} 
                         onChange={e => updateSchedule(idx, 'room', e.target.value)}
                         placeholder="Phòng (C5.302)"
                         style={{ padding: '0.35rem', border: '1px solid #cbd5e1', borderRadius: '0.25rem', fontSize: '0.85rem', flex: 1, minWidth: '120px' }}
                      />
                   </div>
                   <button 
                     type="button" 
                     title="Xoá lịch này"
                     onClick={() => removeSchedule(idx)}
                     style={{ padding: '0.35rem 0.5rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}
                   >
                     X
                   </button>
                </div>
              ))}
              {schedules.length === 0 && <div style={{ textAlign: 'center', padding: '1rem', color: '#94a3b8', fontStyle: 'italic', background: '#f8fafc', borderRadius: '0.35rem', border: '1px dashed #cbd5e1' }}>Giờ học sẽ do Giảng viên tự chủ xếp với lớp. (Hoặc bấm "Thêm Lịch" bên dưới để ghim cứng lên TKB hệ thống).</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
              <button 
                type="button" 
                onClick={addSchedule}
                style={{ padding: '0.75rem', background: '#f1f5f9', color: '#3b82f6', border: '1px dashed #3b82f6', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.25rem' }}
              >
                <span>➕</span> THÊM LỊCH SỐ {schedules.length + 1}
              </button>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ padding: '0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}
              >
                💾 LƯU BẢN NHÁP CỤC BỘ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
