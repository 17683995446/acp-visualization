/**
 * 自定义 Hook 单元测试
 * 测试 useDebounce、useToggle、useClickOutside、useLocalStorage
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';
import { useToggle } from '../hooks/useToggle';
import { useClickOutside } from '../hooks/useClickOutside';
import { useLocalStorage } from '../hooks/useLocalStorage';

// ============ useDebounce ============

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces subsequent values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    // Value hasn't changed yet
    expect(result.current).toBe('initial');

    // Update value
    rerender({ value: 'updated', delay: 500 });

    // Still the old value before delay
    expect(result.current).toBe('initial');

    // Advance timers by less than delay
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('initial');

    // Advance timers past the delay
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('updated');
  });

  it('updates after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 1000 } }
    );

    rerender({ value: 'second', delay: 1000 });
    rerender({ value: 'third', delay: 1000 });

    // Only the last value should be set after the delay
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toBe('third');
  });

  it('works with numeric values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 0, delay: 300 } }
    );

    rerender({ value: 42, delay: 300 });
    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe(42);
  });

  it('clears previous timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 500 } }
    );

    rerender({ value: 'b', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    rerender({ value: 'c', delay: 500 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should still be 'a' because we haven't reached the full delay since last change
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current).toBe('c');
  });
});

// ============ useToggle ============

describe('useToggle', () => {
  it('returns initial value false by default', () => {
    const { result } = renderHook(() => useToggle());
    expect(result.current[0]).toBe(false);
  });

  it('returns initial value true when specified', () => {
    const { result } = renderHook(() => useToggle(true));
    expect(result.current[0]).toBe(true);
  });

  it('toggle switches value', () => {
    const { result } = renderHook(() => useToggle(false));
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].toggle();
    });
    expect(result.current[0]).toBe(false);
  });

  it('on method sets value to true', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1].on();
    });
    expect(result.current[0]).toBe(true);

    // Calling on again should remain true
    act(() => {
      result.current[1].on();
    });
    expect(result.current[0]).toBe(true);
  });

  it('off method sets value to false', () => {
    const { result } = renderHook(() => useToggle(true));

    act(() => {
      result.current[1].off();
    });
    expect(result.current[0]).toBe(false);

    // Calling off again should remain false
    act(() => {
      result.current[1].off();
    });
    expect(result.current[0]).toBe(false);
  });

  it('set method sets value to specified boolean', () => {
    const { result } = renderHook(() => useToggle(false));

    act(() => {
      result.current[1].set(true);
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[1].set(false);
    });
    expect(result.current[0]).toBe(false);
  });

  it('returns stable handler references', () => {
    const { result, rerender } = renderHook(() => useToggle(false));
    const handlers1 = result.current[1];

    rerender();
    const handlers2 = result.current[1];

    // Handlers should be referentially stable across rerenders
    expect(handlers1.on).toBe(handlers2.on);
    expect(handlers1.off).toBe(handlers2.off);
    expect(handlers1.toggle).toBe(handlers2.toggle);
    expect(handlers1.set).toBe(handlers2.set);
  });
});

// ============ useClickOutside ============

describe('useClickOutside', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('calls handler when clicking outside the ref element', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickOutside(ref, handler));

    // Create and click an element outside the container
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    act(() => {
      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });

  it('does NOT call handler when clicking inside the ref element', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickOutside(ref, handler));

    act(() => {
      container.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('does NOT call handler when ref is null', () => {
    const handler = vi.fn();
    const ref = { current: null };

    renderHook(() => useClickOutside(ref, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    act(() => {
      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(outsideElement);
  });

  it('cleans up event listeners on unmount', () => {
    const handler = vi.fn();
    const ref = { current: container };

    const { unmount } = renderHook(() => useClickOutside(ref, handler));

    unmount();

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    act(() => {
      outsideElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();

    document.body.removeChild(outsideElement);
  });

  it('handles touchstart events', () => {
    const handler = vi.fn();
    const ref = { current: container };

    renderHook(() => useClickOutside(ref, handler));

    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);

    act(() => {
      outsideElement.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(outsideElement);
  });
});

// ============ useLocalStorage ============

describe('useLocalStorage', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        Object.keys(store).forEach(k => delete store[k]);
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('persists value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

    act(() => {
      result.current[1]('new value');
    });

    expect(result.current[0]).toBe('new value');
    expect(localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new value'));
  });

  it('reads existing value from localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem('test-key', JSON.stringify('stored value'));

    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored value');
  });

  it('handles function updater', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));

    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev: number) => prev + 10);
    });

    expect(result.current[0]).toBe(11);
  });

  it('works with object values', () => {
    const initial = { name: 'test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('obj-key', initial));

    act(() => {
      result.current[1]({ name: 'updated', count: 5 });
    });

    expect(result.current[0]).toEqual({ name: 'updated', count: 5 });
  });

  it('falls back to initial value when localStorage has invalid JSON', () => {
    localStorage.setItem('bad-key', 'not-valid-json');

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useLocalStorage('bad-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');

    consoleSpy.mockRestore();
  });
});
