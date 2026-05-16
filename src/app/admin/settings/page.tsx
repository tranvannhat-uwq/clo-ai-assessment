import { supabaseAdmin } from '@/lib/supabase-admin'
import { saveSettings } from '@/actions/admin/settings'
import styles from './page.module.css'

export default async function SettingsPage() {
  const { data: config } = await supabaseAdmin.from('sys_settings').select('*').single()

  async function saveSettingsAction(formData: FormData) {
    'use server'
    const res = await saveSettings(formData)
    if (res && 'error' in res) throw new Error(res.error)
  }

  return (
    <div>
      <h1 className={styles.title}>Cấu hình Máy học (AI System)</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Thiết lập thông số cho AI Agent phân tích và tự động làm giám khảo</p>
      
      <div className={styles.formCard}>
        <form action={saveSettingsAction} className={styles.form}>
          <div className={styles.inputGroup}>
            <label>Nền tảng Trí tuệ nhân tạo (LLM Provider)</label>
            <select name="provider" defaultValue={config?.llm_provider || 'GEMINI'}>
              <option value="GEMINI">Google Gemini API (Miễn phí)</option>
              <option value="OPENAI">OpenAI API (ChatGPT)</option>
            </select>
          </div>
          
          <div className={styles.inputGroup}>
            <label>API Key tuỳ chỉnh (Project Key)</label>
            <input 
              type="password" 
              name="apiKey" 
              placeholder="Có thể bỏ trống vì đã sử dụng file .env.local"
              defaultValue={config?.api_key || ''}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Core System Prompt (Vai trò Trợ lý định hướng hành vi)</label>
            <textarea 
              name="systemPrompt" 
              rows={8}
              placeholder="Ví dụ: Bạn là một giảng viên nghiêm khắc nhưng tận tâm. Bạn cần chấm thi học viên. Nếu họ trả lời đúng thì cho qua, nếu sai thì mớm ý chứ cấm tuyệt đối trả lời hộ."
              defaultValue={config?.system_prompt || ''}
            />
          </div>
          
          <button type="submit" className={styles.submitBtn}>Cập nhật hệ thống</button>
        </form>
      </div>
    </div>
  )
}
