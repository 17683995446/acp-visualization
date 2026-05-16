import type { Message } from '../types';

export class CommunicationService {
  static filterByType(messages: Message[], type: Message['type']): Message[] {
    return messages.filter(m => m.type === type);
  }

  static getConversation(messages: Message[], member1Id: string, member2Id: string): Message[] {
    return messages.filter(m =>
      (m.from === member1Id && m.to === member2Id) ||
      (m.from === member2Id && m.to === member1Id)
    ).sort((a, b) => a.timestamp - b.timestamp);
  }

  static getMessagesForMember(messages: Message[], memberId: string): Message[] {
    return messages.filter(m => m.from === memberId || m.to === memberId);
  }

  static getUnreadCount(messages: Message[], memberId: string): number {
    return messages.filter(m => m.to === memberId && !m.read).length;
  }

  static getMessageStats(messages: Message[]) {
    return {
      total: messages.length,
      task: messages.filter(m => m.type === 'task').length,
      notification: messages.filter(m => m.type === 'notification').length,
      request: messages.filter(m => m.type === 'request').length,
      response: messages.filter(m => m.type === 'response').length,
    };
  }
}
