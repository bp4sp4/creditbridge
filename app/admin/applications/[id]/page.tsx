'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import styles from './detail.module.css';

type Application = {
  id: string;
  name: string;
  contact: string;
  birth_prefix: string;
  address: string;
  addressMain: string;
  addressDetail: string;
  postalCode: string;
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
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Application | null>(null);
  const [saving, setSaving] = useState(false);

  // 데이터 조회
  useEffect(() => {
    const fetchApplication = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('certificate_applications')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setApplication(data as Application);
        setFormData(data as Application);
      }
      setLoading(false);
    };

    fetchApplication();
  }, [id]);

  // 수정 처리
  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('certificate_applications')
        .update(formData)
        .eq('id', id);

      if (!error) {
        setApplication(formData);
        setIsEditing(false);
        alert('수정되었습니다.');
      } else {
        alert('수정 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('certificate_applications')
        .delete()
        .eq('id', id);

      if (!error) {
        alert('삭제되었습니다.');
        router.push('/admin');
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div className={styles.loading}>로딩 중...</div>;
  if (!application) return <div className={styles.error}>데이터를 찾을 수 없습니다.</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 뒤로가기
        </button>
        <h1>신청 상세 정보</h1>
        <div></div>
      </div>

      <div className={styles.card}>
        {!isEditing ? (
          // 조회 모드
          <>
            <div className={styles.section}>
              <h2>기본 정보</h2>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>성명</label>
                  <p>{application.name}</p>
                </div>
                <div className={styles.field}>
                  <label>연락처</label>
                  <p>{application.contact}</p>
                </div>
                <div className={styles.field}>
                  <label>생년월일</label>
                  <p>{application.birth_prefix}</p>
                </div>
                <div className={styles.field}>
                  <label>우편번호</label>
                  <p>{application.postalCode || '-'}</p>
                </div>
              </div>

              <div className={styles.field} style={{ marginTop: '16px' }}>
                <label>기본 주소</label>
                <p>{application.addressMain || application.address}</p>
              </div>
              <div className={styles.field}>
                <label>상세 주소</label>
                <p>{application.addressDetail || '-'}</p>
              </div>

              <div className={styles.field}>
                <label>통신료 영수증</label>
                <p>{application.cash_receipt || '-'}</p>
              </div>
            </div>

            <div className={styles.section}>
              <h2>자격증 정보</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {application.certificates.map((cert, idx) => (
                  <span key={idx} className={styles.badge}>
                    {cert}
                  </span>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <h2>결제 정보</h2>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>결제 상태</label>
                  <p className={styles.paymentStatus(application.payment_status || '')}>
                    {application.payment_status === 'paid'
                      ? '결제 완료'
                      : application.payment_status === 'failed'
                      ? '결제 실패'
                      : '대기 중'}
                  </p>
                </div>
                <div className={styles.field}>
                  <label>결제 금액</label>
                  <p>{application.amount ? `${application.amount.toLocaleString()}원` : '-'}</p>
                </div>
                <div className={styles.field}>
                  <label>결제일</label>
                  <p>
                    {application.paid_at
                      ? new Date(application.paid_at).toLocaleDateString('ko-KR')
                      : '-'}
                  </p>
                </div>
                <div className={styles.field}>
                  <label>거래 번호</label>
                  <p>{application.trade_id || '-'}</p>
                </div>
                <div className={styles.field}>
                  <label>결제 번호</label>
                  <p>{application.mul_no || '-'}</p>
                </div>
              </div>
            </div>

            {application.photo_url && (
              <div className={styles.section}>
                <h2>증명 사진</h2>
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${application.photo_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.photoLink}
                >
                  사진 보기
                </a>
              </div>
            )}

            <div className={styles.section}>
              <label>신청일시</label>
              <p>
                {new Date(application.created_at).toLocaleDateString('ko-KR')}{' '}
                {new Date(application.created_at).toLocaleTimeString('ko-KR')}
              </p>
            </div>

            <div className={styles.actions}>
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                수정
              </button>
              <button onClick={handleDelete} className={styles.deleteButton}>
                삭제
              </button>
            </div>
          </>
        ) : (
          // 수정 모드
          <>
            <div className={styles.section}>
              <h2>기본 정보 수정</h2>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>성명</label>
                  <input
                    type="text"
                    value={formData?.name || ''}
                    onChange={(e) =>
                      setFormData(formData ? { ...formData, name: e.target.value } : null)
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>연락처</label>
                  <input
                    type="text"
                    value={formData?.contact || ''}
                    onChange={(e) =>
                      setFormData(formData ? { ...formData, contact: e.target.value } : null)
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>생년월일</label>
                  <input
                    type="text"
                    value={formData?.birth_prefix || ''}
                    onChange={(e) =>
                      setFormData(formData ? { ...formData, birth_prefix: e.target.value } : null)
                    }
                  />
                </div>
                <div className={styles.field}>
                  <label>우편번호</label>
                  <input
                    type="text"
                    value={formData?.postalCode || ''}
                    onChange={(e) =>
                      setFormData(formData ? { ...formData, postalCode: e.target.value } : null)
                    }
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>기본 주소</label>
                <input
                  type="text"
                  value={formData?.addressMain || ''}
                  onChange={(e) =>
                    setFormData(formData ? { ...formData, addressMain: e.target.value } : null)
                  }
                />
              </div>

              <div className={styles.field}>
                <label>상세 주소</label>
                <input
                  type="text"
                  value={formData?.addressDetail || ''}
                  onChange={(e) =>
                    setFormData(formData ? { ...formData, addressDetail: e.target.value } : null)
                  }
                />
              </div>

              <div className={styles.field}>
                <label>통신료 영수증</label>
                <input
                  type="text"
                  value={formData?.cash_receipt || ''}
                  onChange={(e) =>
                    setFormData(formData ? { ...formData, cash_receipt: e.target.value } : null)
                  }
                />
              </div>
            </div>

            <div className={styles.actions}>
              <button
                onClick={handleSave}
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData(application);
                }}
                className={styles.cancelButton}
              >
                취소
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
