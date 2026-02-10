import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * PayApp 결제 결과 콜백
 * 사용자가 결제 후 돌아오는 returnurl
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const supabase = createClient();

    // PayApp에서 넘어오는 결제 결과 파라미터
    const state = searchParams.get('state'); // 결제 결과 상태 (1:성공, 0:실패)
    const tradeid = searchParams.get('tradeid'); // 거래번호
    const mul_no = searchParams.get('mul_no'); // 결제 요청번호
    const var1 = searchParams.get('var1'); // 우리가 보낸 주문번호
    const message = searchParams.get('message'); // 결과 메시지

    // 결제 성공 여부 확인
    if (state === '1') {
      // 데이터베이스 업데이트 - 결제 성공 (certificate_applications 테이블)
      const { error: updateError, data: appData } = await supabase
        .from('certificate_applications')
        .update({
          payment_status: 'paid',
          trade_id: tradeid,
          mul_no: mul_no,
          paid_at: new Date().toISOString()
        })
        .eq('order_id', var1)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
      } else if (appData) {
        // 결제 로그 기록
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_success',
          amount: parseInt(searchParams.get('price') || '0'),
          response_data: {
            state,
            tradeid,
            mul_no,
            message
          }
        });
      }

      // 결제 완료 - Step 3로 리다이렉트
      return NextResponse.redirect(new URL(`/?payment=success&step=3`, request.url));
    } else {
      // 데이터베이스 업데이트 - 결제 실패
      const { error: updateError, data: appData } = await supabase
        .from('certificate_applications')
        .update({
          payment_status: 'failed',
          failed_at: new Date().toISOString(),
          failed_message: message
        })
        .eq('order_id', var1)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
      } else if (appData) {
        // 결제 실패 로그 기록
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_failed',
          error_message: message,
          response_data: {
            state,
            tradeid,
            mul_no,
            message
          }
        });
      }

      // 결제 실패
      return NextResponse.redirect(new URL(`/?payment=failed&orderId=${var1}&message=${encodeURIComponent(message || '결제 실패')}`, request.url));
    }
  } catch (error) {
    console.error('Payment result error:', error);
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}

export async function POST(request: NextRequest) {
  // PayApp이 form-urlencoded로 전송하는 경우 처리
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const supabase = createClient();

    const state = params.get('state'); // 1: 성공, 0: 실패
    const tradeid = params.get('tradeid'); // 거래번호
    const mul_no = params.get('mul_no'); // 결제 요청번호
    const var1 = params.get('var1'); // 주문번호
    const message = params.get('message'); // 메시지
    const price = params.get('price'); // 결제 금액

    // 데이터베이스에 결제 결과 저장
    if (state === '1') {
      const { error: updateError, data: appData } = await supabase
        .from('certificate_applications')
        .update({
          payment_status: 'paid',
          trade_id: tradeid,
          mul_no: mul_no,
          paid_at: new Date().toISOString()
        })
        .eq('order_id', var1)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      if (appData) {
        // 결제 성공 로그
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_success',
          amount: parseInt(price || '0'),
          response_data: Object.fromEntries(params)
        });
      }

      return NextResponse.json({
        success: true,
        message: '결제가 완료되었습니다.',
        data: {
          tradeid,
          mul_no,
          orderId: var1,
          status: 'paid'
        }
      });
    } else {
      const { error: updateError, data: appData } = await supabase
        .from('certificate_applications')
        .update({
          payment_status: 'failed',
          failed_at: new Date().toISOString(),
          failed_message: message
        })
        .eq('order_id', var1)
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }

      if (appData) {
        // 결제 실패 로그
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_failed',
          error_message: message,
          response_data: Object.fromEntries(params)
        });
      }

      return NextResponse.json({
        success: false,
        message: message || '결제가 실패했습니다.',
        data: {
          tradeid,
          mul_no,
          orderId: var1,
          status: 'failed'
        }
      });
    }
  } catch (error) {
    console.error('Payment result POST error:', error);
    return NextResponse.json(
      { success: false, error: '결제 결과 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
