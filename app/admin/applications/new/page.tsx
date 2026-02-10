'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/client';
import styles from '../[id]/detail.module.css';

type NewApplication = {
  name: string;
  contact: string;
  birth_prefix: string;
  addressMain: string;
  addressDetail: string;
  postalCode: string;
  certificates: string[];
  cash_receipt: string;
  payment_status?: string;
  amount?: number;
};

const CERTIFICATE_OPTIONS = [
  '노인심리상담사1급',
  '병원동행매니저1급',
  '노인돌봄생활지원사1급',
  '실버인지활동지도사1급',
  '안전관리지도사1급',
  '지역아동교육지도사1급',
  '방과후돌봄교실지도사1급',
  '방과후학교지도사1급',
  '진로적성상담사1급',
  '인성지도사',
  '심리상담사1급',
  '독서지도사1급',
  '학교폭력예방상담사1급',
  '음악심리상담사1급',
  '아동미술심리상담사1급',
  '부모교육상담사1급',
  '다문화심리상담사1급',
];

export default function NewApplicationPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<NewApplication>({
    name: '',
    contact: '',
    birth_prefix: '',
    addressMain: '',
    addressDetail: '',
    postalCode: '',
    certificates: [],
    cash_receipt: '',
    payment_status: 'paid',
    amount: 100000,
  });
  const [saving, setSaving] = useState(false);

  const handleCertificateToggle = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certificates: prev.certificates.includes(cert)
        ? prev.certificates.filter((c) => c !== cert)
        : [...prev.certificates, cert],
    }));
  };

  const handleSave = async () => {
    if (!formData.name || !formData.contact || !formData.birth_prefix || !formData.addressMain) {
      alert('필수 정보를 입력해주세요.');
      return;
    }

    if (formData.certificates.length === 0) {
      alert('최소 1개 이상의 자격증을 선택해주세요.');
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from('certificate_applications').insert([
        {
          name: formData.name,
          contact: formData.contact,
          birth_prefix: formData.birth_prefix,
          address: `${formData.addressMain} ${formData.addressDetail}`,
          addressMain: formData.addressMain,
          addressDetail: formData.addressDetail,
          postalCode: formData.postalCode,
          certificates: formData.certificates,
          cash_receipt: formData.cash_receipt,
          payment_status: formData.payment_status,
          amount: formData.amount,
          created_at: new Date().toISOString(),
        },
      ]);

      if (!error) {
        alert('등록되었습니다.');
        router.push('/admin');
      } else {
        alert('등록 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          ← 뒤로가기
        </button>
        <h1>새 신청 등록</h1>
        <div></div>
      </div>

      <div className={styles.card}>
        <div className={styles.section}>
          <h2>기본 정보</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>성명 *</label>
              <input
                type="text"
                placeholder="신청자 이름"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>연락처 *</label>
              <input
                type="text"
                placeholder="010-0000-0000"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>생년월일 (6자리) *</label>
              <input
                type="text"
                placeholder="990101"
                value={formData.birth_prefix}
                onChange={(e) => setFormData({ ...formData, birth_prefix: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>우편번호</label>
              <input
                type="text"
                placeholder="12345"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.field} style={{ marginTop: '16px' }}>
            <label>기본 주소 *</label>
            <input
              type="text"
              placeholder="서울시 강남구 테헤란로 123"
              value={formData.addressMain}
              onChange={(e) => setFormData({ ...formData, addressMain: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label>상세 주소</label>
            <input
              type="text"
              placeholder="456호"
              value={formData.addressDetail}
              onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label>통신료 영수증</label>
            <input
              type="text"
              placeholder="통신료 영수증 정보"
              value={formData.cash_receipt}
              onChange={(e) => setFormData({ ...formData, cash_receipt: e.target.value })}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h2>자격증 선택 *</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '12px',
            }}
          >
            {CERTIFICATE_OPTIONS.map((cert) => (
              <label
                key={cert}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px',
                  border: formData.certificates.includes(cert)
                    ? '2px solid #3182f6'
                    : '1px solid #e5e8eb',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: formData.certificates.includes(cert) ? '#f0f4ff' : 'white',
                  transition: 'all 0.2s',
                }}
              >
                <input
                  type="checkbox"
                  checked={formData.certificates.includes(cert)}
                  onChange={() => handleCertificateToggle(cert)}
                  style={{ cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px' }}>{cert}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2>결제 정보</h2>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label>결제 상태</label>
              <select
                value={formData.payment_status || 'paid'}
                onChange={(e) =>
                  setFormData({ ...formData, payment_status: e.target.value })
                }
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e5e8eb',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                }}
              >
                <option value="paid">결제 완료</option>
                <option value="pending">결제 대기</option>
                <option value="failed">결제 실패</option>
              </select>
            </div>
            <div className={styles.field}>
              <label>결제 금액</label>
              <input
                type="number"
                value={formData.amount || 0}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
              />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
            {saving ? '등록 중...' : '등록'}
          </button>
          <button onClick={() => router.back()} className={styles.cancelButton}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
