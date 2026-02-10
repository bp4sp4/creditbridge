# Supabase 데이터베이스 설정 가이드

## 초기 설정

### 1. Supabase 프로젝트 생성

1. [Supabase 홈페이지](https://supabase.com)에서 가입
2. 새 프로젝트 생성
3. Database Password 설정 (안전하게 보관)
4. 프로젝트 생성 대기 (약 2-3분)

### 2. 환경 변수 설정

프로젝트 설정에서 다음 정보 복사:

```env
# .env.local에 추가
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 데이터베이스 테이블 생성

### 방법 1: SQL 에디터에서 직접 실행 (권장)

1. Supabase 콘솔 → **SQL Editor**
2. **New Query** 클릭
3. 다음 파일의 내용 복사:
   - `/database/migrations/001_create_tables.sql`
4. 전체 SQL 붙여넣기
5. **Run** 버튼 클릭

### 방법 2: Supabase CLI 사용

```bash
# CLI 설치 (이미 설치된 경우 건너뛰기)
npm install -g supabase

# 프로젝트 연결
supabase link --project-ref your-project-ref

# 마이그레이션 실행
supabase migration up
```

### 생성되는 테이블

| 테이블명 | 용도 |
|---------|------|
| `certificate_applications` | 자격증 신청 정보 |
| `orders` | 결제 주문 정보 |
| `payment_cancellations` | 결제 취소 내역 |
| `recurring_payments` | 정기결제 정보 |
| `payment_logs` | 결제 로그 |

## 저장소(Storage) 설정

### 증명사진 저장소 생성

1. Supabase 콘솔 → **Storage**
2. **New Bucket** 클릭
3. Bucket 이름: `photos`
4. 접근성: **Private** 선택
5. **Create bucket** 클릭

### 정책 설정 (선택사항)

증명사진을 공개하려면:

1. Bucket → `photos` → **Policies**
2. **Add policy**
3. "Enable read access to everyone" 선택

## RLS (Row Level Security) 정책 설정

기본적으로 RLS가 활성화되어 있습니다. 필요에 따라 정책을 추가하세요.

### 예: 사용자는 자신의 신청만 조회

```sql
CREATE POLICY "Users can view their own applications"
ON certificate_applications
FOR SELECT
USING (auth.uid()::text = contact);
```

## 데이터 조회 및 관리

### Supabase 콘솔에서 데이터 조회

1. **Table Editor** 클릭
2. 테이블 선택
3. 데이터 조회 및 편집

### SQL 쿼리 실행

`/database/queries.sql` 파일의 쿼리들을 사용하세요:

#### 예: 모든 주문 조회
```sql
SELECT * FROM orders ORDER BY created_at DESC;
```

#### 예: 결제된 주문만
```sql
SELECT * FROM orders WHERE status = 'paid' ORDER BY paid_at DESC;
```

#### 예: 일일 매출 현황
```sql
SELECT
  DATE(paid_at) as date,
  COUNT(*) as orders,
  SUM(amount) as revenue
FROM orders
WHERE status = 'paid'
GROUP BY DATE(paid_at)
ORDER BY date DESC;
```

## 백업 및 복구

### 자동 백업 설정

1. Supabase 콘솔 → **Backups**
2. Backup frequency 설정
3. 백업 보관 기간 설정

### 수동 백업

```bash
# 데이터 내보내기
supabase db pull

# 데이터 가져오기
supabase db push
```

## 성능 최적화

### 인덱스 확인

이미 다음 인덱스가 생성되어 있습니다:

```sql
- idx_orders_order_id
- idx_orders_customer_phone
- idx_orders_status
- idx_orders_created_at
- idx_orders_application_id
- idx_payment_cancellations_order_id
- idx_payment_cancellations_status
- idx_recurring_payments_order_id
- idx_recurring_payments_status
- idx_payment_logs_order_id
- idx_payment_logs_created_at
```

### 추가 인덱스 생성 (필요시)

```sql
-- 자격증 검색 최적화
CREATE INDEX idx_certificate_applications_name
ON certificate_applications(name);

CREATE INDEX idx_certificate_applications_contact
ON certificate_applications(contact);
```

## 보안 설정

### 1. API 키 보안

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 공개 가능 (읽기 권한만)
- `SUPABASE_SERVICE_ROLE_KEY`: 비공개 (서버에서만 사용)

### 2. Row Level Security (RLS) 활성화

모든 테이블에 RLS가 활성화되어 있습니다.
필요한 정책을 추가하여 데이터 접근 제어하세요.

### 3. 정규식 검증

Supabase 콘솔 → **Auth** → **Policies**에서 추가 설정 가능

## 모니터링

### 데이터베이스 사용량 확인

1. Supabase 콘솔 → **Settings** → **Usage**
2. 데이터 용량, API 호출 수 등 확인

### 쿼리 성능 분석

```sql
-- 느린 쿼리 확인
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE db = current_database()
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## 문제 해결

### 1. "Permission denied" 에러

**원인**: RLS 정책이 막고 있음
**해결**: SQL Editor에서 정책 검토 및 수정

### 2. 연결 시간 초과

**원인**: 네트워크 문제 또는 데이터베이스 과부하
**해결**: 연결 풀 설정 확인, 쿼리 최적화

### 3. 데이터 용량 초과

**원인**: 저장 공간 부족
**해결**: 오래된 로그 정리
```sql
DELETE FROM payment_logs
WHERE created_at < NOW() - INTERVAL '3 months';
```

## 유용한 명령어

### Supabase CLI 명령어

```bash
# 프로젝트 상태 확인
supabase status

# 로컬 개발 환경 시작
supabase start

# 로컬 환경 종료
supabase stop

# 데이터베이스 초기화
supabase db reset

# 마이그레이션 생성
supabase migration new create_my_table

# 마이그레이션 실행
supabase migration up
```

## 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정 (.env.local)
- [ ] 데이터베이스 테이블 생성
- [ ] Storage 버킷 생성 (photos)
- [ ] RLS 정책 설정
- [ ] 백업 설정
- [ ] 모니터링 도구 설정
- [ ] 성능 최적화 (인덱스 확인)

## 참고 자료

- [Supabase 공식 문서](https://supabase.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Supabase CLI 가이드](https://supabase.com/docs/reference/cli)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
