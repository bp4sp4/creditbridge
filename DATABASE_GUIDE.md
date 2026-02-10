# 데이터베이스 설정 가이드

이 문서는 Supabase 데이터베이스 설정 및 자격증 신청, 결제 시스템 통합 방법을 설명합니다.

## 목차
1. [데이터베이스 생성](#데이터베이스-생성)
2. [테이블 구조](#테이블-구조)
3. [자격증 신청 통합](#자격증-신청-통합)
4. [결제 시스템 통합](#결제-시스템-통합)
5. [타입 정의](#타입-정의)

## 데이터베이스 생성

### Supabase에서 테이블 생성

1. **Supabase 콘솔 접속**
   - https://app.supabase.com 에서 프로젝트 선택

2. **SQL 에디터에서 마이그레이션 실행**
   - 좌측 메뉴 → SQL Editor → New Query
   - `database/migrations/001_create_tables.sql` 파일의 내용 복사
   - 쿼리 실행

또는

3. **Supabase CLI 사용**
```bash
supabase migration up
```

## 테이블 구조

### certificate_applications (자격증 신청)
```sql
- id: BIGINT (PK) - 신청 ID
- name: VARCHAR - 신청자 이름
- contact: VARCHAR - 연락처
- birth_prefix: VARCHAR - 생년월일 (YYMMDD)
- address: TEXT - 전체 주소
- address_main: VARCHAR - 기본 주소
- address_detail: VARCHAR - 상세 주소
- certificates: TEXT[] - 선택한 자격증 목록
- photo_url: TEXT - 증명사진 URL
- cash_receipt: VARCHAR - 현금영수증
- status: VARCHAR - 상태 (pending, submitted, approved, rejected)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### orders (주문/결제)
```sql
- id: BIGINT (PK) - 주문 ID
- order_id: VARCHAR - 주문 번호 (고유)
- amount: INTEGER - 결제 금액
- order_name: VARCHAR - 주문명
- customer_name: VARCHAR - 고객명
- customer_phone: VARCHAR - 고객 연락처
- status: VARCHAR - 상태 (pending, paid, failed, cancelled)
- trade_id: VARCHAR - PayApp 거래번호
- mul_no: VARCHAR - PayApp 결제요청번호
- pay_method: VARCHAR - 결제수단
- paid_at: TIMESTAMP - 결제 시간
- failed_at: TIMESTAMP - 실패 시간
- failed_message: TEXT - 실패 메시지
- cancelled_at: TIMESTAMP - 취소 시간
- application_id: BIGINT (FK) - 자격증 신청 ID
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### payment_cancellations (결제 취소)
```sql
- id: BIGINT (PK) - 취소 ID
- order_id: BIGINT (FK) - 주문 ID
- mul_no: VARCHAR - PayApp 결제요청번호
- cancel_type: VARCHAR - 취소 유형 (full, partial, request)
- cancel_amount: INTEGER - 취소 금액
- cancel_reason: TEXT - 취소 사유
- status: VARCHAR - 상태 (pending, approved, rejected)
- cancelled_mul_no: VARCHAR - 취소 결과 번호
- cancellation_date: TIMESTAMP - 취소 일시
- payback_amount: INTEGER - 환불 금액
- payback_bank: VARCHAR - 환불 은행
- payback_account: VARCHAR - 환불 계좌
- payback_account_holder: VARCHAR - 환불 계좌주
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### recurring_payments (정기결제)
```sql
- id: BIGINT (PK) - 정기결제 ID
- order_id: BIGINT (FK) - 주문 ID
- rebill_no: VARCHAR - PayApp 정기결제번호 (고유)
- amount: INTEGER - 결제 금액
- billing_cycle: VARCHAR - 결제 주기 (monthly, yearly)
- status: VARCHAR - 상태 (active, cancelled, completed)
- next_billing_date: TIMESTAMP - 다음 결제 예정일
- last_paid_at: TIMESTAMP - 마지막 결제 시간
- cancelled_at: TIMESTAMP - 취소 시간
- cancellation_reason: TEXT - 취소 사유
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### payment_logs (결제 로그)
```sql
- id: BIGINT (PK) - 로그 ID
- order_id: BIGINT (FK) - 주문 ID
- action: VARCHAR - 액션 (payment_requested, payment_success, payment_failed, cancel_requested, etc)
- amount: INTEGER - 금액
- request_data: JSONB - 요청 데이터
- response_data: JSONB - 응답 데이터
- error_message: TEXT - 오류 메시지
- ip_address: INET - IP 주소
- user_agent: TEXT - User Agent
- created_at: TIMESTAMP
```

## 자격증 신청 통합

### 신청 흐름

1. **사용자 정보 입력** (Step 2)
   - 이름, 연락처, 생년월일, 주소 등 입력
   - 자격증 선택

2. **신청 제출**
   - `handleSubmit()` 함수 실행
   - certificate_applications 테이블에 데이터 저장

3. **결제 처리**
   - orders 테이블에 주문 정보 저장
   - PayApp SDK로 결제 실행

4. **결제 콜백**
   - PayApp에서 콜백으로 결과 반환
   - orders 테이블 상태 업데이트
   - payment_logs에 로그 기록

### 코드 예시

```typescript
// CertificateApplicationForm.tsx의 handleSubmit()
const { data: applicationData } = await supabase
  .from('certificate_applications')
  .insert([{
    name: formData.name,
    contact: formData.contact,
    birth_prefix: formData.birth_prefix,
    address: formData.address,
    address_main: formData.addressMain,
    address_detail: formData.addressDetail,
    certificates: formData.certificates,
    photo_url,
    status: 'submitted'
  }])
  .select()
  .single();
```

## 결제 시스템 통합

### 결제 흐름

```
사용자 신청
    ↓
[POST /api/payments]
 → orders 테이블에 pending 상태로 저장
 → PayApp SDK 로드
 → PayApp 결제 페이지로 이동
    ↓
사용자 결제 완료
    ↓
[GET /api/payments/result] (사용자 리다이렉트)
 ↓ [POST /api/payments/webhook] (PayApp 서버 콜백)
 → orders 테이블 상태 업데이트 (paid/failed)
 → payment_logs에 로그 기록
    ↓
결제 완료
```

### 결제 취소 흐름

```
사용자 취소 요청
    ↓
[POST /api/payments/cancel]
 → orders 테이블에서 paid 상태 확인
 → PayApp API로 취소 처리
 → payment_cancellations에 취소 정보 저장
 → orders 상태 업데이트 (cancelled)
    ↓
취소 완료
```

## 타입 정의

`lib/supabase/types.ts`에서 모든 테이블의 타입이 정의되어 있습니다.

### 타입 사용 예시

```typescript
import type { Orders, Certificate_applications } from '@/lib/supabase/types';

// 주문 조회
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('order_id', orderId)
  .single() as { data: Orders };

// 신청 조회
const { data: app } = await supabase
  .from('certificate_applications')
  .select('*')
  .eq('id', appId)
  .single() as { data: Certificate_applications };
```

## API 엔드포인트

### 결제 API

#### 1. 결제 요청 생성
```
POST /api/payments

요청:
{
  "amount": 100000,
  "orderName": "자격증 취득 신청",
  "customerName": "홍길동",
  "customerPhone": "010-1234-5678",
  "applicationId": 1
}

응답:
{
  "success": true,
  "data": {
    "orderId": "CERT-1707xxx",
    "amount": 100000,
    "orderName": "자격증 취득 신청",
    "status": "pending"
  },
  "paymentUrl": "https://..."
}
```

#### 2. 결제 내역 조회
```
GET /api/payments?orderId=CERT-1707xxx

응답:
{
  "success": true,
  "data": {
    "id": 1,
    "order_id": "CERT-1707xxx",
    "status": "paid",
    "trade_id": "거래번호",
    "paid_at": "2024-02-10T12:00:00Z"
  }
}
```

#### 3. 결제 취소
```
POST /api/payments/cancel

요청:
{
  "orderId": "CERT-1707xxx",
  "cancelType": "full", // full, partial, request
  "cancelAmount": 100000,
  "cancelReason": "고객 요청"
}

응답:
{
  "success": true,
  "message": "결제가 취소되었습니다.",
  "data": {
    "cancellationId": 1,
    "orderId": "CERT-1707xxx",
    "cancelType": "full",
    "cancelAmount": 100000,
    "status": "approved"
  }
}
```

#### 4. 취소 내역 조회
```
GET /api/payments/cancel?orderId=CERT-1707xxx

응답:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cancel_type": "full",
      "cancel_amount": 100000,
      "status": "approved",
      "created_at": "2024-02-10T12:00:00Z"
    }
  ]
}
```

## 자주 묻는 질문

### Q: 자격증 신청과 결제를 분리할 수 있나요?
A: 가능합니다. `certificate_applications`과 `orders`는 `application_id`로 연결되지만 독립적입니다. 신청만 저장하고 나중에 결제하도록 수정할 수 있습니다.

### Q: 환불은 어떻게 처리하나요?
A: `payment_cancellations` 테이블에서 `cancel_type`에 따라:
- `full`: D+5일 이전 전체 취소
- `partial`: D+5일 이전 부분 취소
- `request`: D+5일 이후 취소 요청 (승인 필요)

### Q: 정기결제는 어떻게 설정하나요?
A: `recurring_payments` 테이블에 정기결제 정보를 저장합니다. 현재는 구현되지 않았지만 `billing_cycle`, `next_billing_date` 등으로 관리할 수 있습니다.

## 보안 주의사항

1. **RLS 정책 설정**: 각 테이블에 RLS 정책을 설정하여 사용자가 자신의 데이터만 접근하도록 제한
2. **민감한 정보**: `payment_logs`의 `request_data`, `response_data`에 민감한 정보를 저장하지 않도록 주의
3. **감시**: `payment_logs`를 정기적으로 검토하여 비정상 거래 확인

## 참고 자료

- [Supabase 문서](https://supabase.com/docs)
- [PayApp 문서](https://www.payapp.kr)
