import type { Score, Evaluation } from '../types';

export class EvaluationService {
  static calculateTotalScore(scores: Score[]): number {
    const validScores = scores.filter(s => s.max > 0);
    const totalWeight = validScores.reduce((sum, s) => sum + s.weight, 0);
    if (totalWeight <= 0) return 0;
    return Math.round(
      validScores.reduce((sum, s) => {
        const clampedValue = Math.max(0, Math.min(s.value, s.max));
        return sum + (clampedValue / s.max) * (s.weight / totalWeight) * 100;
      }, 0)
    );
  }

  static getRating(totalScore: number): Evaluation['rating'] {
    if (totalScore >= 95) return 'exceptional';
    if (totalScore >= 85) return 'excellent';
    if (totalScore >= 70) return 'good';
    if (totalScore >= 60) return 'acceptable';
    return 'needs_improvement';
  }

  static getRatingLabel(rating: Evaluation['rating']): string {
    const labels: Record<string, string> = {
      exceptional: '卓越', excellent: '优秀', good: '良好',
      acceptable: '及格', needs_improvement: '需改进',
    };
    return labels[rating] || rating;
  }

  static getRatingColor(rating: Evaluation['rating']): string {
    const colors: Record<string, string> = {
      exceptional: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900',
      excellent: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900',
      good: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900',
      acceptable: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900',
      needs_improvement: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900',
    };
    return colors[rating] || '';
  }

  static findWeaknesses(scores: Score[], threshold: number = 75): Score[] {
    return scores.filter(s => s.max > 0 && s.value / s.max < threshold / 100);
  }

  static findStrengths(scores: Score[], threshold: number = 85): Score[] {
    return scores.filter(s => s.max > 0 && s.value / s.max >= threshold / 100);
  }
}
