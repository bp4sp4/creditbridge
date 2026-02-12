import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 슬랙 알림 함수
async function sendSlackNotification(data: {
  name: string;
  amount: number;
  mul_no: string;
  payment_status: 'paid' | 'failed';
}) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    console.log('Slack webhook URL이 설정되지 않았습니다');
    return;
  }

  try {
    const message = {
      text: `결제 ${data.payment_status === 'paid' ? '완료' : '실패'} 알림`,
      attachments: [
        {
          color: data.payment_status === 'paid' ? '#28A745' : '#EE5A6F',
          fields: [
            {
              title: '신청자',
              value: data.name,
              short: true,
            },
            {
              title: '결제 금액',
              value: `${data.amount.toLocaleString()}원`,
              short: true,
            },
            {
              title: '결제번호',
              value: data.mul_no || '-',
              short: true,
            },
            {
              title: '상태',
              value: data.payment_status === 'paid' ? '✅ 결제 완료' : '❌ 결제 실패',
              short: true,
            },
            {
              title: '시간',
              value: new Date().toLocaleString('ko-KR'),
              short: false,
            },
          ],
        },
      ],
    };

    await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });
  } catch (error) {
    console.error('Slack 알림 전송 실패:', error);
  }
}

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
    let var1 = searchParams.get('var1'); // 우리가 보낸 주문번호
    const message = searchParams.get('message'); // 결과 메시지

    // 모바일 기기 감지 (먼저)
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // 결제 성공 여부 확인 (state가 명시적으로 '1'일 때만 성공)
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
        const amount = parseInt(searchParams.get('price') || '0');

        // 결제 로그 기록
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_success',
          amount: amount,
          response_data: {
            state,
            tradeid,
            mul_no,
            message
          }
        });

        // 슬랙 알림 전송
        await sendSlackNotification({
          name: appData.name,
          amount: amount,
          mul_no: mul_no || '',
          payment_status: 'paid',
        });
      }

      // 성공 페이지 HTML (모바일, 데스크톱 모두)
      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>결제 완료</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }
      .container {
        text-align: center;
        background: white;
        padding: 60px 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 400px;
        width: 100%;
        animation: slideUp 0.5s ease-out;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .checkmark {
        width: 100px;
        height: 100px;
        margin: 0 auto 30px;
        animation: scaleIn 0.6s ease-out 0.2s both;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      h1 {
        color: #191f28;
        margin: 0 0 15px 0;
        font-size: 28px;
        font-weight: 700;
        line-height: 1.3;
      }
      p {
        color: #888;
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <svg class="checkmark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#667eea" stroke-width="2"/>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#667eea" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="283" style="animation: dash 0.6s ease-in-out 0.3s forwards;"/>
        <path d="M 35 50 L 47 62 L 70 38" stroke="#667eea" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" style="animation: checkmark 0.6s ease-out 0.5s both;"/>
      </svg>
      <h1>결제가 완료되었습니다!</h1>
      <p>잠시 후 페이지가 이동됩니다...</p>
    </div>
    <script>
      var style = document.createElement('style');
      style.innerHTML = \`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes checkmark {
          from {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          to {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }
      \`;
      document.head.appendChild(style);

      if (window.opener) {
        // 팝업 창인 경우: 부모 페이지로 이동 후 닫기
        window.opener.location.href = '/?payment=success&step=3';
        window.close();
      } else {
        // 팝업 아닌 경우: 직접 이동
        window.location.href = '/?payment=success&step=3';
      }
    </script>
  </body>
</html>`;
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } else if (state === '0') {
      // 데이터베이스 업데이트 - 결제 실패 (state가 명시적으로 '0'일 때만)
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

        // 슬랙 알림 전송
        await sendSlackNotification({
          name: appData.name,
          amount: 0,
          mul_no: mul_no || '',
          payment_status: 'failed',
        });
      }

      // 실패 페이지 HTML
      const failHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>결제 실패</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f5f5f5;
        padding: 20px;
      }
      .container {
        text-align: center;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 400px;
        width: 100%;
      }
      h1 {
        color: #d32f2f;
        margin: 0 0 10px 0;
        font-size: 22px;
      }
      p {
        color: #666;
        margin: 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>✗ 결제가 실패했습니다</h1>
      <p>잠시 후 창이 자동으로 닫힙니다...</p>
    </div>
    <script>
      setTimeout(function() {
        window.close();
      }, 3000);
    </script>
  </body>
</html>`;
      return new NextResponse(failHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
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

    // 모바일 기기 감지
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

    // 데이터베이스에 결제 결과 저장 (state가 명시적으로 '1'일 때만 성공)
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
        const amount = parseInt(price || '0');

        // 결제 성공 로그
        await supabase.from('payment_logs').insert({
          app_id: appData.id,
          action: 'payment_success',
          amount: amount,
          response_data: Object.fromEntries(params)
        });

        // 슬랙 알림 전송
        await sendSlackNotification({
          name: appData.name,
          amount: amount,
          mul_no: mul_no || '',
          payment_status: 'paid',
        });
      }

      // 성공 페이지 HTML
      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>결제 완료</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
      }
      .container {
        text-align: center;
        background: white;
        padding: 60px 40px;
        border-radius: 20px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        max-width: 400px;
        width: 100%;
        animation: slideUp 0.5s ease-out;
      }
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(30px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .checkmark {
        width: 100px;
        height: 100px;
        margin: 0 auto 30px;
        animation: scaleIn 0.6s ease-out 0.2s both;
      }
      @keyframes scaleIn {
        from {
          opacity: 0;
          transform: scale(0.5);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }
      h1 {
        color: #191f28;
        margin: 0 0 15px 0;
        font-size: 28px;
        font-weight: 700;
        line-height: 1.3;
      }
      p {
        color: #888;
        margin: 0;
        font-size: 15px;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <svg class="checkmark" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#667eea" stroke-width="2"/>
        <circle cx="50" cy="50" r="45" fill="none" stroke="#667eea" stroke-width="8" stroke-dasharray="283" stroke-dashoffset="283" style="animation: dash 0.6s ease-in-out 0.3s forwards;"/>
        <path d="M 35 50 L 47 62 L 70 38" stroke="#667eea" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round" style="animation: checkmark 0.6s ease-out 0.5s both;"/>
      </svg>
      <h1>결제가 완료되었습니다!</h1>
      <p>잠시 후 페이지가 이동됩니다...</p>
    </div>
    <script>
      var style = document.createElement('style');
      style.innerHTML = \`
        @keyframes dash {
          to {
            stroke-dashoffset: 0;
          }
        }
        @keyframes checkmark {
          from {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
          }
          to {
            stroke-dasharray: 100;
            stroke-dashoffset: 0;
          }
        }
      \`;
      document.head.appendChild(style);

      if (window.opener) {
        // 팝업 창인 경우: 부모 페이지로 이동 후 닫기
        window.opener.location.href = '/?payment=success&step=3';
        window.close();
      } else {
        // 팝업 아닌 경우: 직접 이동
        window.location.href = '/?payment=success&step=3';
      }
    </script>
  </body>
</html>`;
      return new NextResponse(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    } else if (state === '0') {
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

        // 슬랙 알림 전송
        await sendSlackNotification({
          name: appData.name,
          amount: 0,
          mul_no: mul_no || '',
          payment_status: 'failed',
        });
      }

      // 실패 페이지 HTML
      const failHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>결제 실패</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: #f5f5f5;
        padding: 20px;
      }
      .container {
        text-align: center;
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 400px;
        width: 100%;
      }
      h1 {
        color: #d32f2f;
        margin: 0 0 10px 0;
        font-size: 22px;
      }
      p {
        color: #666;
        margin: 0;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>✗ 결제가 실패했습니다</h1>
      <p>잠시 후 창이 자동으로 닫힙니다...</p>
    </div>
    <script>
      setTimeout(function() {
        window.close();
      }, 3000);
    </script>
  </body>
</html>`;
      return new NextResponse(failHtml, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
  } catch (error) {
    console.error('Payment result POST error:', error);
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }
}
