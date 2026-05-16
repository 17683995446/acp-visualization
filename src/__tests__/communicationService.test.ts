import { describe, it, expect } from 'vitest';
import { CommunicationService } from '../services/CommunicationService';
import type { Message } from '../types';

const mockMessages: Message[] = [
  { id: 'm1', from: 'a1', to: 'a2', type: 'request', content: '请协助', timestamp: 1000, read: false },
  { id: 'm2', from: 'a2', to: 'a1', type: 'response', content: '收到', timestamp: 2000, read: true },
  { id: 'm3', from: 'a1', to: 'a3', type: 'notification', content: '任务完成', timestamp: 3000, read: false },
  { id: 'm4', from: 'a3', to: 'a1', type: 'task', content: '新任务', timestamp: 4000, read: true },
  { id: 'm5', from: 'a2', to: 'a3', type: 'request', content: '帮忙', timestamp: 5000, read: false },
];

describe('CommunicationService', () => {
  it('should filter by type', () => {
    const requests = CommunicationService.filterByType(mockMessages, 'request');
    expect(requests).toHaveLength(2);
    expect(requests.every(m => m.type === 'request')).toBe(true);
    expect(requests.map(m => m.id)).toEqual(['m1', 'm5']);

    const tasks = CommunicationService.filterByType(mockMessages, 'task');
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('m4');

    const responses = CommunicationService.filterByType(mockMessages, 'response');
    expect(responses).toHaveLength(1);
    expect(responses[0].id).toBe('m2');

    const notifications = CommunicationService.filterByType(mockMessages, 'notification');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].id).toBe('m3');
  });

  it('should get conversation between two members', () => {
    const conversation = CommunicationService.getConversation(mockMessages, 'a1', 'a2');
    expect(conversation).toHaveLength(2);
    expect(conversation[0].id).toBe('m1');
    expect(conversation[1].id).toBe('m2');
    // Should be sorted by timestamp ascending
    expect(conversation[0].timestamp).toBeLessThan(conversation[1].timestamp);

    const conversation2 = CommunicationService.getConversation(mockMessages, 'a2', 'a3');
    expect(conversation2).toHaveLength(1);
    expect(conversation2[0].id).toBe('m5');

    const conversation3 = CommunicationService.getConversation(mockMessages, 'a1', 'a3');
    expect(conversation3).toHaveLength(2);
    expect(conversation3.map(m => m.id)).toEqual(['m3', 'm4']);
  });

  it('should get messages for a member', () => {
    const messagesForA1 = CommunicationService.getMessagesForMember(mockMessages, 'a1');
    expect(messagesForA1).toHaveLength(4);
    expect(messagesForA1.map(m => m.id)).toEqual(['m1', 'm2', 'm3', 'm4']);

    const messagesForA2 = CommunicationService.getMessagesForMember(mockMessages, 'a2');
    expect(messagesForA2).toHaveLength(3);
    expect(messagesForA2.map(m => m.id)).toEqual(['m1', 'm2', 'm5']);

    const messagesForA3 = CommunicationService.getMessagesForMember(mockMessages, 'a3');
    expect(messagesForA3).toHaveLength(3);
    expect(messagesForA3.map(m => m.id)).toEqual(['m3', 'm4', 'm5']);
  });

  it('should count unread messages', () => {
    const unreadA1 = CommunicationService.getUnreadCount(mockMessages, 'a1');
    // m2 (to=a1, read=true) and m4 (to=a1, read=true) are both read => 0 unread
    expect(unreadA1).toBe(0);

    const unreadA2 = CommunicationService.getUnreadCount(mockMessages, 'a2');
    expect(unreadA2).toBe(1); // m1 (request) is unread

    const unreadA3 = CommunicationService.getUnreadCount(mockMessages, 'a3');
    // m3 (to=a3, read=false) and m5 (to=a3, read=false) => 2 unread
    expect(unreadA3).toBe(2);

    const unreadUnknown = CommunicationService.getUnreadCount(mockMessages, 'unknown');
    expect(unreadUnknown).toBe(0);
  });

  it('should get message stats', () => {
    const stats = CommunicationService.getMessageStats(mockMessages);
    expect(stats.total).toBe(5);
    expect(stats.task).toBe(1);
    expect(stats.notification).toBe(1);
    expect(stats.request).toBe(2);
    expect(stats.response).toBe(1);
  });

  it('should return empty for non-existent conversation', () => {
    const conversation = CommunicationService.getConversation(mockMessages, 'a1', 'nonexistent');
    expect(conversation).toHaveLength(0);

    const conversation2 = CommunicationService.getConversation(mockMessages, 'nonexistent1', 'nonexistent2');
    expect(conversation2).toHaveLength(0);
  });
});
