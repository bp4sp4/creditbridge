import { useRef } from 'react';

interface DaumPostcodeInputProps {
  onComplete: (data: { zonecode: string; address: string; addressDetail: string }) => void;
}

export default function DaumPostcodeInput({ onComplete }: DaumPostcodeInputProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  const openPostcode = () => {
    if (typeof window === 'undefined' || !(window as any).daum) return;
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        onComplete({
          zonecode: data.zonecode,
          address: data.roadAddress || data.jibunAddress,
          addressDetail: '',
        });
      },
    }).open();
  };

  return (
    <>
      <button
        type="button"
        onClick={openPostcode}
        style={{
          width: '100%',
          padding: '16px',
          border: '1px solid #e0e0e0',
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 500,
          color: '#4e5968',
          marginBottom: 10,
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10
        }}
    
      >
        <span style={{ width: 24, height: 24, aspectRatio: '1/1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 11C9 11.7956 9.31607 12.5587 9.87868 13.1213C10.4413 13.6839 11.2044 14 12 14C12.7956 14 13.5587 13.6839 14.1213 13.1213C14.6839 12.5587 15 11.7956 15 11C15 10.2044 14.6839 9.44129 14.1213 8.87868C13.5587 8.31607 12.7956 8 12 8C11.2044 8 10.4413 8.31607 9.87868 8.87868C9.31607 9.44129 9 10.2044 9 11Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.657 16.657L13.414 20.9C13.039 21.2746 12.5306 21.485 12.0005 21.485C11.4704 21.485 10.962 21.2746 10.587 20.9L6.343 16.657C5.22422 15.5381 4.46234 14.1127 4.15369 12.5608C3.84504 11.009 4.00349 9.40047 4.60901 7.93868C5.21452 6.4769 6.2399 5.22749 7.55548 4.34846C8.87107 3.46943 10.4178 3.00024 12 3.00024C13.5822 3.00024 15.1289 3.46943 16.4445 4.34846C17.7601 5.22749 18.7855 6.4769 19.391 7.93868C19.9965 9.40047 20.155 11.009 19.8463 12.5608C19.5377 14.1127 18.7758 15.5381 17.657 16.657Z" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        우편번호로 주소 검색
      </button>
      <div ref={elementRef} />
    </>
  );
}
