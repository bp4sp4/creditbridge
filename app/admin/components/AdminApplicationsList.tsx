"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import styles from "./admin.module.css";
import DetailModal from "./DetailModal";
import NewApplicationModal from "./NewApplicationModal";

type Application = {
  id: string;
  name: string;
  contact: string;
  birth_prefix: string;
  address: string;
  certificates: string[];
  cash_receipt: string;
  photo_url: string;
  created_at: string;
  click_source?: string;
  order_id?: string;
  amount?: number;
  payment_status?: string;
  paid_at?: string;
  trade_id?: string;
  mul_no?: string;
  pay_method?: string;
  address_main?: string;
  address_detail?: string;
  postal_code?: string;
  is_checked?: boolean;
};

export default function AdminApplicationsList() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const itemsPerPage = 10;

  // 로그아웃 함수
  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    sessionStorage.removeItem("adminLoginTime");
    router.push("/admin/login");
  };

  // 24시간 자동 로그아웃
  useEffect(() => {
    const supabase = createClient();
    const loginTime = sessionStorage.getItem("adminLoginTime");

    if (!loginTime) {
      sessionStorage.setItem("adminLoginTime", Date.now().toString());
    } else {
      const now = Date.now();
      const elapsed = now - parseInt(loginTime);
      const oneDay = 24 * 60 * 60 * 1000;

      if (elapsed > oneDay) {
        handleLogout();
        return;
      }

      const remainingTime = oneDay - elapsed;
      const logoutTimer = setTimeout(() => {
        handleLogout();
      }, remainingTime);

      return () => clearTimeout(logoutTimer);
    }
  }, []);

  // 데이터 조회
  useEffect(() => {
    const supabase = createClient();
    async function fetchApplications() {
      setLoading(true);

      const { count } = await supabase
        .from("certificate_applications")
        .select("*", { count: "exact", head: true });

      // 체크된 항목과 체크되지 않은 항목 따로 조회
      const { data: checkedData } = await supabase
        .from("certificate_applications")
        .select("*")
        .eq("is_checked", true)
        .order("created_at", { ascending: false });

      const { data: uncheckedData, error } = await supabase
        .from("certificate_applications")
        .select("*")
        .eq("is_checked", false)
        .order("created_at", { ascending: false });

      if (!error) {
        // 체크되지 않은 항목 먼저, 그 다음 체크된 항목
        const sortedData = [...(uncheckedData || []), ...(checkedData || [])];
        setAllApplications(sortedData);
        setTotalCount(count || 0);

        // 체크된 ID 설정
        const checkedIds = new Set((checkedData || []).map((app) => app.id));
        setCheckedIds(checkedIds);

        // 페이징 적용
        const from = (currentPage - 1) * itemsPerPage;
        const to = from + itemsPerPage;
        const paginatedData = sortedData.slice(from, to);
        setApplications(paginatedData);
      }
      setLoading(false);
    }
    fetchApplications();
  }, [currentPage]);

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      // 검색어가 없으면 전체 데이터 표시 (페이징)
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage;
      setApplications(allApplications.slice(from, to));
      return;
    }

    // 검색어로 필터링
    const filtered = allApplications.filter((app) => {
      const searchLower = searchQuery.toLowerCase();
      // 연락처에서 하이픈 제거
      const contactNoHyphen = app.contact.replace(/-/g, "");

      return (
        app.name.toLowerCase().includes(searchLower) ||
        app.contact.toLowerCase().includes(searchLower) ||
        contactNoHyphen.toLowerCase().includes(searchLower) ||
        app.birth_prefix.includes(searchQuery) ||
        app.address_main?.toLowerCase().includes(searchLower) ||
        app.mul_no?.includes(searchQuery)
      );
    });

    // 검색 결과에 페이징 적용
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage;
    setApplications(filtered.slice(from, to));
    setTotalCount(filtered.length);
  }, [searchQuery, allApplications, currentPage]);

  // 모달 열기
  const openModal = (app: Application) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
  };

  // 데이터 새로고침
  const refreshData = () => {
    setCurrentPage(1);
  };

  // 즉시 삭제 (optimistic update)
  const handleDeleteApplication = (id: string) => {
    setApplications((prev) => prev.filter((app) => app.id !== id));
    setTotalCount((prev) => prev - 1);
    setCheckedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  // 즉시 수정 (optimistic update)
  const handleUpdateApplication = (id: string, data: Partial<Application>) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...data } : app)),
    );
  };

  // 즉시 추가 (optimistic update)
  const handleAddApplication = (newApp: Application) => {
    setApplications((prev) => [newApp, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  // 검색어 하이라이트 함수
  const highlightText = (text: string, query: string, isContact: boolean = false) => {
    if (!query.trim()) return text;

    let regex;
    if (isContact) {
      // 연락처인 경우 하이픈을 무시하고 검색
      const queryNoHyphen = query.replace(/-/g, "");
      regex = new RegExp(`(${queryNoHyphen})`, 'gi');
      const textNoHyphen = text.replace(/-/g, "");

      // 원본 텍스트에서 해당 부분을 찾기
      const parts: (string | JSX.Element)[] = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(textNoHyphen)) !== null) {
        if (match.index > lastIndex) {
          parts.push(text.substring(lastIndex, match.index));
        }
        parts.push(
          <span key={match.index} className={styles.searchHighlight}>
            {text.substring(match.index, regex.lastIndex)}
          </span>
        );
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
      }

      return parts.length > 0 ? parts : text;
    } else {
      // 다른 필드는 일반 검색
      regex = new RegExp(`(${query})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className={styles.searchHighlight}>
            {part}
          </span>
        ) : (
          part
        )
      );
    }
  };

  // 체크박스 핸들러
  const handleCheckChange = async (id: string) => {
    const supabase = createClient();
    const isCurrentlyChecked = checkedIds.has(id);
    const newCheckedState = !isCurrentlyChecked;

    // 즉시 UI 업데이트
    setCheckedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });

    // UI만 업데이트하고 이동하지 않음
    // 체크 상태만 변경

    // DB에 저장
    const { error } = await supabase
      .from("certificate_applications")
      .update({ is_checked: newCheckedState })
      .eq("id", id);

    if (error) {
      console.error("DB 저장 실패:", error);
      // 오류 발생 시 즉시 되돌리기
      setCheckedIds((prev) => {
        const newSet = new Set(prev);
        if (newCheckedState) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    }
  };

  if (loading)
    return <div className={styles.loading}>데이터를 불러오고 있습니다...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>자격증 신청 내역</h2>
          <div className={styles.headerSubtitle}>
            총{" "}
            <span className={styles.headerSubtitleBold}>
              {searchQuery ? applications.length : totalCount}
            </span>
            건
          </div>
        </div>
        <div className={styles.buttonGroup}>
          <button
            className={styles.buttonPrimary}
            onClick={() => setIsNewModalOpen(true)}
          >
            + 새 신청
          </button>
          <button className={styles.buttonDanger} onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      </div>

      <div className={styles.card}>
        {/* 검색창 */}
        <div className={styles.searchContainer}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="신청자명, 연락처, 생년월일, 주소, 결제번호로 검색..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className={styles.searchReset}
              >
                초기화
              </button>
            )}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: "40px" }}>선택</th>
                <th>신청자</th>
                <th>연락처 / 생년월일</th>
                <th>신청 자격증</th>
                <th>주소</th>
                <th>결제 상태</th>
                <th>결제 금액</th>
                <th>결제일</th>
                <th>결제번호</th>
                <th>사진</th>
                <th>신청일</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => openModal(app)}
                  style={{
                    cursor: "pointer",
                    backgroundColor: checkedIds.has(app.id)
                      ? "#d1fae5"
                      : "transparent",
                    transition: "background-color 0.2s",
                  }}
                >
                  <td
                    className={styles.checkboxCell}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={checkedIds.has(app.id)}
                      onChange={() => handleCheckChange(app.id)}
                      className={styles.checkboxInput}
                    />
                  </td>
                  <td className={styles.nameCell}>{highlightText(app.name, searchQuery)}</td>
                  <td>
                    <div className={styles.contactCell}>{highlightText(app.contact, searchQuery, true)}</div>
                    <div className={styles.contactSubtext}>
                      {highlightText(app.birth_prefix, searchQuery)}
                    </div>
                  </td>
                  <td>
                    <div style={{ maxWidth: "250px" }}>
                      {app.certificates.map((cert, idx) => (
                        <span key={idx} className={styles.certBadge}>
                          {cert}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontSize: "14px",
                        width: "200px",
                        lineHeight: 1.4,
                      }}
                    >
                      {highlightText(app.address, searchQuery)}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        display: "inline-block",
                        padding: "4px 12px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor:
                          app.payment_status === "paid"
                            ? "#d1fae5"
                            : app.payment_status === "failed"
                              ? "#fee2e2"
                              : "#fef3c7",
                        color:
                          app.payment_status === "paid"
                            ? "#065f46"
                            : app.payment_status === "failed"
                              ? "#991b1b"
                              : "#92400e",
                      }}
                    >
                      {app.payment_status === "paid"
                        ? "결제완료"
                        : app.payment_status === "failed"
                          ? "결제실패"
                          : "대기중"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>
                      {app.amount ? `${app.amount.toLocaleString()}원` : "-"}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "13px" }}>
                      {app.paid_at
                        ? new Date(app.paid_at).toLocaleDateString("ko-KR")
                        : "-"}
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        fontFamily: "monospace",
                      }}
                    >
                      {app.mul_no ? highlightText(app.mul_no, searchQuery) : "-"}
                    </div>
                  </td>

                  <td>
                    {app.photo_url ? (
                      <img
                        src={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("https://")[1]}/storage/v1/object/public/photos/${app.photo_url}`}
                        alt="사진"
                        style={{
                          width: "50px",
                          height: "50px",
                          borderRadius: "6px",
                          objectFit: "cover",
                          border: "1px solid #e5e8eb",
                          cursor: "pointer",
                        }}
                        title="클릭하여 상세정보 보기"
                      />
                    ) : (
                      <span style={{ color: "#ccc", fontSize: "12px" }}>
                        없음
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.date}>
                      {new Date(app.created_at).toLocaleDateString("ko-KR")}
                      <br />
                      {new Date(app.created_at).toLocaleTimeString("ko-KR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이징 */}
        <div className={styles.paginationContainer}>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            처음
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            이전
          </button>

          {Array.from(
            { length: Math.ceil(totalCount / itemsPerPage) },
            (_, i) => i + 1,
          )
            .slice(
              Math.max(0, currentPage - 3),
              Math.min(Math.ceil(totalCount / itemsPerPage), currentPage + 2),
            )
            .map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`${styles.paginationButton} ${page === currentPage ? styles.paginationButtonActive : ""}`}
              >
                {page}
              </button>
            ))}

          <button
            onClick={() =>
              setCurrentPage((prev) =>
                Math.min(prev + 1, Math.ceil(totalCount / itemsPerPage)),
              )
            }
            disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
            className={styles.paginationButton}
          >
            다음
          </button>

          <button
            onClick={() => setCurrentPage(Math.ceil(totalCount / itemsPerPage))}
            disabled={currentPage === Math.ceil(totalCount / itemsPerPage)}
            className={styles.paginationButton}
          >
            마지막
          </button>
        </div>
      </div>

      {/* 상세 모달 */}
      {isModalOpen && selectedApp && (
        <DetailModal
          application={selectedApp}
          onClose={closeModal}
          onRefresh={refreshData}
          onDelete={handleDeleteApplication}
          onUpdate={handleUpdateApplication}
        />
      )}

      {/* 새 신청 모달 */}
      <NewApplicationModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onRefresh={refreshData}
        onAdd={handleAddApplication}
      />
    </div>
  );
}
