-- 자격증 신청 테이블
CREATE TABLE certificate_applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  contact VARCHAR(20) NOT NULL,
  birth_prefix VARCHAR(6) NOT NULL,
  address TEXT NOT NULL,
  address_main VARCHAR(255) NOT NULL,
  address_detail VARCHAR(255),
  certificates TEXT[] NOT NULL,
  photo_url TEXT,
  cash_receipt VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'submitted', 'approved', 'rejected'))
);

-- 주문/결제 테이블
CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  order_name VARCHAR(255) NOT NULL,
  product_type VARCHAR(50),
  billing_cycle VARCHAR(50),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, paid, failed, cancelled
  trade_id VARCHAR(100) UNIQUE,
  mul_no VARCHAR(100),
  pay_method VARCHAR(50), -- 카드, 계좌이체, 핸드폰, 쿠폰, 포인트
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  failed_message TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  application_id BIGINT REFERENCES certificate_applications(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'paid', 'failed', 'cancelled'))
);

-- 결제 취소 테이블
CREATE TABLE payment_cancellations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
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
  CONSTRAINT valid_cancel_type CHECK (cancel_type IN ('full', 'partial', 'request'))
);

-- 정기결제 테이블
CREATE TABLE recurring_payments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  rebill_no VARCHAR(100) UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  billing_cycle VARCHAR(50) NOT NULL, -- monthly, yearly, etc
  status VARCHAR(50) DEFAULT 'active', -- active, cancelled, completed
  next_billing_date TIMESTAMP WITH TIME ZONE,
  last_paid_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (status IN ('active', 'cancelled', 'completed'))
);

-- 결제 이력 테이블
CREATE TABLE payment_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- payment_requested, payment_success, payment_failed, cancel_requested, cancel_success, cancel_failed
  amount INTEGER,
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_application_id ON orders(application_id);
CREATE INDEX idx_payment_cancellations_order_id ON payment_cancellations(order_id);
CREATE INDEX idx_payment_cancellations_status ON payment_cancellations(status);
CREATE INDEX idx_recurring_payments_order_id ON recurring_payments(order_id);
CREATE INDEX idx_recurring_payments_status ON recurring_payments(status);
CREATE INDEX idx_payment_logs_order_id ON payment_logs(order_id);
CREATE INDEX idx_payment_logs_created_at ON payment_logs(created_at);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE certificate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_cancellations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
