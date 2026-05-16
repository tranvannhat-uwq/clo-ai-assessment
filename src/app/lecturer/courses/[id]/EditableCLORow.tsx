'use client'

import { useState } from 'react'
import { updateCLO, deleteCLO } from '@/actions/lecturer/clos'
import styles from '../../classes/[id]/page.module.css'

export function EditableCLORow({ clo, courseId }: { clo: any; courseId: string }) {
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await updateCLO(formData)
      if (res?.error) setError(res.error)
      else setEditing(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={4} style={{ padding: '0.75rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input type="hidden" name="cloId" value={clo.id} />
            <input type="hidden" name="courseId" value={courseId} />
            <input
              type="text"
              name="code"
              defaultValue={clo.code}
              required
              style={{ width: '90px', padding: '0.4rem 0.6rem', border: '1.5px solid #93c5fd', borderRadius: '0.3rem', fontSize: '0.9rem', fontWeight: 600 }}
            />
            <input
              type="text"
              name="content"
              defaultValue={clo.content}
              required
              style={{ flex: 1, minWidth: '200px', padding: '0.4rem 0.6rem', border: '1.5px solid #93c5fd', borderRadius: '0.3rem', fontSize: '0.9rem' }}
            />
            <input
              type="number"
              name="priority"
              defaultValue={clo.priority}
              style={{ width: '60px', padding: '0.4rem 0.6rem', border: '1.5px solid #93c5fd', borderRadius: '0.3rem', fontSize: '0.9rem', textAlign: 'center' }}
            />
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ padding: '0.4rem 0.75rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.3rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', opacity: loading ? 0.6 : 1 }}
              >
                {loading ? '...' : 'Lưu'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setError('') }}
                style={{ padding: '0.4rem 0.75rem', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '0.3rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Hủy
              </button>
            </div>
            {error && <span style={{ color: '#ef4444', fontSize: '0.8rem', width: '100%' }}>{error}</span>}
          </form>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td><span className={styles.badgeCode}>{clo.code}</span></td>
      <td>{clo.content}</td>
      <td>{clo.priority}</td>
      <td style={{ textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setEditing(true)}
            style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Sửa
          </button>
          <button
            onClick={async () => {
              if (confirm('Xóa CLO này? Tất cả câu hỏi liên quan cũng sẽ bị xóa.')) {
                await deleteCLO(clo.id)
              }
            }}
            style={{ padding: '0.3rem 0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.25rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Xóa
          </button>
        </div>
      </td>
    </tr>
  )
}
