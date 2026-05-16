import React, { useState } from 'react';
import { 
  ExternalLink,
  Star,
  Search
} from 'lucide-react';
import { openSourceTools } from '../data/demo';

const categories = ['全部', '消息队列', '工作流引擎', '知识图谱', '向量检索', '可观测性', '分布式追踪', '指标监控', '可视化', '缓存/锁', '关系数据库', '测试框架', 'E2E测试'];

const ToolCard: React.FC<{ tool: typeof openSourceTools[0] }> = ({ tool }) => (
  <a
    href={tool.url}
    target="_blank"
    rel="noopener noreferrer"
    className="block bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all group"
  >
    <div className="flex items-start justify-between mb-3">
      <div>
        <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-500">{tool.category}</p>
      </div>
      <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transition-colors" />
    </div>
    
    <p className="text-sm text-gray-600 mb-3">{tool.description}</p>
    
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center space-x-1 text-yellow-600">
        <Star className="w-3 h-3 fill-current" />
        <span>{tool.stars.toLocaleString()}</span>
      </div>
      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
        {tool.license}
      </span>
    </div>
  </a>
);

const Tools: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [search, setSearch] = useState('');

  const filteredTools = openSourceTools.filter(tool => {
    const matchesCategory = selectedCategory === '全部' || tool.category === selectedCategory;
    const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) ||
                          tool.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">开源工具集</h1>
        <p className="text-gray-500 mt-1">站在巨人的肩膀上，不重复造轮子</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">总工具数</p>
          <p className="text-2xl font-bold text-gray-900">{openSourceTools.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">总 Stars</p>
          <p className="text-2xl font-bold text-gray-900">
            {(openSourceTools.reduce((sum, t) => sum + t.stars, 0) / 1000).toFixed(0)}K
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">类别数</p>
          <p className="text-2xl font-bold text-gray-900">{categories.length - 1}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <p className="text-sm text-gray-500">开源协议</p>
          <p className="text-2xl font-bold text-gray-900">多种</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索工具..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTools.map(tool => (
          <ToolCard key={tool.name} tool={tool} />
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">没有找到匹配的工具</p>
        </div>
      )}

      {/* Philosophy */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">开源选型原则</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: '优先 CNCF 项目', desc: '云原生基金会毕业项目，经过生产验证' },
            { title: '社区活跃', desc: 'Stars > 1000，近期有提交，维护活跃' },
            { title: '大厂背书', desc: '有商业支持或被大公司广泛使用' },
            { title: '文档完善', desc: '文档齐全，生态丰富，易于上手' },
          ].map((item, i) => (
            <div key={i} className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold">{i + 1}</span>
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm opacity-80">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Tools;
