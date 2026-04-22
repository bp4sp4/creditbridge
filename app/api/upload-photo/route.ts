import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

// 증명사진 업로드 전용 서버 라우트
// 클라이언트 @supabase/ssr의 "Invalid Compact JWS" 이슈 회피 목적
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 }
      );
    }

    // 파일 크기/MIME 검증
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "파일 크기가 너무 큽니다 (최대 50MB)" },
        { status: 400 }
      );
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "허용되지 않는 파일 형식입니다." },
        { status: 400 }
      );
    }

    // 파일명 안전 처리
    const safeName = file.name
      .replace(/[^a-zA-Z0-9가-힣._-]/g, "_")
      .replace(/_{2,}/g, "_");
    const path = `cert_photos/${Date.now()}_${safeName}`;

    // 서버에서 service_role 키로 업로드 (JWS 이슈 회피)
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("photos")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ path: data.path });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "업로드 실패";
    console.error("Upload route error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
