import React, { useState } from 'react';
import { 
  Box,
  Layers,
  Database,
  Activity,
  Server,
  ArrowRight
} from 'lucide-react';

const architectureLayers = [
  {
    name: '应用层',
    icon: Box,
    color: 'from-blue-500 to-blue-600',
    components: ['CLI', 'Web UI', 'REST API', 'SDK'],
  },
  {
    name: '服务层',
    icon: Layers,
    color: 'from-purple-500 to-purple-600',
    components: ['Org Service', 'Task Service', 'Agent Service', 'Knowledge Service'],
  },
  {
    name: '核心层',
    icon: Activity,
    color: 'from-orange-500 to-orange-600',
    components: ['Intent Engine', 'Workflow Engine', 'Reputation Engine', 'Bidding Engine'],
  },
  {
    name: '适配层',
    icon: Server,
    color: 'from-green-500 to-green-600',
    components: ['Kafka Adapter', 'Temporal Adapter', 'Neo4j Adapter', 'Milvus Adapter'],
  },
  {
    name: '基础设施',
    icon: Database,
    color: 'from-gray-500 to-gray-600',
    components: ['PostgreSQL', 'Redis', 'Kafka', 'Neo4j', 'Milvus'],
  },
];

const Architecture: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">架构设计</h1>
        <p className="text-gray-500 mt-1">高度模块化、产品化的 Agent 集群平台架构</p>
      </div>

      {/* Architecture Diagram */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">分层架构</h2>
        
        <div className="space-y-4">
          {architectureLayers.map((layer, index) => {
            const Icon = layer.icon;
            const isSelected = selectedLayer === index;
            
            return (
              <div key={layer.name}>
                <button
                  onClick={() => setSelectedLayer(isSelected ? null : index)}
                  className={`w-full p-4 rounded-lg bg-gradient-to-r ${layer.color} text-white text-left transition-all ${
                    isSelected ? 'ring-4 ring-offset-2 ring-gray-300' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-6 h-6" />
                      <span className="font-semibold text-lg">{layer.name}</span>
                    </div>
                    <ArrowRight className={`w-5 h-5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                
                {isSelected && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {layer.components.map(comp => (
                        <div 
                          key={comp}
                          className="p-3 bg-white rounded-lg border border-gray-200 text-center"
                        >
                          <p className="text-sm font-medium text-gray-700">{comp}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {index < architectureLayers.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className="w-0.5 h-4 bg-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Interfaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">核心接口</h2>
          <div className="space-y-3">
            {[
              { name: 'IOrganizationService', methods: ['create', 'addMember', 'checkPermission', 'getPerformance'] },
              { name: 'ITaskService', methods: ['create', 'schedule', 'assign', 'getStatus'] },
              { name: 'ICommunicationService', methods: ['send', 'publish', 'subscribe', 'request'] },
              { name: 'IKnowledgeService', methods: ['addEntity', 'addRelation', 'search', 'traverse'] },
            ].map(iface => (
              <div key={iface.name} className="p-3 bg-gray-50 rounded-lg">
                <p className="font-mono text-sm font-medium text-primary-600">{iface.name}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {iface.methods.map(m => (
                    <span key={m} className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                      {m}()
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">设计原则</h2>
          <div className="space-y-3">
            {[
              { title: '单一职责 (SRP)', desc: '每个模块只做一件事，做好一件事' },
              { title: '接口隔离 (ISP)', desc: '模块间通过定义良好的接口通信' },
              { title: '依赖倒置 (DIP)', desc: '高层模块不依赖低层模块，都依赖抽象' },
              { title: '可替换性', desc: '任何模块都可以被同等接口的实现替换' },
              { title: '可测试性', desc: '每个模块都有独立的单元测试' },
              { title: '可观测性', desc: '每个模块暴露健康检查、指标、日志' },
            ].map(principle => (
              <div key={principle.title} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary-600 text-xs font-bold">✓</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{principle.title}</p>
                  <p className="text-sm text-gray-500">{principle.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Flow */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">数据流</h2>
        <div className="flex items-center justify-center space-x-4 overflow-x-auto py-4">
          {['用户输入', 'CLI/API', '服务层', '核心引擎', '适配层', '基础设施'].map((step, i, arr) => (
            <React.Fragment key={step}>
              <div className="flex-shrink-0 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium">
                {step}
              </div>
              {i < arr.length - 1 && (
                <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Architecture;
