import type { Organization, Task, Message, KnowledgeNode, Evaluation, Score } from '../types';

export interface ExportData {
  version: string;
  exportedAt: string;
  organization: Organization;
  tasks: Task[];
  messages: Message[];
  knowledgeNodes: KnowledgeNode[];
  evaluation: Evaluation;
  evaluationScores: Score[];
}

/**
 * 验证导入数据的完整性和格式
 */
function validateImportData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('数据格式无效');
    return { valid: false, errors };
  }
  if (!data.version) {
    errors.push('缺少版本号');
  }
  if (!data.organization || typeof data.organization !== 'object') {
    errors.push('缺少组织数据');
  } else {
    if (!Array.isArray(data.organization.members)) {
      errors.push('organization.members 不是数组');
    }
    if (!Array.isArray(data.organization.departments)) {
      errors.push('organization.departments 不是数组');
    }
  }
  if (!Array.isArray(data.tasks)) {
    errors.push('tasks 不是数组');
  }
  if (!Array.isArray(data.messages)) {
    errors.push('messages 不是数组');
  }
  if (!Array.isArray(data.knowledgeNodes)) {
    errors.push('knowledgeNodes 不是数组');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Export all platform data as JSON
 */
export function exportData(data: {
  organization: Organization;
  tasks: Task[];
  messages: Message[];
  knowledgeNodes: KnowledgeNode[];
  evaluation: Evaluation;
  evaluationScores: Score[];
}): string {
  const exportPayload: ExportData = {
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Trigger a JSON file download in the browser
 */
export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // 延迟释放 URL，确保下载完成
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export platform data and trigger download
 */
export function exportPlatform(data: {
  organization: Organization;
  tasks: Task[];
  messages: Message[];
  knowledgeNodes: KnowledgeNode[];
  evaluation: Evaluation;
  evaluationScores: Score[];
}): void {
  const json = exportData(data);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadJSON(json, `acp-export-${timestamp}.json`);
}

/**
 * Import platform data from a JSON file
 */
export function importPlatform(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        // 全面验证导入数据
        const validation = validateImportData(data);
        if (!validation.valid) {
          reject(new Error(`无效的 ACP 数据文件: ${validation.errors.join('; ')}`));
          return;
        }

        resolve(data as ExportData);
      } catch {
        reject(new Error('JSON 解析失败'));
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}
