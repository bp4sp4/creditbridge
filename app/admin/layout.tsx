import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 - 취업자격증 연계 신청 서비스",
  description: "취업자격증 연계 신청 서비스 관리자 페이지",
  openGraph: {
    title: "관리자 - 취업자격증 연계 신청 서비스",
    description: "취업자격증 연계 신청 서비스 관리자 페이지",
    images: [
      {
        url: "/og-image-admin.png",
        width: 1200,
        height: 630,
        alt: "관리자 - 취업자격증 연계 신청 서비스",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "관리자 - 취업자격증 연계 신청 서비스",
    description: "취업자격증 연계 신청 서비스 관리자 페이지",
    images: ["/og-image-admin.png"],
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
