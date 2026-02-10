'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 결제 완료 세션 저장
    sessionStorage.setItem('paymentProcessed', 'true');
    sessionStorage.removeItem('paymentProcessing');

    // 페이지 로드 완료
    setIsLoading(false);

    // 3초 후 홈으로 이동
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {!isLoading && (
          <>
            <Image
              src="/complete-check.png"
              alt="완료"
              width={120}
              height={120}
              className={styles.checkImage}
            />
            <h1 className={styles.title}>결제가 완료되었습니다!</h1>
            <p className={styles.description}>잠시 후 홈페이지로 이동됩니다...</p>
          </>
        )}
      </div>
    </div>
  );
}
