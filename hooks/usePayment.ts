import { useState, useCallback } from 'react';
import { cancelPayment, cancelRebill, requestPaymentCancellation } from '../lib/payapp';

interface PaymentState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function usePayment() {
  const [state, setState] = useState<PaymentState>({
    loading: false,
    error: null,
    success: false,
  });

  /**
   * 결제 취소 (D+5일 이전, 정산 전)
   */
  const handleCancel = useCallback(
    async (userId: string, linkKey: string, mulNo: string, cancelMemo: string) => {
      setState({ loading: true, error: null, success: false });
      try {
        const result = await cancelPayment({
          userId,
          linkKey,
          mulNo,
          cancelMemo,
          partCancel: 0, // 전체 취소
        });

        if (result.success) {
          setState({ loading: false, error: null, success: true });
          return result;
        } else {
          setState({ loading: false, error: result.error || '결제 취소 실패', success: false });
          return result;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '결제 취소 중 오류가 발생했습니다.';
        setState({ loading: false, error: errorMessage, success: false });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * 부분 결제 취소 (D+5일 이전, 정산 전)
   */
  const handlePartialCancel = useCallback(
    async (
      userId: string,
      linkKey: string,
      mulNo: string,
      cancelMemo: string,
      cancelPrice: number
    ) => {
      setState({ loading: true, error: null, success: false });
      try {
        const result = await cancelPayment({
          userId,
          linkKey,
          mulNo,
          cancelMemo,
          partCancel: 1, // 부분 취소
          cancelPrice,
        });

        if (result.success) {
          setState({ loading: false, error: null, success: true });
          return result;
        } else {
          setState({ loading: false, error: result.error || '부분 취소 실패', success: false });
          return result;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '부분 취소 중 오류가 발생했습니다.';
        setState({ loading: false, error: errorMessage, success: false });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * 정기결제 해지
   */
  const handleRebillCancel = useCallback(
    async (userId: string, linkKey: string, rebillNo: string) => {
      setState({ loading: true, error: null, success: false });
      try {
        const result = await cancelRebill({
          userId,
          linkKey,
          rebillNo,
        });

        if (result.success) {
          setState({ loading: false, error: null, success: true });
          return result;
        } else {
          setState({ loading: false, error: result.error || '정기결제 해지 실패', success: false });
          return result;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '정기결제 해지 중 오류가 발생했습니다.';
        setState({ loading: false, error: errorMessage, success: false });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  /**
   * 결제 취소 요청 (D+5일 이후 또는 정산 완료)
   */
  const handleCancelRequest = useCallback(
    async (userId: string, linkKey: string, mulNo: string, cancelMemo: string) => {
      setState({ loading: true, error: null, success: false });
      try {
        const result = await requestPaymentCancellation({
          userId,
          linkKey,
          mulNo,
          cancelMemo,
          partCancel: 0, // 전체 취소
        });

        if (result.success) {
          setState({ loading: false, error: null, success: true });
          return result;
        } else {
          setState({ loading: false, error: result.error || '취소 요청 실패', success: false });
          return result;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '취소 요청 중 오류가 발생했습니다.';
        setState({ loading: false, error: errorMessage, success: false });
        return { success: false, error: errorMessage };
      }
    },
    []
  );

  return {
    state,
    handleCancel,
    handlePartialCancel,
    handleRebillCancel,
    handleCancelRequest,
  };
}
