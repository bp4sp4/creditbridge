'use client';

import { useState } from 'react';
import { loadPayAppSDK } from '../lib/payapp';

interface PaymentButtonProps {
  amount: number;
  orderName: string;
  customerName: string;
  customerPhone: string;
  orderId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export default function PaymentButton({
  amount,
  orderName,
  customerName,
  customerPhone,
  orderId,
  onSuccess,
  onError,
  className = '',
  disabled = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (loading || disabled) return;

    setLoading(true);
    try {
      // 결제 요청 생성
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          orderName,
          customerName,
          customerPhone,
          orderId,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.success) {
        throw new Error(paymentData.error || '결제 요청 생성 실패');
      }

      // PayApp SDK 로드
      await loadPayAppSDK({ retries: 3, timeout: 8000 });

      const PayApp = (window as any).PayApp;

      if (!PayApp) {
        throw new Error('PayApp SDK 로드 실패');
      }

      // PayApp Lite SDK로 결제 실행
      PayApp.link({
        userid: process.env.NEXT_PUBLIC_PAYAPP_USER_ID,
        goodname: orderName,
        price: amount,
        recvname: customerName,
        recvphone: customerPhone,
        var1: paymentData.data.orderId, // 주문번호
        returnurl: `${window.location.origin}/api/payments/result`,
        feedbackurl: `${window.location.origin}/api/payments/webhook`,
      });

      onSuccess?.(paymentData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.';
      console.error('Payment error:', errorMessage);
      onError?.(errorMessage);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || disabled}
      className={className}
      style={{
        opacity: loading || disabled ? 0.6 : 1,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {loading ? '처리 중...' : `${amount.toLocaleString()}원 결제하기`}
    </button>
  );
}
