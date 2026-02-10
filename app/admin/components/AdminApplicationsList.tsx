'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import styles from './admin.module.css';
import DetailModal from './DetailModal';
import NewApplicationModal from './NewApplicationModal';

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
  click_source?: string;
  order_id?: string;
  amount?: number;
  payment_status?: string;
  paid_at?: string;
  trade_id?: string;
  mul_no?: string;
  pay_method?: string;
  address_main?: string;
  address_detail?: string;
  postal_code?: string;
};

export default function AdminApplicationsList() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
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
      sessionStorage.setItem('adminLoginTime', Date.now().toString());
    } else {
      const now = Date.now();
      const elapsed = now - parseInt(loginTime);
      const oneDay = 24 * 60 * 60 * 1000;

      if (elapsed > oneDay) {
        handleLogout();
        return;
      }

      const remainingTime = oneDay - elapsed;
      const logoutTimer = setTimeout(() => {
        handleLogout();
      }, remainingTime);

      return () => clearTimeout(logoutTimer);
    }
  }, []);

  // 데이터 조회
  useEffect(() => {
    const supabase = createClient();
    async function fetchApplications() {
      setLoading(true);
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      const { count } = await supabase
        .from('certificate_applications')
        .select('*', { count: 'exact', head: true });

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

  // 모달 열기
  const openModal = (app: Application) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
  };

  // 데이터 새로고침
  const refreshData = () => {
    setCurrentPage(1);
  };

  // 즉시 삭제 (optimistic update)
  const handleDeleteApplication = (id: string) => {
    setApplications(prev => prev.filter(app => app.id !== id));
    setTotalCount(prev => prev - 1);
  };

  // 즉시 수정 (optimistic update)
  const handleUpdateApplication = (id: string, data: Partial<Application>) => {
    setApplications(prev =>
      prev.map(app =>
        app.id === id ? { ...app, ...data } : app
      )
    );
  };

  // 즉시 추가 (optimistic update)
  const handleAddApplication = (newApp: Application) => {
    setApplications(prev => [newApp, ...prev]);
    setTotalCount(prev => prev + 1);
  };

  if (loading) return <div className={styles.loading}>데이터를 불러오고 있습니다...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>자격증 신청 내역</h2>
          <div style={{ color: '#8b95a1', fontSize: '14px' }}>
            총 <strong>{totalCount}</strong>건
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setIsNewModalOpen(true)}
            style={{
              padding: '10px 16px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#059669';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#10b981';
            }}
          >
            + 새 신청
          </button>
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
                <tr key={app.id} onClick={() => openModal(app)} style={{ cursor: 'pointer' }}>
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
                      <img
                        src={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]}/storage/v1/object/public/photos/${app.photo_url}`}
                        alt="사진"
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid #e5e8eb',
                          cursor: 'pointer'
                        }}
                        title="클릭하여 상세정보 보기"
                      />
                    ) : (
                      <span style={{ color: '#ccc', fontSize: '12px' }}>없음</span>
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
            마지막
          </button>
        </div>
      </div>

      {/* 상세 모달 */}
      {isModalOpen && selectedApp && (
        <DetailModal
          application={selectedApp}
          onClose={closeModal}
          onRefresh={refreshData}
          onDelete={handleDeleteApplication}
          onUpdate={handleUpdateApplication}
        />
      )}

      {/* 새 신청 모달 */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onRefresh={refreshData}
        onAdd={handleAddApplication}
      />
    </div>
  );
}
