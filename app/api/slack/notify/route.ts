import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { name, status, action } = await req.json();

    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      return NextResponse.json(
        { error: 'Slack webhook URL이 설정되지 않았습니다' },
        { status: 400 }
      );
    }

    // 슬랙 메시지 포맷
    const message = {
      text: `어드민 신청자 상태 변경 알림`,
      attachments: [
        {
          color: status === 'checked' ? '#FFC107' : '#28A745',
          fields: [
            {
              title: '신청자',
              value: name,
              short: true,
            },
            {
              title: '작업',
              value: status === 'checked' ? '✅ 체크됨' : '❌ 체크 해제됨',
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

    // 슬랙에 메시지 전송
    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`Slack API 오류: ${response.statusText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Slack 알림 전송 실패:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알림 전송 실패' },
      { status: 500 }
    );
  }
}
