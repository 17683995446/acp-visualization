import type { Member, Organization } from '../types';

export class OrganizationService {
  static getMembersByRole(org: Organization, role: Member['role']): Member[] {
    return org.members.filter(m => m.role === role);
  }

  static getMembersByDepartment(org: Organization, departmentId: string): Member[] {
    const dept = org.departments.find(d => d.id === departmentId);
    if (!dept) return [];
    const memberSet = new Set(dept.members);
    return org.members.filter(m => memberSet.has(m.id));
  }

  static getTopPerformers(members: Member[], limit: number = 5): Member[] {
    return [...members].sort((a, b) => b.reputation - a.reputation).slice(0, limit);
  }

  static getDepartmentStats(org: Organization): Array<{ id: string; name: string; memberCount: number; avgReputation: number; budget: number }> {
    return org.departments.map(dept => {
      const memberSet = new Set(dept.members);
      const deptMembers = org.members.filter(m => memberSet.has(m.id));
      const avgReputation = deptMembers.length > 0
        ? deptMembers.reduce((sum, m) => sum + m.reputation, 0) / deptMembers.length
        : 0;
      return {
        id: dept.id,
        name: dept.name,
        memberCount: deptMembers.length,
        avgReputation: Math.round(avgReputation),
        budget: dept.budget,
      };
    });
  }

  static isValidMember(org: Organization, memberId: string): boolean {
    return org.members.some(m => m.id === memberId);
  }
}
