-- ============================================
-- 자격증 신청 관련 쿼리
-- ============================================

-- 1. 모든 자격증 신청 조회
SELECT
  ca.id,
  ca.name,
  ca.contact,
  ca.birth_prefix,
  ca.address_main,
  ca.certificates,
  ca.status,
  ca.created_at
FROM certificate_applications ca
ORDER BY ca.created_at DESC;

-- 2. 특정 사용자의 신청 조회
SELECT *
FROM certificate_applications
WHERE name = '홍길동' OR contact = '010-1234-5678'
ORDER BY created_at DESC;

-- 3. 상태별 신청 조회
SELECT
  status,
  COUNT(*) as count
FROM certificate_applications
GROUP BY status;

-- 4. 자격증별 신청 수
SELECT
  cert,
  COUNT(*) as count
FROM certificate_applications,
LATERAL UNNEST(certificates) as cert
GROUP BY cert
ORDER BY count DESC;

-- ============================================
-- 결제 관련 쿼리
-- ============================================

-- 5. 모든 주문 조회
SELECT
  o.id,
  o.order_id,
  o.amount,
  o.order_name,
  o.customer_name,
  o.customer_phone,
  o.status,
  o.pay_method,
  o.paid_at,
  ca.name as applicant_name
FROM orders o
LEFT JOIN certificate_applications ca ON o.application_id = ca.id
ORDER BY o.created_at DESC;

-- 6. 결제된 주문 조회
SELECT
  o.*,
  ca.name,
  ca.certificates
FROM orders o
LEFT JOIN certificate_applications ca ON o.application_id = ca.id
WHERE o.status = 'paid'
ORDER BY o.paid_at DESC;

-- 7. 실패한 주문 조회
SELECT
  o.*,
  o.failed_message
FROM orders o
WHERE o.status = 'failed'
ORDER BY o.failed_at DESC;

-- 8. 주문별 결제 금액 합계
SELECT
  DATE(created_at) as payment_date,
  COUNT(*) as order_count,
  SUM(amount) as total_amount
FROM orders
WHERE status = 'paid'
GROUP BY DATE(created_at)
ORDER BY payment_date DESC;

-- 9. 특정 주문 상세 조회
SELECT
  o.*,
  ca.*
FROM orders o
LEFT JOIN certificate_applications ca ON o.application_id = ca.id
WHERE o.order_id = 'CERT-1707xxx';

-- 10. 결제수단별 주문 통계
SELECT
  pay_method,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM orders
WHERE status = 'paid'
GROUP BY pay_method
ORDER BY total_amount DESC;

-- ============================================
-- 결제 취소 관련 쿼리
-- ============================================

-- 11. 모든 취소 내역 조회
SELECT
  pc.id,
  o.order_id,
  o.customer_name,
  pc.cancel_type,
  pc.cancel_amount,
  pc.status,
  pc.created_at
FROM payment_cancellations pc
JOIN orders o ON pc.order_id = o.id
ORDER BY pc.created_at DESC;

-- 12. 취소 상태별 통계
SELECT
  cancel_type,
  status,
  COUNT(*) as count,
  SUM(cancel_amount) as total_amount
FROM payment_cancellations
GROUP BY cancel_type, status;

-- 13. 환불 대기 중인 취소 조회
SELECT
  pc.*,
  o.order_id,
  o.customer_name,
  o.customer_phone
FROM payment_cancellations pc
JOIN orders o ON pc.order_id = o.id
WHERE pc.status = 'pending' AND pc.cancel_type = 'request'
ORDER BY pc.created_at ASC;

-- ============================================
-- 정기결제 관련 쿼리
-- ============================================

-- 14. 활성화된 정기결제 조회
SELECT
  rp.*,
  o.customer_name,
  o.customer_phone
FROM recurring_payments rp
JOIN orders o ON rp.order_id = o.id
WHERE rp.status = 'active'
ORDER BY rp.next_billing_date ASC;

-- 15. 다음 결제 예정인 정기결제
SELECT
  rp.*,
  o.customer_name,
  o.customer_phone
FROM recurring_payments rp
JOIN orders o ON rp.order_id = o.id
WHERE rp.status = 'active'
  AND rp.next_billing_date <= NOW() + INTERVAL '1 day'
ORDER BY rp.next_billing_date ASC;

-- 16. 정기결제 해지 현황
SELECT
  status,
  COUNT(*) as count
FROM recurring_payments
GROUP BY status;

-- ============================================
-- 결제 로그 관련 쿼리
-- ============================================

-- 17. 모든 결제 로그 조회
SELECT
  pl.*,
  o.order_id,
  o.customer_name
FROM payment_logs pl
JOIN orders o ON pl.order_id = o.id
ORDER BY pl.created_at DESC
LIMIT 100;

-- 18. 시간대별 결제 활동
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  action,
  COUNT(*) as count
FROM payment_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), action
ORDER BY hour DESC;

-- 19. 결제 오류 로그
SELECT
  pl.*,
  o.order_id,
  o.customer_name
FROM payment_logs pl
JOIN orders o ON pl.order_id = o.id
WHERE pl.action LIKE '%failed%' OR pl.error_message IS NOT NULL
ORDER BY pl.created_at DESC
LIMIT 50;

-- ============================================
-- 종합 분석 쿼리
-- ============================================

-- 20. 일일 결제 통계
SELECT
  DATE(o.created_at) as payment_date,
  COUNT(DISTINCT o.id) as total_orders,
  SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN o.status = 'failed' THEN 1 ELSE 0 END) as failed_orders,
  SUM(CASE WHEN o.status = 'paid' THEN o.amount ELSE 0 END) as paid_amount
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY payment_date DESC;

-- 21. 신청부터 결제까지의 전체 흐름
SELECT
  ca.id as app_id,
  ca.name,
  ca.contact,
  ca.status as app_status,
  o.order_id,
  o.amount,
  o.status as order_status,
  o.pay_method,
  o.paid_at,
  pc.id as cancel_id,
  pc.cancel_type,
  pc.status as cancel_status
FROM certificate_applications ca
LEFT JOIN orders o ON ca.id = o.application_id
LEFT JOIN payment_cancellations pc ON o.id = pc.order_id
ORDER BY ca.created_at DESC;

-- 22. 고객별 결제 이력
SELECT
  o.customer_name,
  o.customer_phone,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN o.status = 'paid' THEN o.amount ELSE 0 END) as total_paid_amount,
  MAX(o.paid_at) as last_payment_date
FROM orders o
GROUP BY o.customer_name, o.customer_phone
ORDER BY total_paid_amount DESC;

-- 23. 월별 수익 현황
SELECT
  DATE_TRUNC('month', o.paid_at)::DATE as month,
  COUNT(o.id) as order_count,
  SUM(o.amount) as revenue,
  AVG(o.amount) as avg_order_value
FROM orders o
WHERE o.status = 'paid'
GROUP BY DATE_TRUNC('month', o.paid_at)
ORDER BY month DESC;

-- 24. 자격증별 매출
SELECT
  cert,
  COUNT(DISTINCT ca.id) as applicant_count,
  COUNT(DISTINCT CASE WHEN o.status = 'paid' THEN o.id END) as paid_orders,
  SUM(CASE WHEN o.status = 'paid' THEN 100000 ELSE 0 END) as revenue
FROM certificate_applications ca,
LATERAL UNNEST(ca.certificates) as cert
LEFT JOIN orders o ON ca.id = o.application_id
GROUP BY cert
ORDER BY revenue DESC;

-- 25. 결제 성공률
SELECT
  DATE(o.created_at) as date,
  COUNT(o.id) as total_orders,
  SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
  ROUND(
    SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END)::NUMERIC /
    COUNT(o.id) * 100,
    2
  ) as success_rate
FROM orders o
GROUP BY DATE(o.created_at)
ORDER BY date DESC;

-- ============================================
-- 유지보수 쿼리
-- ============================================

-- 26. 미완료 신청 목록
SELECT
  ca.id,
  ca.name,
  ca.contact,
  ca.status,
  ca.created_at,
  CASE WHEN o.id IS NULL THEN '미결제' ELSE o.status END as payment_status
FROM certificate_applications ca
LEFT JOIN orders o ON ca.id = o.application_id
WHERE ca.status != 'approved'
ORDER BY ca.created_at DESC;

-- 27. 7일 이상 미결제 신청
SELECT
  ca.*,
  o.order_id,
  CURRENT_DATE - DATE(ca.created_at) as days_pending
FROM certificate_applications ca
LEFT JOIN orders o ON ca.id = o.application_id
WHERE (o.id IS NULL OR o.status NOT IN ('paid'))
  AND CURRENT_DATE - DATE(ca.created_at) >= 7
ORDER BY ca.created_at ASC;

-- 28. 인덱스 상태 확인
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 29. 테이블 크기 확인
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 30. 데이터 정합성 확인 (고아 레코드)
SELECT
  'orders without application' as issue,
  COUNT(*) as count
FROM orders o
WHERE o.application_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM certificate_applications ca WHERE ca.id = o.application_id
  );

-- 31. 자격증 신청 삭제 (주의: 관련 주문도 함께 삭제됨)
-- DELETE FROM certificate_applications WHERE id = 1;

-- 32. 오래된 로그 정리 (3개월 이상)
-- DELETE FROM payment_logs
-- WHERE created_at < NOW() - INTERVAL '3 months';
