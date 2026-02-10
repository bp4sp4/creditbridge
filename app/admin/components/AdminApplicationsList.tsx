'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import styles from './admin.module.css'; // 위 CSS 파일 임포트

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
  click_source?: string; // 추가된 유입경로
  order_id?: string;
  amount?: number;
  payment_status?: string;
  paid_at?: string;
  trade_id?: string;
  mul_no?: string;
  pay_method?: string;
};

export default function AdminApplicationsList() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // 로그아웃 함수
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    sessionStorage.removeItem('adminLoginTime');
    router.push('/admin/login');
  };

  // 24시간 자동 로그아웃
  useEffect(() => {
    const supabase = createClient();
    const loginTime = sessionStorage.getItem('adminLoginTime');

    if (!loginTime) {
      // 로그인 시간이 없으면 현재 시간 저장
      sessionStorage.setItem('adminLoginTime', Date.now().toString());
    } else {
      // 24시간 경과 확인
      const now = Date.now();
      const elapsed = now - parseInt(loginTime);
      const oneDay = 24 * 60 * 60 * 1000; // 24시간을 밀리초로

      if (elapsed > oneDay) {
        // 24시간 경과했으면 로그아웃
        handleLogout();
        return;
      }

      // 남은 시간만큼 타이머 설정
      const remainingTime = oneDay - elapsed;
      const logoutTimer = setTimeout(() => {
        handleLogout();
      }, remainingTime);

      return () => clearTimeout(logoutTimer);
    }
  }, []);

  // 데이터 조회 useEffect
  useEffect(() => {
    const supabase = createClient();
    async function fetchApplications() {
      setLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      // 전체 개수 조회
      const { count } = await supabase
        .from('certificate_applications')
        .select('*', { count: 'exact', head: true });

      // 페이지별 데이터 조회
      const { data, error } = await supabase
        .from('certificate_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (!error) {
        setApplications(data || []);
        setTotalCount(count || 0);
      }
      setLoading(false);
    }
    fetchApplications();
  }, [currentPage]);

  if (loading) return <div className={styles.loading}>데이터를 불러오고 있습니다...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>자격증 신청 내역</h2>
          <div style={{ color: '#8b95a1', fontSize: '14px' }}>
            총 <strong>{applications.length}</strong>건
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#ffffff',
            backgroundColor: '#ef4444',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dc2626';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ef4444';
          }}
        >
          로그아웃
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>신청자</th>
                <th>연락처 / 생년월일</th>
                <th>신청 자격증</th>
                <th>주소</th>
                <th>결제 상태</th>
                <th>결제 금액</th>
                <th>결제일</th>
                <th>결제번호</th>
                <th>사진</th>
                <th>신청일</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#191f28' }}>{app.name}</div>
                  </td>
                  <td>
                    <div style={{ marginBottom: '4px' }}>{app.contact}</div>
                    <div style={{ fontSize: '13px', color: '#8b95a1' }}>{app.birth_prefix}</div>
                  </td>
                  <td>
                    <div style={{ maxWidth: '250px' }}>
                      {app.certificates.map((cert, idx) => (
                        <span key={idx} className={styles.certBadge}>{cert}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '14px', width: '200px', lineHeight: 1.4 }}>
                      {app.address}
                    </div>
                  </td>
                  <td>
                    <div style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: app.payment_status === 'paid' ? '#d1fae5' : app.payment_status === 'failed' ? '#fee2e2' : '#fef3c7',
                      color: app.payment_status === 'paid' ? '#065f46' : app.payment_status === 'failed' ? '#991b1b' : '#92400e'
                    }}>
                      {app.payment_status === 'paid' ? '결제완료' : app.payment_status === 'failed' ? '결제실패' : '대기중'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {app.amount ? `${app.amount.toLocaleString()}원` : '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px' }}>
                      {app.paid_at ? new Date(app.paid_at).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontFamily: 'monospace' }}>
                      {app.mul_no ? app.mul_no : '-'}
                    </div>
                  </td>

                  <td>
                    {app.photo_url ? (
                      <a
                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/photos/${app.photo_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.photoLink}
                      >
                        보기
                      </a>
                    ) : (
                      <span style={{ color: '#e5e8eb' }}>없음</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.date}>
                      {new Date(app.created_at).toLocaleDateString('ko-KR')}
                      <br />
                      {new Date(app.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
          padding: '20px',
          borderTop: '1px solid #f2f2f2'
        }}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              border: '1px solid #e5e8eb',
              borderRadius: '6px',
              backgroundColor: currentPage === 1 ? '#f2f2f2' : '#ffffff',
              color: currentPage === 1 ? '#b0b8c1' : '#4e5968',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            처음
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              border: '1px solid #e5e8eb',
              borderRadius: '6px',
              backgroundColor: currentPage === 1 ? '#f2f2f2' : '#ffffff',
              color: currentPage === 1 ? '#b0b8c1' : '#4e5968',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            이전
          </button>

          {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
            .slice(Math.max(0, currentPage - 3), Math.min(Math.ceil(totalCount / itemsPerPage), currentPage + 2))
            .map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                style={{
                  padding: '6px 10px',
                  fontSize: '13px',
                  border: page === currentPage ? '1px solid #3182f6' : '1px solid #e5e8eb',
                  borderRadius: '6px',
                  backgroundColor: page === currentPage ? '#3182f6' : '#ffffff',
                  color: page === currentPage ? '#ffffff' : '#4e5968',
                  cursor: 'pointer',
                  fontWeight: page === currentPage ? 600 : 500
                }}
              >
                {page}
              </button>
            ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)))}
            disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              border: '1px solid #e5e8eb',
              borderRadius: '6px',
              backgroundColor: currentPage === Math.ceil(totalCount / itemsPerPage) ? '#f2f2f2' : '#ffffff',
              color: currentPage === Math.ceil(totalCount / itemsPerPage) ? '#b0b8c1' : '#4e5968',
              cursor: currentPage === Math.ceil(totalCount / itemsPerPage) ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            다음
          </button>
          <button
            onClick={() => setCurrentPage(Math.ceil(totalCount / itemsPerPage))}
            disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              border: '1px solid #e5e8eb',
              borderRadius: '6px',
              backgroundColor: currentPage === Math.ceil(totalCount / itemsPerPage) ? '#f2f2f2' : '#ffffff',
              color: currentPage === Math.ceil(totalCount / itemsPerPage) ? '#b0b8c1' : '#4e5968',
              cursor: currentPage === Math.ceil(totalCount / itemsPerPage) ? 'not-allowed' : 'pointer',
              fontWeight: 500
            }}
          >
            끝
          </button>

          <span style={{
            marginLeft: '16px',
            fontSize: '13px',
            color: '#8b95a1'
          }}>
            {currentPage} / {Math.ceil(totalCount / itemsPerPage)} 페이지 (총 {totalCount}건)
          </span>
        </div>
      </div>
    </div>
  );
}