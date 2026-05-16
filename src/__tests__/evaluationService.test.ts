import { describe, it, expect } from 'vitest';
import { EvaluationService } from '../services/EvaluationService';
import type { Score } from '../types';

const mockScores: Score[] = [
  { dimension: '代码质量', value: 90, max: 100, weight: 0.3, description: '代码质量评分' },
  { dimension: '任务完成率', value: 85, max: 100, weight: 0.25, description: '任务完成率评分' },
  { dimension: '协作能力', value: 70, max: 100, weight: 0.2, description: '协作能力评分' },
  { dimension: '创新能力', value: 60, max: 100, weight: 0.15, description: '创新能力评分' },
  { dimension: '响应速度', value: 95, max: 100, weight: 0.1, description: '响应速度评分' },
];

describe('EvaluationService', () => {
  it('should calculateTotalScore', () => {
    // (90/100)*0.3*100 + (85/100)*0.25*100 + (70/100)*0.2*100 + (60/100)*0.15*100 + (95/100)*0.1*100
    // = 27 + 21.25 + 14 + 9 + 9.5 = 80.75 => rounded to 81
    const total = EvaluationService.calculateTotalScore(mockScores);
    expect(total).toBe(81);

    const emptyTotal = EvaluationService.calculateTotalScore([]);
    expect(emptyTotal).toBe(0);

    const perfectScores: Score[] = [
      { dimension: 'test', value: 100, max: 100, weight: 1, description: 'test' },
    ];
    expect(EvaluationService.calculateTotalScore(perfectScores)).toBe(100);

    const zeroScores: Score[] = [
      { dimension: 'test', value: 0, max: 100, weight: 1, description: 'test' },
    ];
    expect(EvaluationService.calculateTotalScore(zeroScores)).toBe(0);
  });

  it('should getRating', () => {
    expect(EvaluationService.getRating(100)).toBe('exceptional');
    expect(EvaluationService.getRating(95)).toBe('exceptional');
    expect(EvaluationService.getRating(96)).toBe('exceptional');
    expect(EvaluationService.getRating(85)).toBe('excellent');
    expect(EvaluationService.getRating(90)).toBe('excellent');
    expect(EvaluationService.getRating(70)).toBe('good');
    expect(EvaluationService.getRating(80)).toBe('good');
    expect(EvaluationService.getRating(60)).toBe('acceptable');
    expect(EvaluationService.getRating(65)).toBe('acceptable');
    expect(EvaluationService.getRating(59)).toBe('needs_improvement');
    expect(EvaluationService.getRating(0)).toBe('needs_improvement');
  });

  it('should getRatingLabel', () => {
    expect(EvaluationService.getRatingLabel('exceptional')).toBe('卓越');
    expect(EvaluationService.getRatingLabel('excellent')).toBe('优秀');
    expect(EvaluationService.getRatingLabel('good')).toBe('良好');
    expect(EvaluationService.getRatingLabel('acceptable')).toBe('及格');
    expect(EvaluationService.getRatingLabel('needs_improvement')).toBe('需改进');
  });

  it('should getRatingColor', () => {
    expect(EvaluationService.getRatingColor('exceptional')).toContain('green');
    expect(EvaluationService.getRatingColor('excellent')).toContain('blue');
    expect(EvaluationService.getRatingColor('good')).toContain('yellow');
    expect(EvaluationService.getRatingColor('acceptable')).toContain('orange');
    expect(EvaluationService.getRatingColor('needs_improvement')).toContain('red');
  });

  it('should findWeaknesses', () => {
    const weaknesses = EvaluationService.findWeaknesses(mockScores);
    expect(weaknesses).toHaveLength(2);
    expect(weaknesses.map(s => s.dimension)).toEqual(['协作能力', '创新能力']);

    const highThreshold = EvaluationService.findWeaknesses(mockScores, 90);
    expect(highThreshold).toHaveLength(3);
    expect(highThreshold.map(s => s.dimension)).toEqual(['任务完成率', '协作能力', '创新能力']);

    const lowThreshold = EvaluationService.findWeaknesses(mockScores, 50);
    expect(lowThreshold).toHaveLength(0);

    const allWeak = EvaluationService.findWeaknesses(mockScores, 100);
    expect(allWeak).toHaveLength(5);
  });

  it('should findStrengths', () => {
    const strengths = EvaluationService.findStrengths(mockScores);
    // Default threshold 85: 代码质量(90), 任务完成率(85), 响应速度(95)
    expect(strengths).toHaveLength(3);
    expect(strengths.map(s => s.dimension)).toEqual(['代码质量', '任务完成率', '响应速度']);

    const lowThreshold = EvaluationService.findStrengths(mockScores, 60);
    // value >= 60: 代码质量(90), 任务完成率(85), 协作能力(70), 响应速度(95), 创新能力(60)
    expect(lowThreshold).toHaveLength(5);
    expect(lowThreshold.map(s => s.dimension)).toEqual(['代码质量', '任务完成率', '协作能力', '创新能力', '响应速度']);

    const highThreshold = EvaluationService.findStrengths(mockScores, 91);
    // value >= 91: only 响应速度(95)
    expect(highThreshold).toHaveLength(1);
    expect(highThreshold[0].dimension).toBe('响应速度');

    const impossibleThreshold = EvaluationService.findStrengths(mockScores, 101);
    expect(impossibleThreshold).toHaveLength(0);
  });
});
