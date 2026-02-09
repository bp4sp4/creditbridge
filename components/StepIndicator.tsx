import React from 'react';
import styles from './StepIndicator.module.css';

interface Step {
  title: string;
  desc: string;
}

export default function StepIndicator({ step }: { step: number }) {
  const steps: Step[] = [
    { title: '자격증 정보 입력', desc: '자격증 발급을 위한 개인정보를 입력해주세요.' },
    { title: '결제 정보 입력', desc: '현금영수증, 카드 등 결제에 필요한 정보를 입력해주세요.' },
    { title: '신청 완료', desc: '정보 입력 후 결제하시면 신청이 완료됩니다.' },
  ];
  return (
    <div className={styles.stepList}>
      {steps.map((s, idx) => (
        <div className={styles.stepItem} key={s.title}>
          <div className={step === idx + 1 ? `${styles.stepNumber} ${styles.active}` : styles.stepNumber}>{idx + 1}</div>
          <div className={styles.stepText}>
            <div className={styles.stepTitle}>{s.title}</div>
            <div className={styles.stepDesc}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
