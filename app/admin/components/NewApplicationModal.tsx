'use client';

import React, { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

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

const CERTIFICATE_CATEGORIES = [
  {
    label: '★필수★ 노인복지분야',
    options: ['노인심리상담사1급', '병원동행매니저1급', '노인돌봄생활지원사1급', '실버인지활동지도사1급', '안전관리지도사1급']
  },
  {
    label: '★필수★ 아동복지분야',
    options: ['지역아동교육지도사1급', '방과후돌봄교실지도사1급', '방과후학교지도사1급', '진로적성상담사1급/인성지도사', '심리상담사1급']
  },
  {
    label: '★필수★ 노인복지분야 2',
    options: ['진로적성상담사1급/인성지도사', '심리상담사1급', '독서지도사1급', '학교폭력예방상담사1급', '인성지도사1급']
  },
  {
    label: '사회복지',
    options: ['노인심리상담사1급', '노인돌봄생활지원사1급', '병원동행매니저1급', '심리상담사1급', '다문화심리상담사1급', '음악심리상담사1급', '아동미술심리상담사1급', '부모교육상담사1급', '실버인지활동지도사1급', '지역아동교육지도사1급', '방과후돌봄교실지도사1급', '학교폭력예방상담사1급', '진로적성상담사1급', '안전교육지도사1급', '자원봉사지도사1급']
  },
  {
    label: '보육과정',
    options: ['방과후아동지도사1급', '방과후돌봄교실지도사1급', '방과후수학지도사1급', '방과후학교지도사1급', '독서지도사1급', '진로적성상담사1급/인성지도사', '지역아동교육지도사1급', '동화구연지도사1급', '아동공예지도사1급', '아동요리지도사1급', '안전교육지도사1급', '아동미술심리상담사1급', '부모교육상담사1급', '디지털중독예방지도사1급']
  },
  {
    label: '교양수업',
    options: ['지역아동교육지도사1급', '심리분석사1급', '심리상담사1급', '부동산권리분석사1급']
  },
  {
    label: '신규',
    options: ['북아트1급', '손유희지도사', '유튜브크리에이터', '이미지메이킹스피킹', '자기주도학습지도사1급', '종이접기지도사', '클레이아트지도사', '타로심리상담사', 'POP디자인지도사', 'SNS마케팅전문가', '병원코디네이터1급', '독서논술지도사1급']
  }
];

type NewApplicationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
};

export default function NewApplicationModal({ isOpen, onClose, onRefresh }: NewApplicationModalProps) {
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
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

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
        setFormData({
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
        onRefresh();
        onClose();
      } else {
        alert('등록 중 오류가 발생했습니다.');
      }
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 중복 제거한 자격증 리스트
  const allCertificates = Array.from(
    new Set(CERTIFICATE_CATEGORIES.flatMap((cat) => cat.options))
  ).sort();

  // 검색 결과 필터링
  const filteredCertificates = allCertificates.filter((cert) =>
    cert.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideModal {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
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
          borderBottom: '1px solid #f0f0f0',
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#191f28' }}>
            새 신청 등록
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
          {/* 기본 정보 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '16px', textTransform: 'uppercase' }}>
              기본 정보
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  성명 *
                </label>
                <input
                  type="text"
                  placeholder="신청자 이름"
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
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  연락처 *
                </label>
                <input
                  type="text"
                  placeholder="010-0000-0000"
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
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  생년월일 (6자리) *
                </label>
                <input
                  type="text"
                  placeholder="990101"
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
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  기본 주소 *
                </label>
                <input
                  type="text"
                  placeholder="서울시 강남구 테헤란로 123"
                  value={formData.addressMain}
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
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  상세 주소
                </label>
                <input
                  type="text"
                  placeholder="456호"
                  value={formData.addressDetail}
                  onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
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
            </div>
          </div>

          {/* 자격증 선택 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '16px', textTransform: 'uppercase' }}>
              자격증 선택 * ({formData.certificates.length}개)
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="자격증 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              maxHeight: '350px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}>
              {filteredCertificates.length > 0 ? filteredCertificates.map((cert) => (
                <label
                  key={cert}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px',
                    border: formData.certificates.includes(cert)
                      ? '2px solid #3182f6'
                      : '1px solid #e5e8eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: formData.certificates.includes(cert) ? '#f0f4ff' : 'white',
                    transition: 'all 0.2s',
                    fontSize: '12px'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.certificates.includes(cert)}
                    onChange={() => handleCertificateToggle(cert)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', lineHeight: 1.3 }}>{cert}</span>
                </label>
              )) : (
                <div style={{ gridColumn: '1 / -1', padding: '20px', textAlign: 'center', color: '#999' }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* 결제 정보 */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#999', marginBottom: '16px', textTransform: 'uppercase' }}>
              결제 정보
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  결제 상태
                </label>
                <select
                  value={formData.payment_status || 'paid'}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_status: e.target.value })
                  }
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #e5e8eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="paid">결제 완료</option>
                  <option value="pending">결제 대기</option>
                  <option value="failed">결제 실패</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#999', display: 'block', marginBottom: '8px' }}>
                  결제 금액
                </label>
                <input
                  type="number"
                  value={formData.amount || 0}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) })}
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
            </div>
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
              {saving ? '등록 중...' : '등록'}
            </button>
            <button
              onClick={onClose}
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
        </div>
      </div>
    </div>
  );
}
