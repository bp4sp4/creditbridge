'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 결제 완료 세션 저장
    sessionStorage.setItem('paymentProcessed', 'true');
    sessionStorage.removeItem('paymentProcessing');

    // 3초 후 홈으로 이동
    const timer = setTimeout(() => {
      router.push('/?payment=success&step=3');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px',
      padding: '20px',
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        maxWidth: '400px',
        width: '100%'
      }}>
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ margin: '0 auto 24px', display: 'block' }}>
          <circle cx="60" cy="60" r="60" fill="#4CAF50" />
          <path d="M 50 70 L 55 75 L 75 55" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#191f28', margin: '0 0 10px 0' }}>
          결제가 완료되었습니다!
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          잠시 후 홈페이지로 이동됩니다...
        </p>
      </div>
    </div>
  );
}
