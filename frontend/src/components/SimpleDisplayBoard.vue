<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useCommunication } from '@/services/channelService';

const router = useRouter();

// 状态管理
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// 添加历史记录相关状态
const history = ref<string[]>([]);
const currentHistoryIndex = ref(-1);

// 显示设置
const displaySettings = reactive({
  canvasWidth: 640,  // 16:9 比例
  canvasHeight: 360, // 16:9 比例
  showControls: true,
  receivedImage: null as string | null,
  receivedMessage: null as any,
  isAIGenerating: false, // AI生成状态标志
  isDraftDisplayed: false, // 草稿显示状态标志
  hasNetworkError: false, // 网络错误状态标志
  requestTimeout: 60000, // 请求超时时间（毫秒）
  requestTimer: null as number | null // 请求计时器
});

// 通信服务
const { lastMessage, send, receive, unsubscribe } = useCommunication();

// 监听接收到的消息
const messageReceived = ref(false);

// 连接状态管理
const connectionStatus = reactive({
  connected: false,
  lastHeartbeat: 0,
  retryCount: 0,
  maxRetries: 5,
  pollingInterval: 3000, // 3秒轮询一次
});

// 轮询定时器
let pollingTimer: number | null = null;

// 初始化画布
onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;
  
  ctx.value = canvas.getContext('2d');
  if (!ctx.value) return;
  
  // 设置画布背景为白色
  ctx.value.fillStyle = '#ffffff';
  ctx.value.fillRect(0, 0, displaySettings.canvasWidth, displaySettings.canvasHeight);
  
  // 保存初始状态到历史记录
  saveToHistory();
  
  // 在监听消息的回调函数中添加对后端WebSocket消息的处理
  const unsubscribeFunc = receive((message) => {
    console.log('收到消息:', message);
    displaySettings.receivedMessage = message;
    messageReceived.value = true;
    
    // 更新连接状态
    if (message.type === 'status' && message.status === 'handshake') {
      handleHandshake(message);
    } else if (message.type === 'status' && message.status === 'heartbeat') {
      updateConnectionStatus();
    } else if (message.type === 'canvas_update' && message.imageData) {
      // 直接显示画布数据
      displayImage(message.imageData);
      updateConnectionStatus();
    } else if (message.type === 'task' && message.imageData) {
      // 显示草稿图像
      displaySettings.isDraftDisplayed = true;
      displaySettings.hasNetworkError = false; // 重置错误状态
      displayImage(message.imageData);
      updateConnectionStatus();
    } else if (message.type === 'status' && message.status === 'generating') {
      // 标记AI正在生成中
      displaySettings.isAIGenerating = true;
      displaySettings.hasNetworkError = false; // 重置错误状态
      
      // 设置请求超时计时器
      startRequestTimeoutTimer();
    } else if (message.type === 'status' && message.status === 'processing') {
      // 处理后端处理状态更新
      displaySettings.isAIGenerating = true;
      displaySettings.hasNetworkError = false;
      // 重置超时计时器
      startRequestTimeoutTimer();
    } else if (message.type === 'status' && message.status === 'error') {
      // 处理错误状态
      handleRequestError();
    } else if (message.type === 'result' && message.imageUrl) {
      // 处理结果图片URL - AI生成完成
      clearRequestTimeoutTimer(); // 清除超时计时器
      displaySettings.isAIGenerating = false;
      displaySettings.hasNetworkError = false; // 重置错误状态
      
      // 获取图像URL
      const imageUrl = message.imageUrl.startsWith('http') 
        ? message.imageUrl 
        : `${window.location.origin}${message.imageUrl}`;
      
      const img = new Image();
      img.onload = () => {
        if (!canvasRef.value || !ctx.value) return;
        
        // 清空画布
        clearCanvas();
        
        // 计算图片缩放比例，保持宽高比
        const canvas = canvasRef.value;
        const context = ctx.value;
        
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );
        
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        // 绘制图片
        context.drawImage(
          img,
          0, 0, img.width, img.height,
          x, y, img.width * scale, img.height * scale
        );
        
        // 保存到历史记录
        saveToHistory();
      };
      img.src = imageUrl;
      updateConnectionStatus();
    }
  });
});

function startRequestTimeoutTimer() {
  // 先清除可能存在的计时器
  clearRequestTimeoutTimer();
  
  // 设置新的计时器
  displaySettings.requestTimer = window.setTimeout(() => {
    handleRequestError();
  }, displaySettings.requestTimeout);
}

// 清除请求超时计时器
function clearRequestTimeoutTimer() {
  if (displaySettings.requestTimer) {
    clearTimeout(displaySettings.requestTimer);
    displaySettings.requestTimer = null;
  }
}

// 处理请求错误
function handleRequestError() {
  displaySettings.isAIGenerating = false;
  displaySettings.hasNetworkError = true;
  clearRequestTimeoutTimer();
  
  // 发送错误状态通知
  send({
    type: 'status',
    taskId: 'display-board',
    status: 'error',
    progress: 0,
    total: 100
  });
}

// 组件卸载时移除事件监听器和定时器
onBeforeUnmount(() => {
  unsubscribe();
  stopConnectionPolling();
  clearRequestTimeoutTimer();
});

// 发送握手消息
function sendHandshake() {
  send({
    type: 'status',
    taskId: 'display-board',
    status: 'handshake',
    progress: 0,
    total: 100
  });
  console.log('发送握手消息');
}

// 处理握手响应
function handleHandshake(message: any) {
  updateConnectionStatus();
}

// 更新连接状态
function updateConnectionStatus() {
  connectionStatus.connected = true;
  connectionStatus.lastHeartbeat = Date.now();
  connectionStatus.retryCount = 0;
}

// 停止连接轮询
function stopConnectionPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

// 清空画布
function clearCanvas() {
  if (!ctx.value || !canvasRef.value) return;
  
  ctx.value.fillStyle = '#ffffff';
  ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  
  // 清空后保存到历史记录
  saveToHistory();
}

// 保存当前状态到历史记录
function saveToHistory() {
  if (!canvasRef.value) return;
  
  // 获取当前画布状态
  const dataUrl = canvasRef.value.toDataURL('image/png');
  
  // 如果当前索引不是最后一个，删除后面的历史记录
  if (currentHistoryIndex.value < history.value.length - 1) {
    history.value = history.value.slice(0, currentHistoryIndex.value + 1);
  }
  
  // 添加到历史记录
  history.value.push(dataUrl);
  currentHistoryIndex.value = history.value.length - 1;
}

// 撤销操作
function undo() {
  if (currentHistoryIndex.value > 0) {
    currentHistoryIndex.value--;
    restoreFromHistory();
  }
}

// 从历史记录恢复
function restoreFromHistory() {
  if (!canvasRef.value || !ctx.value) return;
  
  const img = new Image();
  img.onload = () => {
    ctx.value?.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);
    ctx.value?.drawImage(img, 0, 0);
  };
  img.src = history.value[currentHistoryIndex.value];
}

// 显示图片
function displayImage(imageData: string) {
  if (!canvasRef.value || !ctx.value) return;
  
  const img = new Image();
  img.onload = () => {
    // 清空画布
    ctx.value!.clearRect(0, 0, canvasRef.value!.width, canvasRef.value!.height);
    
    // 直接绘制图片，保持原始尺寸
    ctx.value!.drawImage(img, 0, 0, canvasRef.value!.width, canvasRef.value!.height);
  };
  
  // 直接使用完整的 data URL
  img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
}

// 发送消息到其他标签页
function sendMessage() {
  send({
    type: 'status',
    taskId: 'display-board',
    status: 'ready'
  });
}
</script>

<template>
  <div class="fixed w-full h-full overflow-hidden m-0 p-0 bg-cover bg-center bg-blend-normal display-container">
    <!-- 顶部只保留Logo -->
    <div class="absolute top-[3%] right-[3%] flex items-center z-10">
      <img src="@/assets/images/logo.svg" alt="艺启创" class="h-10 pointer-events-none" />
    </div>
    
    <!-- 主要内容区域 - 画布 -->
    <div class="absolute top-[10%] left-[3%] w-[94%] h-[80%] flex justify-center items-center">
      <canvas
        ref="canvasRef"
        :width="displaySettings.canvasWidth"
        :height="displaySettings.canvasHeight"
        class="bg-white rounded-lg border-[5px] border-white shadow-md w-full h-full"
      ></canvas>
    </div>
    
    <!-- 底部状态区域 -->
    <div class="absolute bottom-[3%] left-0 right-0 flex flex-row items-center justify-center gap-4">
      <!-- AIGC实时生成画面文本 -->
      <div class="aigc-status-text mb-2">
        <span v-if="displaySettings.hasNetworkError" class="text-red-500">网络错误</span>
        <span v-else-if="displaySettings.isAIGenerating">AIGC正在生成画面...</span>
        <span v-else-if="displaySettings.isDraftDisplayed && !displaySettings.isAIGenerating">显示草稿画面</span>
        <span v-else>AIGC实时生成画面</span>
      </div>
      
      <!-- 连接状态指示器 -->
      <div class="connection-status-wrapper">
        <div class="connection-status" :class="{ 'connected': connectionStatus.connected, 'disconnected': !connectionStatus.connected, 'error': displaySettings.hasNetworkError }">
          <span v-if="displaySettings.hasNetworkError">网络错误</span>
          <span v-else>{{ connectionStatus.connected ? '已连接' : '未连接' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.display-container {
  background-image: url('@/assets/images/ui-skeleton.png'), url('@/assets/images/gradient.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: plus-darker, normal;
}

.aigc-status-text {
  font-family: 'A10', sans-serif;
  font-size: 24px;
  color: white;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.5);
  padding: 8px 20px;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(5px);
  border-radius: 30px;
  letter-spacing: 1px;
}

.connection-status-wrapper {
  display: flex;
  justify-content: center;
}

.connection-status {
  padding: 6px 16px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
}

.connection-status::before {
  content: '';
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.connected {
  background: rgba(0, 255, 0, 0.5);
}

.connected::before {
  background-color: #00ff00;
  box-shadow: 0 0 8px #00ff00;
}

.disconnected {
  background: rgba(255, 0, 0, 0.2);
}

.disconnected::before {
  background-color: #ff0000;
  box-shadow: 0 0 8px #ff0000;
}

.error {
  background: rgba(255, 0, 0, 0.5);
}

.error::before {
  background-color: #ff0000;
  box-shadow: 0 0 8px #ff0000;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>