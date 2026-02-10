# PayApp 결제 연동 가이드

이 문서는 PayApp 결제 시스템 연동 방법을 설명합니다.

## 목차
1. [환경 설정](#환경-설정)
2. [결제 기능](#결제-기능)
3. [API 엔드포인트](#api-엔드포인트)
4. [클라이언트 사용](#클라이언트-사용)
5. [결제 취소](#결제-취소)

## 환경 설정

### 필수 환경 변수

`.env.local` 파일에 다음 환경 변수를 설정하세요:

```env
# PayApp 계정 정보
NEXT_PUBLIC_PAYAPP_USER_ID=your-payapp-user-id
NEXT_PUBLIC_PAYAPP_SHOP_NAME=your-shop-name
PAYAPP_LINK_KEY=your-payapp-link-key

# 애플리케이션 기본 URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # 프로덕션에서는 실제 도메인
```

## 결제 기능

### 1. 결제 요청 생성

**엔드포인트**: `POST /api/payments`

**요청 본문**:
```json
{
  "amount": 100000,
  "orderName": "상품명",
  "customerName": "고객명",
  "customerPhone": "010-1234-5678",
  "orderId": "ORDER-123456" // 선택사항
}
```

**응답**:
```json
{
  "success": true,
  "message": "결제 요청이 생성되었습니다.",
  "data": {
    "orderId": "ORDER-123456",
    "amount": 100000,
    "orderName": "상품명",
    "status": "pending"
  },
  "paymentUrl": "https://api.payapp.kr/order/order_pay.php?..."
}
```

### 2. 결제 결과 콜백

**엔드포인트**: `GET/POST /api/payments/result`

PayApp에서 결제 완료 후 사용자를 이 URL로 리다이렉트합니다.

**쿼리 파라미터**:
- `state`: 결제 상태 (1: 성공, 0: 실패)
- `tradeid`: 거래번호
- `mul_no`: 결제 요청번호
- `var1`: 주문번호

### 3. 결제 웹훅

**엔드포인트**: `POST /api/payments/webhook`

PayApp에서 서버로 직접 호출합니다. 사용자가 결제 페이지를 닫아도 호출됩니다.

**웹훅 본문**:
```json
{
  "state": 1,
  "tradeid": "거래번호",
  "mul_no": "결제요청번호",
  "var1": "주문번호",
  "price": 100000,
  "paymethod": "카드" 또는 "계좌이체" 등
}
```

## API 엔드포인트

### 결제 조회

**엔드포인트**: `GET /api/payments?orderId=ORDER-123456`

### 결제 취소 (D+5일 이전, 정산 전)

라이브러리 함수 사용:
```typescript
import { cancelPayment } from '@/lib/payapp';

const result = await cancelPayment({
  userId: 'payapp-user-id',
  linkKey: 'payapp-link-key',
  mulNo: '결제요청번호',
  cancelMemo: '취소 사유',
  partCancel: 0, // 0: 전체 취소, 1: 부분 취소
  cancelPrice: 50000, // 부분 취소 금액 (부분 취소인 경우만)
});
```

### 부분 결제 취소

```typescript
const result = await cancelPayment({
  userId: 'payapp-user-id',
  linkKey: 'payapp-link-key',
  mulNo: '결제요청번호',
  cancelMemo: '부분 취소',
  partCancel: 1,
  cancelPrice: 50000,
  cancelTaxable: 45455, // 과세 공급가액
  cancelVat: 4545, // 부가세
  cancelTaxfree: 0, // 면세 공급가액
});
```

### 정기결제 해지

```typescript
import { cancelRebill } from '@/lib/payapp';

const result = await cancelRebill({
  userId: 'payapp-user-id',
  linkKey: 'payapp-link-key',
  rebillNo: '정기결제등록번호',
});
```

### 결제 취소 요청 (D+5일 이후 또는 정산 완료)

```typescript
import { requestPaymentCancellation } from '@/lib/payapp';

const result = await requestPaymentCancellation({
  userId: 'payapp-user-id',
  linkKey: 'payapp-link-key',
  mulNo: '결제요청번호',
  cancelMemo: '취소 사유',
  dpName: '입금자명', // 환불 받을 사람 이름
});
```

## 클라이언트 사용

### PaymentButton 컴포넌트 사용

```tsx
import PaymentButton from '@/components/PaymentButton';

export default function CheckoutPage() {
  const handlePaymentSuccess = (result: any) => {
    console.log('결제 성공:', result);
    // 결제 성공 로직
  };

  const handlePaymentError = (error: string) => {
    console.error('결제 실패:', error);
    // 결제 실패 로직
  };

  return (
    <PaymentButton
      amount={100000}
      orderName="자격증 취득 신청"
      customerName="홍길동"
      customerPhone="010-1234-5678"
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
      className="btn btn-primary"
    />
  );
}
```

### usePayment 훅 사용

```tsx
import { usePayment } from '@/hooks/usePayment';

export default function CancelPage() {
  const { state, handleCancel } = usePayment();

  const handleCancelPayment = async () => {
    const result = await handleCancel(
      'payapp-user-id',
      'payapp-link-key',
      'mul-no-from-order',
      '고객 요청으로 취소'
    );

    if (result.success) {
      alert('결제가 취소되었습니다.');
    } else {
      alert(`취소 실패: ${result.error}`);
    }
  };

  return (
    <button onClick={handleCancelPayment} disabled={state.loading}>
      {state.loading ? '처리 중...' : '결제 취소'}
    </button>
  );
}
```

## PayApp SDK 직접 로드

```typescript
import { loadPayAppSDK } from '@/lib/payapp';

// SDK 로드
await loadPayAppSDK({ retries: 3, timeout: 8000 });

// SDK 사용
const PayApp = (window as any).PayApp;
PayApp.link({
  userid: 'your-user-id',
  goodname: '상품명',
  price: 100000,
  recvname: '고객명',
  recvphone: '010-1234-5678',
  var1: 'ORDER-123456',
  returnurl: 'https://yoursite.com/api/payments/result',
  feedbackurl: 'https://yoursite.com/api/payments/webhook',
});
```

## 주요 상태 코드

| 상태 | 의미 |
|------|------|
| 1 | 성공 |
| 0 | 실패 |

## 결제 수단

- 신용카드
- 계좌이체
- 핸드폰
- 쿠폰
- 포인트

## 보안 유의사항

1. **환경 변수**: `PAYAPP_LINK_KEY`는 서버에서만 사용하세요
2. **HTTPS**: 프로덕션에서는 반드시 HTTPS를 사용하세요
3. **거래 검증**: 결제 결과는 항상 서버에서 검증하세요
4. **웹훅 검증**: 웹훅을 받을 때 진정성을 검증하세요

## 트러블슈팅

### PayApp SDK 로드 실패
- 네트워크 연결 확인
- HTTPS 사용 여부 확인
- 브라우저 콘솔에서 에러 메시지 확인

### 결제 취소 실패
- 결제 후 D+5일 이내인지 확인
- 정산 전인지 확인
- 올바른 거래번호 입력 확인

### 웹훅이 호출되지 않음
- PayApp 관리자 페이지에서 웹훅 URL 설정 확인
- HTTPS 사용 여부 확인
- 방화벽/보안 설정 확인

## 참고 자료

- [PayApp 공식 문서](https://www.payapp.kr)
- [PayApp Lite SDK 가이드](https://lite.payapp.kr)
