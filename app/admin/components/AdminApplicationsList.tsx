'use client';

import React, { useEffect, useState } from 'react';
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
};

export default function AdminApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    async function fetchApplications() {
      setLoading(true);
      const { data, error } = await supabase
        .from('certificate_applications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error) {
        setApplications(data || []);
      }
      setLoading(false);
    }
    fetchApplications();
  }, []);

  if (loading) return <div className={styles.loading}>데이터를 불러오고 있습니다...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>자격증 신청 내역</h2>
        <div style={{ color: '#8b95a1', fontSize: '14px' }}>
          총 <strong>{applications.length}</strong>건
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
      </div>
    </div>
  );
}