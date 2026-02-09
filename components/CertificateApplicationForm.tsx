'use client';

import Image from 'next/image';
import { useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '../lib/supabase/client';

import StepIndicator from './StepIndicator';
import styles from './stepflow.module.css';
import DaumPostcodeInput from './DaumPostcodeInput';

// 자격증 데이터 구조
const CERTIFICATE_CATEGORIES = [
  {
    label: '사회복지 이수과목',
    options: ['노인심리상담사1급', '노인돌봄생활지원사1급', '병원동행매니저1급', '심리상담사1급', '다문화심리상담사1급', '음악심리상담사1급', '아동미술심리상담사1급', '부모교육상담사1급', '실버인지활동지도사1급', '지역아동교육지도사1급', '방과후돌봄교실지도사1급', '학교폭력예방상담사1급', '진로적성상담사1급', '안전교육지도사1급', '자원봉사지도사1급']
  },
  {
    label: '보육과정 이수과목',
    options: ['방과후아동지도사1급', '방과후돌봄교실지도사1급', '방과후수학지도사1급', '방과후학교지도사1급', '독서지도사1급', '진로적성상담사1급/인성지도사', '지역아동교육지도사1급', '동화구연지도사1급', '아동공예지도사1급', '아동요리지도사1급', '안전교육지도사1급', '아동미술심리상담사1급', '부모교육상담사1급', '디지털중독예방지도사1급']
  },
  {
    label: '교양수업 이수과목',
    options: ['지역아동교육지도사1급', '심리분석사1급', '심리상담사1급', '부동산권리분석사1급']
  },
  {
    label: '신규 발급 과정',
    options: ['북아트1급', '손유희지도사', '유튜브크리에이터', '이미지메이킹스피킹', '자기주도학습지도사1급', '종이접기지도사', '클레이아트지도사', '타로심리상담사', 'POP디자인지도사', 'SNS마케팅전문가', '병원코디네이터1급', '독서논술지도사1급']
  }
];

function StepFlowContent({ clickSource }: { clickSource: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    birth_prefix: '',
    address: '', // 전체 주소
    addressMain: '', // 기본주소
    addressDetail: '', // 상세주소
    postalCode: '', // 우편번호
    certificates: [] as string[],
    cash_receipt: '',
    photo: null as File | null,
  });

    // 파일 이름 안전하게 변환
    function sanitizeFileName(name: string) {
      return name
        .replace(/[^a-zA-Z0-9._-]/g, '_') // 한글, 특수문자, 공백 모두 언더스코어로 대체
        .replace(/_+/g, '_'); // 연속된 언더스코어는 하나로
    }
  const handleCertToggle = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certificates: prev.certificates.includes(cert)
        ? prev.certificates.filter(c => c !== cert)
        : [...prev.certificates, cert]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    const supabase = createClient();
    let photo_url = null;

    try {
      if (formData.photo) {
          const safeName = sanitizeFileName(formData.photo.name);
          const { data, error: uploadError } = await supabase.storage
            .from('photos')
            .upload(`cert_photos/${Date.now()}_${safeName}`, formData.photo);
        if (uploadError) throw uploadError;
        photo_url = data?.path;
      }

      const { error: insertError } = await supabase
        .from('certificate_applications')
        .insert([{
          name: formData.name,
          contact: formData.contact,
          birth_prefix: formData.birth_prefix,
          address: formData.address,
          certificates: formData.certificates,
          cash_receipt: formData.cash_receipt,
          photo_url,

        }]);

      if (insertError) throw insertError;
      setStep(3);
    } catch (err: any) {
      alert('오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.name && formData.contact && formData.birth_prefix.length === 6 && formData.certificates.length > 0 && privacyAgreed;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Image src="/logo.png" alt="로고" width={130} height={34} className={styles.logo} />
      </header>



      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.stepWrapper}>
            <div className={styles.infoSection}>
              <div className={styles.infoInner}>
                <div style={{ marginBottom: '36px' }}>
                  <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', lineHeight: '1.3' }}>학점 연계 신청</h1>
                </div>
                     <StepIndicator step={step} />
                <div className={styles.infoCall}>
                  <span style={{
                    color: 'var(--Atomic-Blue-600, #0049E5)',
                    fontFamily: 'Pretendard',
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: '21.6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" style={{marginRight: 4}}>
                      <path fillRule="evenodd" clipRule="evenodd" d="M16.7045 21.9824C15.2645 21.9294 11.1835 21.3654 6.90947 17.0924C2.63647 12.8184 2.07347 8.73837 2.01947 7.29737C1.93947 5.10137 3.62147 2.96837 5.56447 2.13537C5.79844 2.03433 6.05467 1.99587 6.308 2.02374C6.56133 2.05162 6.80305 2.14488 7.00947 2.29437C8.60947 3.46037 9.71346 5.22437 10.6615 6.61137C10.87 6.9161 10.9592 7.28691 10.912 7.65316C10.8648 8.01941 10.6845 8.35549 10.4055 8.59737L8.45446 10.0464C8.36021 10.1144 8.29386 10.2144 8.26774 10.3277C8.24162 10.441 8.25752 10.5599 8.31246 10.6624C8.75447 11.4654 9.54046 12.6614 10.4405 13.5614C11.3405 14.4614 12.5935 15.2994 13.4525 15.7914C13.5602 15.8518 13.6869 15.8687 13.8067 15.8386C13.9265 15.8085 14.0302 15.7336 14.0965 15.6294L15.3665 13.6964C15.6 13.3862 15.9444 13.1784 16.3276 13.1165C16.7109 13.0547 17.1032 13.1435 17.4225 13.3644C18.8295 14.3384 20.4715 15.4234 21.6735 16.9624C21.8351 17.1703 21.9379 17.4178 21.9712 17.679C22.0044 17.9402 21.9669 18.2056 21.8625 18.4474C21.0255 20.4004 18.9075 22.0634 16.7045 21.9824Z" fill="#0049E5"/>
                    </svg>
                    빠른 문의: <a href="tel:0221354951" className={styles.infoCallLink}>02-2135-4951</a>
                  </span>
                </div>
              </div>
              <button className={styles.bottomButton} onClick={() => setStep(2)}>다음</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={styles.stepWrapper}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>이름</label>
              <input
                type="text"
                className={styles.inputField}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="성함을 입력해주세요"
              />
            </div>
            {formData.name && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>연락처</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="연락처를 입력해주세요"
                />
              </div>
            )}
            {formData.name && formData.contact && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>생년월일 (앞 6자리)</label>
                <input
                  type="text"
                  maxLength={6}
                  className={styles.inputField}
                  value={formData.birth_prefix}
                  onChange={(e) => setFormData({ ...formData, birth_prefix: e.target.value })}
                  placeholder="yymmdd"
                />
              </div>
            )}
            {formData.name && formData.contact && formData.birth_prefix.length === 6 && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>자격증 수령 주소</label>
                <DaumPostcodeInput
                  onComplete={({ zonecode, address, addressDetail }) => {
                    setFormData((prev) => ({
                      ...prev,
                      postalCode: zonecode,
                      addressMain: address,
                      addressDetail: '',
                      address: `${zonecode} ${address}`
                    }));
                  }}
                />
                {formData.addressMain && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        className={styles.inputField + ' ' + styles.addressInput}
                        value={`${formData.postalCode} ${formData.addressMain}`}
                        readOnly
                        tabIndex={-1}
                        style={{ flex: 2, marginRight: 8 }}
                      />
                      <input
                        type="text"
                        className={styles.inputField + ' ' + styles.addressInput}
                        value={formData.addressDetail}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            addressDetail: e.target.value,
                            address: `${prev.postalCode} ${prev.addressMain} ${e.target.value}`
                          }));
                        }}
                        placeholder="상세주소 (예: 202호)"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {formData.name && formData.contact && formData.birth_prefix.length === 6 && formData.addressMain && formData.addressDetail && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>자격증 선택</label>
                <div
                  className={`${styles.inputField} ${styles.courseSelectField}`}
                  onClick={() => setShowCertModal(true)}
                >
                  <span className={formData.certificates.length > 0 ? styles.courseSelectedText : styles.coursePlaceholder} style={{ display: 'inline-block', maxWidth: 480, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formData.certificates.length > 0
                      ? formData.certificates.length <= 3
                        ? formData.certificates.join(', ')
                        : `${formData.certificates.slice(0, 3).join(', ')} 외 ${formData.certificates.length - 3}개`
                      : '발급받을 자격증을 선택하세요'}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M5 7.5L10 12.5L15 7.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            )}
            {formData.name && formData.contact && formData.birth_prefix.length === 6 && formData.addressMain && formData.addressDetail && formData.certificates.length > 0 && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>증명사진 첨부</label>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.inputField}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                />
                {formData.photo && (
                  <div style={{ marginTop: 12 }}>
                    <img
                      src={URL.createObjectURL(formData.photo)}
                      alt="미리보기"
                      style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, border: '1.5px solid #e5e8eb', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}
                    />
                  </div>
                )}
              </div>
            )}
            {formData.name && formData.contact && formData.birth_prefix.length === 6 && formData.addressMain && formData.addressDetail && formData.certificates.length > 0 && (
              <div className={styles.inputGroup} style={{ marginTop: '20px' }}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span>
                    <button type="button" className={styles.privacyLink}>개인정보처리방침</button> 동의
                  </span>
                </label>
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
              <button
                className={styles.bottomButton}
                disabled={
                  !formData.name ||
                  !formData.contact ||
                  formData.birth_prefix.length !== 6 ||
                  !formData.addressMain ||
                  !formData.addressDetail ||
                  formData.certificates.length === 0 ||
                  !privacyAgreed ||
                  loading
                }
                onClick={handleSubmit}
              >
                {loading ? '처리 중...' : '신청하기'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={styles.stepWrapper} style={{ textAlign: 'center', justifyContent: 'center' }}>
            <Image src="/complete-check.png" alt="완료" width={240} height={240} style={{ margin: '0 auto 24px' }} />
            <h1 className={styles.title}>신청이 완료되었습니다!{"\n"}순차적으로 연락드리겠습니다.</h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 자격증 선택 모달 */}
      {showCertModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCertModal(false)}>
          <div className={styles.modalPrivacy} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalPrivacyHeader}>
              <h3 className={styles.modalPrivacyTitle}>자격증 선택 (중복가능)</h3>
              <button className={styles.modalCloseButton} onClick={() => setShowCertModal(false)}>✕</button>
            </div>
            <div className={styles.modalPrivacyContent} style={{ overflowY: 'auto', maxHeight: '60vh' }}>
              <div style={{ padding: '20px' }}>
                {CERTIFICATE_CATEGORIES.map((cat) => (
                  <div key={cat.label} style={{ marginBottom: '24px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#4C85FF', marginBottom: '12px' }}>{cat.label}</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {cat.options.map(opt => (
                        <button
                          key={opt}
                          className={`${styles.courseItem} ${formData.certificates.includes(opt) ? styles.courseItemSelected : ''}`}
                          onClick={() => handleCertToggle(opt)}
                          style={{ fontSize: '13px', padding: '10px 8px' }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.courseModalFooter}>
              <button className={styles.courseConfirmButton} onClick={() => setShowCertModal(false)}>선택 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CertificateApplicationForm({ clickSource = 'direct' }: { clickSource?: string }) {
  return (
    <Suspense fallback={<div>로딩중...</div>}>
      <StepFlowContent clickSource={clickSource} />
    </Suspense>
  );
}