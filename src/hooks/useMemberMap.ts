import { useMemo } from 'react';
import type { Member } from '../types';

export function useMemberMap(members: Member[]) {
  return useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);
}
