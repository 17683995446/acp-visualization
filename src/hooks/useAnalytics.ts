import { useMemo, useRef, useState, useEffect } from 'react';
import { useACPStore } from '../store/acpStore';
import { generateFullReport } from '../services/AnalyticsService';
import type { AnalysisReport } from '../services/AnalyticsService';

export function useAnalytics(): AnalysisReport {
  const tasks = useACPStore(state => state.tasks);
  const members = useACPStore(state => state.organization.members);
  const messages = useACPStore(state => state.messages);
  const evaluation = useACPStore(state => state.evaluation);
  const logs = useACPStore(state => state.logs);
  const isSimulating = useACPStore(state => state.isSimulating);

  // 从日志中提取 tick 历史完成数
  const tickHistory = useMemo(() => {
    const history: number[] = [];
    logs.forEach(log => {
      if (log.message?.includes('任务完成')) {
        history.push(1);
      }
    });
    return history;
  }, [logs]);

  // 节流：模拟运行期间每 2 秒更新一次报告
  const [report, setReport] = useState<AnalysisReport>(() =>
    generateFullReport(tasks, members, messages, evaluation, tickHistory)
  );
  const lastUpdateTime = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    // 模拟运行期间节流到 2 秒间隔，非模拟时立即更新
    if (isSimulating && now - lastUpdateTime.current < 2000) {
      return;
    }
    lastUpdateTime.current = now;
    setReport(generateFullReport(tasks, members, messages, evaluation, tickHistory));
  }, [tasks, members, messages, evaluation, tickHistory, isSimulating]);

  return report;
}
