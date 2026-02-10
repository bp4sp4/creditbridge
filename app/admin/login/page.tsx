"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.push('/admin/components');
      }
    });
    return () => {
      if (data && data.subscription && typeof data.subscription.unsubscribe === 'function') {
        data.subscription.unsubscribe();
      }
    };
  }, [router, supabase]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
      }
    } catch (err: any) {
      setError('로그인 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f5f6f8',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '360px',
        padding: '0 20px'
      }}>
        {/* 헤더 */}
        <div style={{ marginBottom: '48px', textAlign: 'center' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#191f28',
            margin: '0 0 8px 0'
          }}>
            관리자
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#8b95a1',
            margin: 0
          }}>
            로그인해서 신청 현황을 관리하세요
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
          border: '1px solid #f2f2f2'
        }}>
          {/* 이메일 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#191f28',
              marginBottom: '8px'
            }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: '1px solid #e5e8eb',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#f9fafb',
                color: '#191f28',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3182f6';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e8eb';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
            />
          </div>

          {/* 비밀번호 */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 600,
              color: '#191f28',
              marginBottom: '8px'
            }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: '1px solid #e5e8eb',
                borderRadius: '8px',
                boxSizing: 'border-box',
                backgroundColor: '#f9fafb',
                color: '#191f28',
                transition: 'border-color 0.2s',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3182f6';
                e.currentTarget.style.backgroundColor = '#ffffff';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e8eb';
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              marginBottom: '20px',
              padding: '12px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#b91c1c'
            }}>
              {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: loading ? '#cad1da' : '#3182f6',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#3182f6';
              }
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 하단 정보 */}
        <p style={{
          marginTop: '32px',
          fontSize: '12px',
          color: '#8b95a1',
          textAlign: 'center',
          margin: '32px 0 0 0'
        }}>
          계정이 없으신가요? 관리자에게 문의하세요
        </p>
      </div>
    </div>
  );
}
