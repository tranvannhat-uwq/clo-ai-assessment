'use client'

import { useState } from 'react'
import { UserForm } from './UserForm'
import { ImportUsersForm } from './ImportUsersForm'
import styles from './page.module.css'

export function UserModals({ studentClasses, departments }: { studentClasses: any[], departments: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'EXCEL'>('MANUAL')

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: '#3b82f6', color: 'white', padding: '0.6rem 1.25rem', 
          borderRadius: '0.5rem', border: 'none', fontWeight: 600, 
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)'
        }}
      >
        <span style={{fontSize: '1.2rem'}}>+</span> Thêm tài khoản mới
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', 
          zIndex: 9999, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '1rem', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem' }}>Thêm tài khoản mới</h2>
              <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}>
                &times;
              </button>
            </div>
            
            <div style={{ padding: '0 1.5rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <button 
                  onClick={() => setActiveTab('MANUAL')}
                  style={{ 
                    padding: '0.75rem 1.5rem', background: 'none', border: 'none', 
                    borderBottom: activeTab === 'MANUAL' ? '2px solid #3b82f6' : '2px solid transparent',
                    color: activeTab === 'MANUAL' ? '#3b82f6' : '#64748b', fontWeight: activeTab === 'MANUAL' ? 600 : 500,
                    cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  Nhập thủ công
                </button>
                <button 
                  onClick={() => setActiveTab('EXCEL')}
                  style={{ 
                    padding: '0.75rem 1.5rem', background: 'none', border: 'none', 
                    borderBottom: activeTab === 'EXCEL' ? '2px solid #3b82f6' : '2px solid transparent',
                    color: activeTab === 'EXCEL' ? '#3b82f6' : '#64748b', fontWeight: activeTab === 'EXCEL' ? 600 : 500,
                    cursor: 'pointer', transition: '0.2s'
                  }}
                >
                  Nhập từ file Excel
                </button>
              </div>
            </div>

            <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
              {activeTab === 'MANUAL' ? (
                <UserForm studentClasses={studentClasses} departments={departments} />
              ) : (
                <ImportUsersForm studentClasses={studentClasses} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
