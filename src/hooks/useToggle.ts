import { useState, useCallback } from 'react';

export function useToggle(
  initialValue: boolean = false
): [boolean, { on: () => void; off: () => void; toggle: () => void; set: (value: boolean) => void }] {
  const [value, setValue] = useState(initialValue);

  const on = useCallback(() => setValue(true), []);
  const off = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue(prev => !prev), []);
  const set = useCallback((newValue: boolean) => setValue(newValue), []);

  return [value, { on, off, toggle, set }];
}
