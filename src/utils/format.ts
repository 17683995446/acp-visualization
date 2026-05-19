// Re-export generateId from helpers to avoid duplication
export { generateId } from '../store/helpers';

/**
 * 格式化时间戳为相对时间描述（中文）
 * @param timestamp - 毫秒时间戳
 * @returns 相对时间字符串，如 "2小时前"、"刚刚"
 */
export function formatTime(timestamp: number): string {
  if (timestamp == null || typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return '刚刚';
  }
  if (timestamp <= 0) return '刚刚';
  const diff = Date.now() - timestamp;
  if (diff < 0 || diff > 100 * 365.25 * 24 * 60 * 60 * 1000) return '刚刚';
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (seconds < 60) {
    return '刚刚';
  }
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }
  if (hours < 24) {
    return `${hours}小时前`;
  }
  if (days < 7) {
    return `${days}天前`;
  }
  if (weeks < 4) {
    return `${weeks}周前`;
  }
  if (months < 12) {
    return `${months}个月前`;
  }
  return `${Math.floor(months / 12)}年前`;
}

/**
 * 格式化时间戳为日期时间字符串
 * @param timestamp - 毫秒时间戳
 * @returns 格式化的日期时间字符串 "YYYY-MM-DD HH:mm"
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 格式化持续时间为可读字符串
 * @param minutes - 分钟数
 * @returns 格式化的持续时间字符串 "Xh Ym"
 */
export function formatDuration(minutes: number): string {
  if (minutes == null || typeof minutes !== 'number' || !Number.isFinite(minutes)) {
    return '<1m';
  }
  if (minutes < 1) {
    return '<1m';
  }

  const totalMins = Math.round(minutes);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * 将数值限制在指定范围内
 * @param value - 输入值
 * @param min - 最小值
 * @param max - 最大值
 * @returns 限制后的数值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
