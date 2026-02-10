'use client';

import React, { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

type Application = {
  id: string;
  name: string;
  contact: string;
  birth_prefix: string;
  address: string;
  certificates: string[];
  cash_receipt: string;
  photo_url: string;
  created_at: string;
  order_id?: string;
  amount?: number;
  payment_status?: string;
  paid_at?: string;
  trade_id?: string;
  mul_no?: string;
  addressMain?: string;
  addressDetail?: string;
  postalCode?: string;
};

type DetailModalProps = {
  application: Application;
  onClose: () => void;
  onRefresh: () => void;
};

export default function DetailModal({ application, onClose, onRefresh }: DetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Application>(application);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('certificate_applications')
        .update(formData)
        .eq('id', application.id);

      if (!error) {
        alert('수정되었습니다.');
        setIsEditing(false);
        onRefresh();
        onClose();
      } else {
        alert('수정 중 오류가 발생했습니다.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('certificate_applications')
        .delete()
        .eq('id', application.id);

      if (!error) {
        alert('삭제되었습니다.');
        onRefresh();
        onClose();
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'flex-end',
      zIndex: 1000,
      animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideModal {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: '#ffffff',
        borderRadius: '16px 16px 0 0',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'slideModal 0.3s ease-out',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#191f28' }}>
            신청 상세정보
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {/* 컨텐츠 */}
        <div style={{ padding: '24px' }}>
          {!isEditing ? (
            // 조회 모드
            <>
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                  기본 정보
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>성명</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>{application.name}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>연락처</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>{application.contact}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>생년월일</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>{application.birth_prefix}</p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>주소</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {application.addressMain || application.address}
                      {application.addressDetail && ` ${application.addressDetail}`}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                  자격증
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {application.certificates.map((cert) => (
                    <span
                      key={cert}
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        backgroundColor: '#f0f1f5',
                        color: '#4e5968',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 500
                      }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '12px', textTransform: 'uppercase' }}>
                  결제 정보
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제 상태</p>
                    <div style={{
                      display: 'inline-block',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      backgroundColor: application.payment_status === 'paid' ? '#d1fae5' : application.payment_status === 'failed' ? '#fee2e2' : '#fef3c7',
                      color: application.payment_status === 'paid' ? '#065f46' : application.payment_status === 'failed' ? '#991b1b' : '#92400e'
                    }}>
                      {application.payment_status === 'paid'
                        ? '결제 완료'
                        : application.payment_status === 'failed'
                        ? '결제 실패'
                        : '대기 중'}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제 금액</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {application.amount ? `${application.amount.toLocaleString()}원` : '-'}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제일</p>
                    <p style={{ margin: 0, fontSize: '16px', fontWeight: 500, color: '#191f28' }}>
                      {application.paid_at
                        ? new Date(application.paid_at).toLocaleDateString('ko-KR')
                        : '-'}
                    </p>
                  </div>
                  {application.mul_no && (
                    <div>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#999' }}>결제번호</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#191f28', fontFamily: 'monospace' }}>
                        {application.mul_no}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 버튼 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '30px' }}>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setFormData(application);
                  }}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e5e8eb',
                    backgroundColor: '#ffffff',
                    color: '#3182f6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f8ff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  수정
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc2626';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ef4444';
                  }}
                >
                  삭제
                </button>
              </div>
            </>
          ) : (
            // 수정 모드
            <>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  성명
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  연락처
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  생년월일
                </label>
                <input
                  type="text"
                  value={formData.birth_prefix}
                  onChange={(e) => setFormData({ ...formData, birth_prefix: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                  주소
                </label>
                <input
                  type="text"
                  value={formData.addressMain || ''}
                  onChange={(e) => setFormData({ ...formData, addressMain: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* 버튼 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '30px' }}>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.6 : 1,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    if (!saving) e.currentTarget.style.backgroundColor = '#059669';
                  }}
                  onMouseOut={(e) => {
                    if (!saving) e.currentTarget.style.backgroundColor = '#10b981';
                  }}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(application);
                  }}
                  style={{
                    padding: '12px 16px',
                    border: '1px solid #e5e8eb',
                    backgroundColor: '#ffffff',
                    color: '#4e5968',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  취소
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
