import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUser } from '@/lib/session'
import styles from './page.module.css'
import React from 'react'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

export default async function SchedulePage(props: {
  searchParams: Promise<{ date?: string }>
}) {
  const searchParams = await props.searchParams;
  const user = await getUser()
  if (!user) return <div>Lỗi máy chủ: Token Expired. Hãy tải lại trang.</div>

  const { data: profile } = await supabaseAdmin.from('profiles').select('student_class_id').eq('id', user.id).single()

  let enrollments: any[] = []

  // 1. Lấy các lớp được gán cho toàn bộ Lớp hành chính
  if (profile?.student_class_id) {
    const { data: plannedSubjects } = await supabaseAdmin
      .from('class_subjects')
      .select('*, courses(code, name), profiles(full_name)')
      .eq('student_class_id', profile.student_class_id)
    
    if (plannedSubjects) {
      const courseIds = plannedSubjects.map(ps => ps.course_id)
      const { data: actualClasses } = await supabaseAdmin
        .from('classes')
        .select('*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name)')
        .eq('student_class_id', profile.student_class_id)
        .in('course_id', courseIds)

      plannedSubjects.forEach(ps => {
        const match = actualClasses?.find(ac => ac.course_id === ps.course_id)
        enrollments.push({
          id: match?.id || ps.id,
          course_id: ps.course_id,
          courses: ps.courses,
          profiles: ps.profiles,
          schedule: match?.schedule || ps.schedule,
          is_active: !!match
        })
      })
    }
  }

  // 2. Lấy các lớp sinh viên được đăng ký riêng lẻ (junction table)
  const { data: indivClasses } = await supabaseAdmin
    .from('student_class')
    .select('class_id, classes(*, courses(code, name), profiles!classes_lecturer_id_fkey(full_name))')
    .eq('student_id', user.id)

  if (indivClasses) {
    indivClasses.forEach((ic: any) => {
      if (!ic.classes) return
      if (!enrollments.find(e => e.course_id === ic.classes.course_id)) {
        enrollments.push({ ...ic.classes, is_active: true })
      }
    })
  }

  // Tiện ích xử lý Ngày động (Dynamic Date Logic)
  const getParamDate = () => {
    if (searchParams?.date) {
      const parsed = new Date(searchParams.date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date(); // Mặc định là Tuần hiện tại
  }

  const baseDate = getParamDate();
  
  // Tính thứ 2 của tuần chứa baseDate
  const currentDay = baseDate.getDay();
  // Trong JS: 0 = CN, 1 = T2,... Nên nếu CN thì trừ 6 ngày, còn lại trừ currentDay - 1
  const diff = baseDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1); 
  const monday = new Date(baseDate.setDate(diff));

  const daysOfWeek: {value: number, label: string, dateStr: string, isoDate: string}[] = [];
  const weekStartStr = monday.toLocaleDateString('vi-VN');
  let weekEndStr = '';

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    
    // String định dạng ISO (YYYY-MM-DD) và Định dạng VN (DD/MM/YYYY)
    const isoString = d.toISOString().split('T')[0];
    const displayString = d.toLocaleDateString('vi-VN');
    const displayDateOnly = displayString.split('/')[0] + '/' + displayString.split('/')[1]
    
    if (i === 6) weekEndStr = displayString;

    daysOfWeek.push({
      value: i + 2 > 8 ? 8 : i + 2, // Ánh xạ Chủ Nhật thành 8
      label: i === 6 ? 'Chủ nhật' : `Thứ ${i + 2}`,
      dateStr: displayDateOnly,
      isoDate: isoString
    });
  }

  // URL Tuần trước / Tuần sau
  const prevDate = new Date(monday);
  prevDate.setDate(monday.getDate() - 7);
  const prevWeekStr = prevDate.toISOString().split('T')[0];

  const nextDate = new Date(monday);
  nextDate.setDate(monday.getDate() + 7);
  const nextWeekStr = nextDate.toISOString().split('T')[0];

  // Map cấu trúc lịch
  const scheduleByDay: Record<number, any[]> = { 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] }

  enrollments.forEach(cls => {
    let scheduleArr = []
    if (cls.schedule) {
       try { scheduleArr = typeof cls.schedule === 'string' ? JSON.parse(cls.schedule) : cls.schedule } catch(e) {}
    }

    if (Array.isArray(scheduleArr)) {
       scheduleArr.forEach((ev: any) => {
          let d = ev.dayOfWeek;
          let isValidForWeek = false;

          if (ev.date) {
             const dt = new Date(ev.date)
             d = dt.getDay()
             d = (d === 0) ? 8 : d + 1

             // Bộ lọc cực kỳ quan trọng: Lớp gán chỉ định đúng ngày nỳ mới được vào Lưới
             if (daysOfWeek.some(dayObj => dayObj.isoDate === ev.date)) {
               isValidForWeek = true;
             }
          } else {
             // Tính tương thích ngược (Old DB configs)
             if (d === 1) d = 8;
             isValidForWeek = true; // Hiện thủ công nguyên tất cả nếu xài db cũ
          }

          if (isValidForWeek && scheduleByDay[d]) {
             scheduleByDay[d].push({
                course: cls.courses?.name,
                code: cls.courses?.code,
                room: ev.room,
                startPeriod: ev.startPeriod,
                endPeriod: ev.endPeriod,
                lecturer: cls.profiles?.full_name,
                specificDate: ev.date
             })
          }
       })
    }
  })

  function formatPeriods(start: number, end: number) {
     const arr = []
     for (let i = start; i <= end; i++) arr.push(i)
     return arr.join(',')
  }

  return (
     <div className={styles.container}>
       <div className={styles.controlsRow}>
          <div className={styles.controlBox}>
             <div className={styles.controlLabel}>Năm học</div>
             <div className={styles.controlValue}>2025-2026</div>
          </div>
           <div className={styles.controlBox}>
             <div className={styles.controlLabel}>Học kỳ</div>
             <div className={styles.controlValue}>Học kỳ 2</div>
          </div>
           <div className={styles.controlBox}>
             <div className={styles.controlLabel}>Trạng thái</div>
             <div className={styles.controlValue} style={{color: '#10b981', fontWeight: 600}}>Xem theo Tuần Tùy biến</div>
          </div>
       </div>

       <div className={styles.weekHeader} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
         <Link href={`?date=${prevWeekStr}`} style={{ padding: '0.4rem 1rem', background: '#f1f5f9', borderRadius: '0.25rem', color: '#475569', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid #cbd5e1' }}>
           &laquo; Chọn Tuần Trước
         </Link>
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, textTransform: 'uppercase' }}>Tuần bắt đầu từ</span>
            <span style={{ color: '#0f172a' }}>{weekStartStr} <span style={{color: '#94a3b8', margin: '0 0.5rem'}}>-</span> {weekEndStr}</span>
         </div>
         <Link href={`?date=${nextWeekStr}`} style={{ padding: '0.4rem 1rem', background: '#e0f2fe', borderRadius: '0.25rem', color: '#0284c7', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', border: '1px solid #bae6fd' }}>
           Sang Tuần Sau &raquo;
         </Link>
       </div>

       <div className={styles.tableContainer}>
         {daysOfWeek.map(day => (
            <div key={day.value} className={`${styles.column} ${day.value === 8 ? styles.sunday : ''}`}>
               <div className={styles.colHeader}>
                  <div className={styles.colHeaderDay}>{day.label}</div>
                  <div className={styles.colHeaderDate} style={{fontSize: '0.95rem', fontWeight: 600, color: day.value === 8 ? '#2563eb' : '#64748b'}}>{day.dateStr}</div>
               </div>
               <div className={styles.colBody}>
                  {scheduleByDay[day.value].sort((a,b) => a.startPeriod - b.startPeriod).map((item, idx) => (
                     <div key={idx} className={styles.card}>
                        <div className={styles.cardTitle}>{item.course} <br/> ({item.code})</div>
                        <div className={styles.cardInfo}>
                           <span>🕒 {formatPeriods(item.startPeriod, item.endPeriod)}</span>
                           <span>📍 {item.room}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         ))}
       </div>
     </div>
  )
}
