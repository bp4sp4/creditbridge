import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../lib/supabase/client';
import { cancelPayment, requestPaymentCancellation } from '../../../lib/payapp';

/**
 * 결제 취소 요청
 * D+5일 이전 또는 이후에 따라 다른 방식 사용
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    const { orderId, cancelType, cancelAmount, cancelReason, mulNo } = body;

    if (!orderId || !cancelType) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 주문 정보 조회
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (order.status !== 'paid') {
      return NextResponse.json(
        { error: '결제되지 않은 주문입니다.' },
        { status: 400 }
      );
    }

    const payappUserId = process.env.NEXT_PUBLIC_PAYAPP_USER_ID;
    const payappLinkKey = process.env.PAYAPP_LINK_KEY;

    if (!payappUserId || !payappLinkKey) {
      return NextResponse.json(
        { error: 'PayApp 설정이 없습니다.' },
        { status: 500 }
      );
    }

    let cancelResult: any;

    // 취소 유형에 따라 처리
    if (cancelType === 'full') {
      // 전체 취소 (D+5일 이전)
      cancelResult = await cancelPayment({
        userId: payappUserId,
        linkKey: payappLinkKey,
        mulNo: order.mul_no || '',
        cancelMemo: cancelReason || '사용자 요청 취소',
        partCancel: 0,
      });
    } else if (cancelType === 'partial') {
      // 부분 취소 (D+5일 이전)
      if (!cancelAmount) {
        return NextResponse.json(
          { error: '부분 취소 금액이 필요합니다.' },
          { status: 400 }
        );
      }

      cancelResult = await cancelPayment({
        userId: payappUserId,
        linkKey: payappLinkKey,
        mulNo: order.mul_no || '',
        cancelMemo: cancelReason || '부분 취소',
        partCancel: 1,
        cancelPrice: cancelAmount,
      });
    } else if (cancelType === 'request') {
      // 취소 요청 (D+5일 이후 또는 정산 완료)
      cancelResult = await requestPaymentCancellation({
        userId: payappUserId,
        linkKey: payappLinkKey,
        mulNo: order.mul_no || '',
        cancelMemo: cancelReason || '취소 요청',
      });
    }

    if (!cancelResult.success) {
      // 취소 실패 로그
      await supabase.from('payment_logs').insert({
        order_id: order.id,
        action: `cancel_${cancelType}_failed`,
        error_message: cancelResult.error,
      });

      return NextResponse.json(
        { error: cancelResult.error },
        { status: 400 }
      );
    }

    // 취소 정보 저장
    const { data: cancellation, error: insertError } = await supabase
      .from('payment_cancellations')
      .insert({
        order_id: order.id,
        mul_no: order.mul_no || '',
        cancel_type: cancelType,
        cancel_amount: cancelAmount || order.amount,
        cancel_reason: cancelReason,
        status: cancelType === 'request' ? 'pending' : 'approved',
        cancellation_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { error: '취소 정보 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 주문 상태 업데이트
    const newStatus = cancelType === 'request' ? 'paid' : 'cancelled';
    await supabase
      .from('orders')
      .update({
        status: newStatus,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    // 취소 성공 로그
    await supabase.from('payment_logs').insert({
      order_id: order.id,
      action: `cancel_${cancelType}_success`,
      amount: cancelAmount || order.amount,
      response_data: cancelResult,
    });

    return NextResponse.json({
      success: true,
      message: `${cancelType === 'request' ? '취소 요청이 접수' : '결제가 취소'}되었습니다.`,
      data: {
        cancellationId: cancellation.id,
        orderId,
        cancelType,
        cancelAmount: cancelAmount || order.amount,
        status: cancellation.status,
      },
    });
  } catch (error) {
    console.error('Payment cancel error:', error);
    return NextResponse.json(
      { error: '취소 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 취소 내역 조회
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 주문 정보 조회
    const { data: order } = await supabase
      .from('orders')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (!order) {
      return NextResponse.json(
        { error: '주문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 취소 내역 조회
    const { data: cancellations, error: selectError } = await supabase
      .from('payment_cancellations')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });

    if (selectError) {
      return NextResponse.json(
        { error: '취소 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cancellations || [],
    });
  } catch (error) {
    console.error('Payment cancel query error:', error);
    return NextResponse.json(
      { error: '취소 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
