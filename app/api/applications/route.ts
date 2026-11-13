import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    // [선택] 광고성 정보 수신 동의 — 화면이 보낸 marketingAgreed 를 DB 칸으로 옮긴다.
    // 참일 때만 동의 시각을 남기고, 몸통에 marketing_agreed* 가 직접 와도 이 값으로 덮어쓴다 (정보통신망법 제50조)
    const { marketingAgreed, ...rest } = body ?? {};
    const agreed = marketingAgreed === true;
    const row = {
      ...rest,
      marketing_agreed: agreed,
      marketing_agreed_at: agreed ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('certificate_applications')
      .insert([row])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: '신청 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    const supabase = createClient();
    const { data, error } = await supabase
      .from('certificate_applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: '수정 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    const supabase = createClient();
    const { error } = await supabase
      .from('certificate_applications')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '삭제 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
