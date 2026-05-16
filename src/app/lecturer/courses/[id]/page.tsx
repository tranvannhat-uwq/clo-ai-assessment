import { supabaseAdmin } from '@/lib/supabase-admin'
import { createCLO, deleteCLO } from '@/actions/lecturer/clos'
import { EditableCLORow } from './EditableCLORow'
import { AIActionsBox } from './AIActionsBox'
import { EditableQuestion } from './EditableQuestion'
import { CLOExamCountForm } from './CLOExamCountForm'
import { AddQuestionForm } from './AddQuestionForm'
import styles from '../../classes/[id]/page.module.css'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export default async function CourseDetailPage({ params }: Props) {
  const { id: courseId } = await params
  
  const { data: course } = await supabaseAdmin.from('courses').select('*').eq('id', courseId).single()
  const { data: clos } = await supabaseAdmin.from('clos').select('*').eq('course_id', courseId).order('priority')
  const { data: materials } = await supabaseAdmin.from('materials').select('id, file_name, uploaded_at').eq('course_id', courseId)
  
  const cloIds = clos?.map(c => c.id) || []
  let questions: any[] = []
  
  if (cloIds.length > 0) {
    const { data: qData } = await supabaseAdmin
      .from('questions')
      .select('*, clos!inner(code), rubrics(criteria)')
      .in('clo_id', cloIds)
      .order('created_at', { ascending: false })
    questions = qData || []
  }

  return (
    <div className={styles.container}>
      <Link href="/lecturer/courses" style={{color: '#64748b', textDecoration: 'none', marginBottom: '1rem', display: 'inline-block'}}>&larr; Quay lại danh sách môn học</Link>
      <div className={styles.header}>
        <h1 className={styles.title}>Quản lý Môn học: {course?.name}</h1>
        <div className={styles.subtitle}>
          Mã môn: {course?.code} &nbsp;|&nbsp; 
          <span style={{ color: '#0ea5e9', fontWeight: 600 }}> Cấu hình dùng chung cho tất cả các lớp của môn học này</span>
        </div>
      </div>
      
      {/* 1. CLO */}
      <div className={styles.section}>
        <h2>1. Khai báo Chuẩn đầu ra (CLOs)</h2>
        <div className={styles.card}>
          <form action={async (formData) => { 'use server'; await createCLO(formData); }} className={styles.formRow}>
            <input type="hidden" name="courseId" value={courseId} />
            <input type="text" name="code" placeholder="Mã (CLO 1)" required className={styles.inputSmall} />
            <input type="text" name="content" placeholder="Nội dung chuyên môn cơ bản của chuẩn..." required className={styles.inputLarge} />
            <input type="number" name="priority" placeholder="Mức độ ưu tiên" defaultValue="1" className={styles.inputSmall} />
            <button type="submit" className={styles.btnPrimary}>Thêm mới</button>
          </form>

          <div style={{marginTop: '1.5rem'}}>
            <table className={styles.table}>
               <thead>
                 <tr><th>Mã CLO</th><th>Nội dung tham chiếu</th><th>Ưu tiên</th><th></th></tr>
               </thead>
               <tbody>
                 {clos?.map(c => (
                    <EditableCLORow key={c.id} clo={c} courseId={courseId} />
                  ))}
               </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. Tài liệu & Tạo đề */}
      <div className={styles.section} style={{marginTop: '3rem'}}>
        <h2>2. Tài liệu Giảng dạy & Kích hoạt AI</h2>
        <div className={styles.card}>
           <AIActionsBox courseId={courseId} materials={materials || []} clos={clos || []} />
        </div>
      </div>

      {/* 3. Ngân hàng câu hỏi */}
      <div className={styles.section} style={{marginTop: '3rem'}}>
        <h2>3. Ngân hàng Câu hỏi và Tiêu chí Đánh giá (Rubrics)</h2>
        {clos?.map(clo => {
           const cloQuestions = questions.filter(q => q.clo_id === clo.id)
           if (cloQuestions.length === 0) return null
           
           return (
             <div key={clo.id} className={styles.card} style={{marginBottom: '1.5rem'}}>
               <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid #bfdbfe', paddingBottom: '0.5rem'}}>
                 <h3 style={{color: '#1e40af', fontSize: '1.1rem', margin: 0}}>
                   CLO: [{clo.code}] - {clo.content}
                 </h3>
                 <CLOExamCountForm clo={clo} courseId={courseId} />
               </div>
               
               <AddQuestionForm cloId={clo.id} courseId={courseId} />
               
               {cloQuestions.map(q => (
                 <EditableQuestion key={q.id} q={q} courseId={courseId} />
               ))}
             </div>
           )
        })}
        {questions.length === 0 && (
          <div className={styles.card}>
            <p className={styles.emptyText}>Chưa có câu hỏi nào được sinh ra bằng AI cho môn học này.</p>
          </div>
        )}
      </div>
    </div>
  )
}
