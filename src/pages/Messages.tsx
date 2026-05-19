/**
 * Messages 消息中心 - Agent 通信/消息管理页面
 * 基于 Zustand Store 驱动，支持消息发送、过滤与统计
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Filter,
  User,
  CheckCheck,
} from 'lucide-react';
import { useACPStore } from '../store/acpStore';
import type { Message } from '../types';

type MessageType = Message['type'];
type FilterType = 'all' | MessageType;

const messageTypeLabels: Record<MessageType, string> = {
  task: '任务',
  notification: '通知',
  request: '请求',
  response: '响应',
};

const messageTypeBadgeStyles: Record<MessageType, string> = {
  task: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  notification: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  request: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  response: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
};

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'task', label: '任务' },
  { value: 'notification', label: '通知' },
  { value: 'request', label: '请求' },
  { value: 'response', label: '响应' },
];

const Messages: React.FC = () => {
  const messages = useACPStore(s => s.messages);
  const organization = useACPStore(s => s.organization);
  const sendMessage = useACPStore(s => s.sendMessage);
  const markAllMessagesAsRead = useACPStore(s => s.markAllMessagesAsRead);
  const members = organization.members;

  // 表单状态
  const [fromId, setFromId] = useState<string>(members[0]?.id ?? '');

  // 当 members 从空变为非空时，自动设置 fromId 默认值
  useEffect(() => {
    if (members.length > 0 && !fromId) {
      setFromId(members[0].id);
    }
  }, [members, fromId]);
  const [toId, setToId] = useState<string>('');
  const [msgType, setMsgType] = useState<MessageType>('notification');
  const [content, setContent] = useState<string>('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // 可选的收件人列表（排除当前发件人）
  const availableRecipients = useMemo(
    () => members.filter((m) => m.id !== fromId),
    [members, fromId]
  );

  // 当发件人变更时，如果当前收件人不在可选列表中，则重置
  const handleFromChange = (newFromId: string) => {
    setFromId(newFromId);
    if (toId === newFromId) {
      setToId('');
    }
  };

  // 过滤后的消息（最新在前）
  const filteredMessages = useMemo(() => {
    const sorted = [...messages].sort((a, b) => b.timestamp - a.timestamp);
    if (filterType === 'all') return sorted;
    return sorted.filter((m) => m.type === filterType);
  }, [messages, filterType]);

  // 消息统计
  const messageStats = useMemo(() => {
    const total = messages.length;
    const byType = (type: MessageType) => messages.filter((m) => m.type === type).length;
    return {
      total,
      task: byType('task'),
      notification: byType('notification'),
      request: byType('request'),
      response: byType('response'),
    };
  }, [messages]);

  // 未读消息计数
  const unreadCount = useMemo(
    () => messages.filter((m) => !m.read).length,
    [messages]
  );

  // 发送消息
  const handleSend = () => {
    if (!fromId || !toId || !content.trim()) return;
    sendMessage(fromId, toId, msgType, content.trim());
    setContent('');
  };

  // 全部标为已读
  const handleMarkAllRead = () => {
    markAllMessagesAsRead();
  };

  // 根据成员 ID 查找名称
  const getMemberName = (id: string) => {
    return members.find((m) => m.id === id)?.name ?? id;
  };

  // 格式化时间戳
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">消息中心</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Agent 间通信与消息管理</p>
          </div>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center space-x-1.5 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>全部标为已读</span>
            </button>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-4 h-4" />
            <span>共 {messageStats.total} 条消息</span>
          </div>
        </div>
      </div>

      {/* 消息统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 mb-1">全部消息</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{messageStats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-blue-100 dark:border-blue-900/40">
          <p className="text-xs text-blue-400 mb-1">任务</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{messageStats.task}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 mb-1">通知</p>
          <p className="text-2xl font-bold text-gray-600 dark:text-gray-300">{messageStats.notification}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-orange-100 dark:border-orange-900/40">
          <p className="text-xs text-orange-400 mb-1">请求</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{messageStats.request}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-green-100 dark:border-green-900/40">
          <p className="text-xs text-green-400 mb-1">响应</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{messageStats.response}</p>
        </div>
      </div>

      {/* 主体内容：左侧消息列表 + 右侧发送表单 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：消息列表 */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          {/* 过滤器 */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">按类型筛选：</span>
              <div className="flex items-center space-x-1">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterType === opt.value
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 消息列表（可滚动） */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: '600px' }}>
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <MessageSquare className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm">暂无消息</p>
                <p className="text-xs mt-1">在右侧发送第一条消息</p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    !msg.read ? 'bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30' : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  {/* 消息头部：发件人 -> 收件人 + 类型标签 + 时间 */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-primary-500" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getMemberName(msg.from)}
                        </span>
                      </div>
                      <span className="text-gray-400 dark:text-gray-500">&rarr;</span>
                      <div className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-secondary-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {getMemberName(msg.to)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${messageTypeBadgeStyles[msg.type]}`}
                      >
                        {messageTypeLabels[msg.type]}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                  {/* 消息内容 */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{msg.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧：发送消息表单 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5 flex items-center space-x-2">
            <Send className="w-5 h-5 text-primary-500" />
            <span>发送消息</span>
          </h2>

          <div className="space-y-4">
            {/* 发件人 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                发件人
              </label>
              <select
                value={fromId}
                onChange={(e) => handleFromChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            </div>

            {/* 收件人 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                收件人
              </label>
              <select
                value={toId}
                onChange={(e) => setToId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              >
                <option value="">-- 请选择收件人 --</option>
                {availableRecipients.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 消息类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                消息类型
              </label>
              <select
                value={msgType}
                onChange={(e) => setMsgType(e.target.value as MessageType)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              >
                {filterOptions
                  .filter((opt) => opt.value !== 'all')
                  .map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
              </select>
            </div>

            {/* 消息内容 */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                消息内容
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入消息内容..."
                rows={5}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              />
            </div>

            {/* 发送按钮 */}
            <button
              onClick={handleSend}
              disabled={!fromId || !toId || !content.trim()}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-white font-medium transition-all bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>发送消息</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
