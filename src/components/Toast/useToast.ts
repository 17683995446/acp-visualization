import { useContext, useCallback } from 'react';
import { ToastContext, type ToastType } from './ToastProvider';

interface ToastMethods {
  /** 显示成功通知 */
  success: (message: string, duration?: number) => void;
  /** 显示错误通知 */
  error: (message: string, duration?: number) => void;
  /** 显示警告通知 */
  warning: (message: string, duration?: number) => void;
  /** 显示信息通知 */
  info: (message: string, duration?: number) => void;
  /** 显示自定义类型通知 */
  show: (message: string, type: ToastType, duration?: number) => void;
  /** 隐藏指定通知 */
  hide: (id: string) => void;
}

/**
 * Toast 通知钩子
 * 
 * @example
 * ```tsx
 * const toast = useToast();
 * 
 * // 显示成功通知
 * toast.success('操作成功完成！');
 * 
 * // 显示错误通知（自定义持续时间）
 * toast.error('操作失败', 10000);
 * 
 * // 显示警告通知
 * toast.warning('请注意检查输入');
 * 
 * // 显示信息通知
 * toast.info('新消息已到达');
 * ```
 */
export const useToast = (): ToastMethods => {
  const context = useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { showToast, hideToast } = context;

  const success = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration);
    },
    [showToast]
  );

  const show = useCallback(
    (message: string, type: ToastType, duration?: number) => {
      showToast(message, type, duration);
    },
    [showToast]
  );

  const hide = useCallback(
    (id: string) => {
      hideToast(id);
    },
    [hideToast]
  );

  return {
    success,
    error,
    warning,
    info,
    show,
    hide,
  };
};

export default useToast;
