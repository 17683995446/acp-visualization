/**
 * 工具函数和 Hooks 单元测试
 */
import { describe, it, expect } from 'vitest';
import { formatTime, formatDateTime, formatDuration, clamp } from '../utils/format';

describe('Utils - formatTime', () => {
  it('should return "刚刚" for recent timestamps', () => {
    const now = Date.now();
    expect(formatTime(now)).toBe('刚刚');
    expect(formatTime(now - 30000)).toBe('刚刚');
  });

  it('should return minutes format', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(formatTime(fiveMinAgo)).toContain('分钟');
  });

  it('should return hours format', () => {
    const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
    expect(formatTime(threeHoursAgo)).toContain('小时');
  });

  it('should return days format', () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    expect(formatTime(twoDaysAgo)).toContain('天');
  });
});

describe('Utils - formatDateTime', () => {
  it('should format timestamp to YYYY-MM-DD HH:mm', () => {
    const ts = new Date(2024, 5, 15, 14, 30).getTime(); // June 15, 2024 14:30
    const formatted = formatDateTime(ts);
    expect(formatted).toMatch(/2024-06-15 14:30/);
  });
});

describe('Utils - formatDuration', () => {
  it('should format minutes correctly', () => {
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(0)).toBe('<1m');
  });
});

describe('Utils - clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});
