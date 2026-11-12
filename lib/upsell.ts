// 업셀링 캠페인 문자 링크 — ?utm_source=upsell&campaign_id=UP-xxx 로 들어오면 그 코드를 신청서(upsell_code)에 남긴다 (2026-11-12 오피스 DB관리 › 업셀링 캠페인)
// 결제 뒤 돌아오는 주소(/?payment=…)에는 값이 없으니 처음 들어올 때 이 탭(sessionStorage)에 기억해 둔다
const KEY = "upsell_code";
const CODE = /^UP-\d{3,}$/;

export function readUpsellCode(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const p = new URLSearchParams(window.location.search);
    const id = (p.get("campaign_id") ?? "").trim().toUpperCase();
    if (p.get("utm_source") === "upsell" && CODE.test(id)) {
      sessionStorage.setItem(KEY, id);
      return id;
    }
    const saved = sessionStorage.getItem(KEY);
    return saved && CODE.test(saved) ? saved : null;
  } catch {
    return null;
  }
}
