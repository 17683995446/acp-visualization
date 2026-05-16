/**
 * Evaluation 综合评分 - 升级版
 * 支持实时评分调整和重算
 */
import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import { EvaluationService } from '../services';
import { ProgressBar } from '../components/ui';

interface ScoreBarProps {
  dimension: string;
  value: number;
  max: number;
  weight: number;
  description: string;
  onChange: (dimension: string, value: number) => void;
}

const ScoreBar: React.FC<ScoreBarProps> = ({ dimension, value, max, weight, description, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onChange(dimension, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900 dark:text-white">{dimension}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">权重 {(weight * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <input
                type="number"
                min={0}
                max={max}
                value={editValue}
                onChange={(e) => setEditValue(Number(e.target.value))}
                className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button onClick={handleSave} className="p-1 text-green-500 hover:bg-green-50 rounded">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} className="p-1 text-gray-400 hover:bg-gray-50 rounded">
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <span className="font-bold text-gray-900 dark:text-white">{value}/{max}</span>
              <button
                onClick={() => { setEditValue(value); setIsEditing(true); }}
                className="p-1 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      <ProgressBar
        value={value}
        max={max}
        showPercentage={false}
        size="md"
      />
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
    </div>
  );
};

const Evaluation: React.FC = () => {
  const { evaluation, evaluationScores, updateScore, recalculateEvaluation } = useACPStore();

  const ratingLabel = EvaluationService.getRatingLabel(evaluation.rating);
  const ratingColor = EvaluationService.getRatingColor(evaluation.rating);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">综合评分</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">多维度多指标综合评估 · 点击分数可编辑</p>
        </div>
        <button
          onClick={recalculateEvaluation}
          className="flex items-center space-x-2 px-4 py-2 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>重新计算</span>
        </button>
      </div>

      {/* Total Score */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-80">总分</p>
            <p className="text-6xl font-bold mt-2">{evaluation.totalScore}</p>
            <p className="text-xl opacity-80 mt-1">/ 100</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-4 py-2 rounded-full text-lg font-semibold ${ratingColor}`}>
              {ratingLabel}
            </span>
            <p className="text-sm opacity-80 mt-2">基于 {evaluationScores.length} 个维度评估</p>
          </div>
        </div>
      </div>

      {/* Score Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">评分详情（可编辑）</h2>
          {evaluationScores.map(score => (
            <ScoreBar
              key={score.dimension}
              dimension={score.dimension}
              value={score.value}
              max={score.max}
              weight={score.weight}
              description={score.description}
              onChange={updateScore}
            />
          ))}
        </div>

        {/* Score Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">评分概览</h2>
          <div className="space-y-4">
            {evaluationScores.map(score => (
              <div key={score.dimension} className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-16 shrink-0">{score.dimension}</span>
                <div className="flex-1">
                  <ProgressBar
                    value={score.value}
                    max={score.max}
                    showPercentage={false}
                    size="sm"
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">{score.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 p-6 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 rounded-xl text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">综合得分</p>
            <p className="text-5xl font-bold text-primary-600 dark:text-primary-400">{evaluation.totalScore}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              等级: <span className={`font-semibold ${ratingColor.split(' ')[0]}`}>{ratingLabel}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">优势</h2>
          </div>
          <div className="space-y-3">
            {evaluation.strengths.map((strength, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{strength}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">待改进</h2>
          </div>
          <div className="space-y-3">
            {evaluation.weaknesses.map((weakness, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <TrendingDown className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{weakness}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2 mb-4">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">优化建议</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evaluation.recommendations.map((rec, i) => (
            <div key={i} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center space-x-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="font-medium text-gray-900 dark:text-white">建议 {i + 1}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Evaluation;
