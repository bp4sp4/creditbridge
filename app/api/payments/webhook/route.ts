import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/client';

/**
 * PayApp 결제 웹훅
 * PayApp에서 서버로 직접 호출하는 feedbackurl
 * 사용자가 결제 페이지를 닫아도 호출됨
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    const state = body.state; // 1: 성공, 0: 실패
    const tradeid = body.tradeid; // 거래번호
    const mul_no = body.mul_no; // 결제 요청번호
    const var1 = body.var1; // 주문번호
    const price = body.price; // 결제 금액
    const shopname = body.shopname; // 상점명
    const goodname = body.goodname; // 상품명
    const message = body.message; // 메시지
    const paymethod = body.paymethod; // 결제수단

    console.log('Payment webhook received:', {
      state,
      tradeid,
      mul_no,
      orderId: var1,
      price,
      paymethod
    });

    // 데이터베이스에 결제 정보 저장
    if (state === '1') {
      // 결제 성공
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          trade_id: tradeid,
          mul_no: mul_no,
          pay_method: paymethod,
          paid_at: new Date().toISOString()
        })
        .eq('order_id', var1);

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
      }

      // 결제 성공 로그
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('order_id', var1)
        .single();

      if (order) {
        await supabase.from('payment_logs').insert({
          order_id: order.id,
          action: 'payment_success',
          amount: price,
          response_data: body
        });
      }

      // TODO: 결제 완료 이메일 발송, SMS 알림 등의 추가 작업
    } else {
      // 결제 실패
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'failed',
          failed_message: message,
          failed_at: new Date().toISOString()
        })
        .eq('order_id', var1);

      if (updateError) {
        console.error('Database update error:', updateError);
      } else {
        // 결제 실패 로그
        const { data: order } = await supabase
          .from('orders')
          .select('id')
          .eq('order_id', var1)
          .single();

        if (order) {
          await supabase.from('payment_logs').insert({
            order_id: order.id,
            action: 'payment_failed',
            error_message: message,
            response_data: body
          });
        }
      }
    }

    // PayApp에 처리 완료 응답 (200 OK 필수)
    return NextResponse.json({
      success: state === '1',
      message: '웹훅 처리 완료',
      orderId: var1,
      status: state === '1' ? 'paid' : 'failed'
    });

  } catch (error) {
    console.error('Payment webhook error:', error);
    return NextResponse.json(
      { success: false, error: '웹훅 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
