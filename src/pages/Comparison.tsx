import { useState } from 'react';
import { 
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ComparisonItem {
  feature: string;
  caf: string | boolean;
  asi: string | boolean;
  ocs: string | boolean;
  winner: 'caf' | 'asi' | 'ocs' | 'tie';
}

const comparisons: ComparisonItem[] = [
  { feature: '核心隐喻', caf: '集群基础设施', asi: '涌现式智能', ocs: '组织社会学', winner: 'tie' },
  { feature: '组织形态', caf: '节点 + 总线', asi: '意图空间 + 市场', ocs: '公司 + 社区', winner: 'ocs' },
  { feature: '任务分配', caf: '分层调度器', asi: '竞标机制', ocs: '层级指派 + 自愿', winner: 'tie' },
  { feature: 'Agent 关系', caf: '协作节点', asi: '社会化角色', ocs: '职级 + 声誉', winner: 'ocs' },
  { feature: '决策模式', caf: '中心化 + 分布式', asi: '完全去中心化', ocs: '混合(层级+投票)', winner: 'ocs' },
  { feature: '记忆机制', caf: '四层存储', asi: '知识图谱驱动', ocs: 'Wiki + ADR + RFC', winner: 'tie' },
  { feature: '激励机制', caf: '无', asi: '虚拟货币', ocs: 'KPI + 声誉 + 代币', winner: 'ocs' },
  { feature: '质量保障', caf: '资源配额', asi: '信任网络', ocs: 'CQO + 社区审查', winner: 'ocs' },
  { feature: '学习曲线', caf: '中等', asi: '陡峭', ocs: '平缓', winner: 'ocs' },
  { feature: '实施周期', caf: '10-15 周', asi: '12-16 周', ocs: '8-12 周', winner: 'ocs' },
  { feature: '扩展性', caf: '线性扩展', asi: '指数级涌现', ocs: '灵活扩展', winner: 'asi' },
  { feature: '创新程度', caf: '★★★☆', asi: '★★★★★', ocs: '★★★★☆', winner: 'asi' },
  { feature: '落地可行性', caf: '★★★★☆', asi: '★★★☆', ocs: '★★★★☆', winner: 'tie' },
  { feature: '企业适用', caf: true, asi: false, ocs: true, winner: 'tie' },
  { feature: '开源社区适用', caf: true, asi: true, ocs: true, winner: 'tie' },
  { feature: '初创团队适用', caf: false, asi: true, ocs: true, winner: 'tie' },
];

const scores = {
  caf: { innovation: 14, creativity: 13, value: 17, practicality: 17, usability: 12, maintainability: 9, extensibility: 5, total: 87 },
  asi: { innovation: 15, creativity: 15, value: 16, practicality: 14, usability: 11, maintainability: 7, extensibility: 5, total: 83 },
  ocs: { innovation: 13, creativity: 14, value: 18, practicality: 18, usability: 14, maintainability: 9, extensibility: 5, total: 91 },
};

const Comparison = () => {
  const [selectedSchemes, setSelectedSchemes] = useState<string[]>(['caf', 'asi', 'ocs']);

  const toggleScheme = (scheme: string) => {
    setSelectedSchemes(prev => 
      prev.includes(scheme)
        ? prev.filter(s => s !== scheme)
        : [...prev, scheme]
    );
  };

  const getWinnerColor = (winner: string) => {
    switch (winner) {
      case 'caf': return 'bg-blue-100 text-blue-700';
      case 'asi': return 'bg-purple-100 text-purple-700';
      case 'ocs': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSchemeName = (scheme: string) => {
    switch (scheme) {
      case 'caf': return 'CAF';
      case 'asi': return 'ASI';
      case 'ocs': return 'OCS';
      default: return scheme;
    }
  };

  const getSchemeFullName = (scheme: string) => {
    switch (scheme) {
      case 'caf': return 'Cluster Agent Fabric';
      case 'asi': return 'Agent Swarm Intelligence';
      case 'ocs': return 'Organization Collaboration System';
      default: return scheme;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">方案对比</h1>
        <p className="text-gray-500 mt-1">三种架构方案的全面对比分析</p>
      </div>

      {/* Scheme Selector */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <p className="text-sm font-medium text-gray-700 mb-3">选择要对比的方案:</p>
        <div className="flex flex-wrap gap-2">
          {['caf', 'asi', 'ocs'].map(scheme => (
            <button
              key={scheme}
              onClick={() => toggleScheme(scheme)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSchemes.includes(scheme)
                  ? scheme === 'caf' ? 'bg-blue-500 text-white' :
                    scheme === 'asi' ? 'bg-purple-500 text-white' :
                    'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {getSchemeFullName(scheme)}
            </button>
          ))}
        </div>
      </div>

      {/* Score Comparison */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">综合评分对比</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {selectedSchemes.map(scheme => {
            const score = scores[scheme as keyof typeof scores];
            const isWinner = score.total === Math.max(...selectedSchemes.map(s => scores[s as keyof typeof scores].total));
            
            return (
              <div 
                key={scheme}
                className={`p-6 rounded-xl border-2 transition-all ${
                  isWinner 
                    ? scheme === 'caf' ? 'border-blue-500 bg-blue-50' :
                      scheme === 'asi' ? 'border-purple-500 bg-purple-50' :
                      'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">{getSchemeName(scheme)}</h3>
                  <p className="text-xs text-gray-500 mt-1">{getSchemeFullName(scheme)}</p>
                  <div className="mt-4">
                    <span className="text-5xl font-bold text-gray-900">{score.total}</span>
                    <span className="text-gray-500">/100</span>
                  </div>
                  {isWinner && (
                    <span className="inline-block mt-2 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">
                      🏆 推荐
                    </span>
                  )}
                </div>
                
                <div className="mt-6 space-y-2">
                  {Object.entries(score).filter(([k]) => k !== 'total').map(([dim, val]) => (
                    <div key={dim} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {dim === 'innovation' ? '创新性' :
                         dim === 'creativity' ? '创造性' :
                         dim === 'value' ? '价值量' :
                         dim === 'practicality' ? '实用性' :
                         dim === 'usability' ? '易用性' :
                         dim === 'maintainability' ? '可维护性' :
                         dim === 'extensibility' ? '可扩展性' : dim}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              scheme === 'caf' ? 'bg-blue-500' :
                              scheme === 'asi' ? 'bg-purple-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(val as number) / 20 * 100}%` }}
                          />
                        </div>
                        <span className="font-medium w-6">{val}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">详细功能对比</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  对比维度
                </th>
                {selectedSchemes.includes('caf') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">
                    CAF
                  </th>
                )}
                {selectedSchemes.includes('asi') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">
                    ASI
                  </th>
                )}
                {selectedSchemes.includes('ocs') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-green-600 uppercase tracking-wider">
                    OCS
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  优胜
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {comparisons.map((item, index) => (
                <tr key={item.feature} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.feature}
                  </td>
                  {selectedSchemes.includes('caf') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {typeof item.caf === 'boolean' ? (
                        item.caf ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        item.caf
                      )}
                    </td>
                  )}
                  {selectedSchemes.includes('asi') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {typeof item.asi === 'boolean' ? (
                        item.asi ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        item.asi
                      )}
                    </td>
                  )}
                  {selectedSchemes.includes('ocs') && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {typeof item.ocs === 'boolean' ? (
                        item.ocs ? <CheckCircle className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        item.ocs
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getWinnerColor(item.winner)}`}>
                      {item.winner === 'tie' ? '平局' : getSchemeName(item.winner)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white">
        <h2 className="text-xl font-bold mb-4">💡 选型建议</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-bold mb-2">选择 CAF 如果...</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• 需要企业级集群部署</li>
              <li>• 追求高性能通信</li>
              <li>• 有专业的运维团队</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="font-bold mb-2">选择 ASI 如果...</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• 处理复杂创新任务</li>
              <li>• 需要自适应能力</li>
              <li>• 追求前沿技术</li>
            </ul>
          </div>
          <div className="bg-white/10 rounded-lg p-4 border-2 border-yellow-400">
            <h3 className="font-bold mb-2">🏆 选择 OCS 如果...</h3>
            <ul className="text-sm space-y-1 opacity-90">
              <li>• 通用场景，团队协作为主</li>
              <li>• 希望渐进式采用</li>
              <li>• 需要贴近真实组织</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comparison;
