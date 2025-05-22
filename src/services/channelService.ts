import { ref } from 'vue';

export interface TaskMessage {
  type: 'task';
  taskId: string;
  imageData: string;
  positivePrompt: string;
  negativePrompt: string;
}

export interface StatusMessage {
  type: 'status';
  taskId: string;
  status: string;
  progress?: number;
  total?: number;
}

export interface ResultMessage {
  type: 'result';
  taskId: string;
  imageUrl: string;
}

export type ChannelMessage = TaskMessage | StatusMessage | ResultMessage;

// 通信策略接口，用于支持不同的通信方式
export interface CommunicationStrategy {
  send(message: ChannelMessage): void;
  receive(callback: (message: ChannelMessage) => void): () => void;
  close(): void;
}

// 基于 BroadcastChannel 的通信策略（同一浏览器内的标签页通信）
class BroadcastChannelStrategy implements CommunicationStrategy {
  private channel: BroadcastChannel;
  private listeners: Set<(message: ChannelMessage) => void>;
  
  constructor(channelName: string = 'img2img-channel') {
    this.channel = new BroadcastChannel(channelName);
    this.listeners = new Set();
    
    this.channel.onmessage = (event) => {
      this.listeners.forEach(listener => listener(event.data));
    };
  }
  
  send(message: ChannelMessage): void {
    this.channel.postMessage(message);
  }
  
  receive(callback: (message: ChannelMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  close(): void {
    this.channel.close();
    this.listeners.clear();
  }
}

// 基于 LocalStorage 的通信策略（备用方案，兼容性更好）
class LocalStorageStrategy implements CommunicationStrategy {
  private storageKey: string;
  private listeners: Set<(message: ChannelMessage) => void>;
  
  constructor(storageKey: string = 'img2img-messages') {
    this.storageKey = storageKey;
    this.listeners = new Set();
    
    window.addEventListener('storage', (event) => {
      if (event.key === this.storageKey && event.newValue) {
        try {
          const message = JSON.parse(event.newValue) as ChannelMessage;
          this.listeners.forEach(listener => listener(message));
        } catch (error) {
          console.error('解析消息失败:', error);
        }
      }
    });
  }
  
  send(message: ChannelMessage): void {
    // 添加时间戳确保事件触发
    const messageWithTimestamp = { ...message, _timestamp: Date.now() };
    localStorage.setItem(this.storageKey, JSON.stringify(messageWithTimestamp));
  }
  
  receive(callback: (message: ChannelMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  close(): void {
    this.listeners.clear();
  }
}

// 通信服务类，使用策略模式支持不同的通信方式
class CommunicationService {
  private strategy: CommunicationStrategy;
  
  constructor(strategy: CommunicationStrategy) {
    this.strategy = strategy;
  }
  
  setStrategy(strategy: CommunicationStrategy): void {
    this.strategy.close();
    this.strategy = strategy;
  }
  
  send(message: ChannelMessage): void {
    this.strategy.send(message);
  }
  
  receive(callback: (message: ChannelMessage) => void): () => void {
    return this.strategy.receive(callback);
  }
  
  close(): void {
    this.strategy.close();
  }
}

// 创建默认的通信服务实例（使用 BroadcastChannel 策略）
export const communicationService = new CommunicationService(
  new BroadcastChannelStrategy()
);

// 提供一个组合式函数来方便使用
export function useCommunication() {
  const lastMessage = ref<ChannelMessage | null>(null);
  
  const unsubscribe = communicationService.receive((message) => {
    lastMessage.value = message;
  });
  
  return {
    lastMessage,
    send: communicationService.send.bind(communicationService),
    unsubscribe
  };
}

// 为了向后兼容，保留原有的 channelService
export const channelService = {
  subscribe: (callback: (message: ChannelMessage) => void) => 
    communicationService.receive(callback),
  publish: (message: ChannelMessage) => 
    communicationService.send(message),
  close: () => communicationService.close()
};

// 提供原有的 useChannel 函数
export function useChannel() {
  return useCommunication();
}