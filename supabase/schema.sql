-- Supabase SQL schema for certificate application
-- Table: certificate_applications
CREATE TABLE IF NOT EXISTS certificate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  birth_prefix text NOT NULL, -- 생년월일 앞자리
  address text NOT NULL,
  certificates text[] NOT NULL, -- 신청 자격증 (복수 선택)
  cash_receipt text, -- 현금영수증 처리번호(계좌이체시)
  photo_url text, -- 카드형 사진 (선택사항)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: admins (for Supabase Auth, but managed via Supabase dashboard)
-- No need to create manually unless you want custom fields.
