-- certificate_applications 테이블에 결제 관련 컬럼 추가

-- address_detail 컬럼 추가 (누락된 경우)
ALTER TABLE certificate_applications
ADD COLUMN IF NOT EXISTS address_main VARCHAR(255),
ADD COLUMN IF NOT EXISTS address_detail VARCHAR(255);

-- 결제 관련 컬럼 추가
ALTER TABLE certificate_applications
ADD COLUMN IF NOT EXISTS order_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, cancelled
ADD COLUMN IF NOT EXISTS trade_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS mul_no VARCHAR(100),
ADD COLUMN IF NOT EXISTS pay_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS failed_message TEXT,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- 제약 조건 추가
ALTER TABLE certificate_applications
ADD CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'paid', 'failed', 'cancelled'));

-- 결제 관련 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cert_app_order_id ON certificate_applications(order_id);
CREATE INDEX IF NOT EXISTS idx_cert_app_payment_status ON certificate_applications(payment_status);
CREATE INDEX IF NOT EXISTS idx_cert_app_paid_at ON certificate_applications(paid_at);
CREATE INDEX IF NOT EXISTS idx_cert_app_trade_id ON certificate_applications(trade_id);

-- 결제 로그 테이블
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES certificate_applications(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- payment_requested, payment_success, payment_failed, cancel_requested, cancel_success, cancel_failed
  amount INTEGER,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 결제 로그 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_logs_app_id ON payment_logs(app_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_action ON payment_logs(action);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- 결제 취소 테이블
CREATE TABLE IF NOT EXISTS payment_cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES certificate_applications(id) ON DELETE CASCADE,
  mul_no VARCHAR(100) NOT NULL,
  cancel_type VARCHAR(50) NOT NULL, -- full, partial, request
  cancel_amount INTEGER NOT NULL,
  cancel_reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  cancelled_mul_no VARCHAR(100),
  cancellation_date TIMESTAMP WITH TIME ZONE,
  payback_amount INTEGER,
  payback_bank VARCHAR(100),
  payback_account VARCHAR(50),
  payback_account_holder VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_cancel_type CHECK (cancel_type IN ('full', 'partial', 'request')),
  CONSTRAINT valid_cancel_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- 결제 취소 인덱스
CREATE INDEX IF NOT EXISTS idx_payment_cancellations_app_id ON payment_cancellations(app_id);
CREATE INDEX IF NOT EXISTS idx_payment_cancellations_status ON payment_cancellations(status);
CREATE INDEX IF NOT EXISTS idx_payment_cancellations_created_at ON payment_cancellations(created_at);

-- RLS 정책 활성화
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_cancellations ENABLE ROW LEVEL SECURITY;
