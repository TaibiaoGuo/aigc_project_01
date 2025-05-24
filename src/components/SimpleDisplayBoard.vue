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
  receivedMessage: null as any
});

// 通信服务
const { lastMessage, send, unsubscribe } = useCommunication();

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
  
  // 监听消息
  const unsubscribeFunc = useCommunication().receive((message) => {
    console.log('收到消息:', message);
    displaySettings.receivedMessage = message;
    messageReceived.value = true;
    
    // 更新连接状态
    if (message.type === 'status' && message.status === 'handshake') {
      handleHandshake(message);
    } else if (message.type === 'status' && message.status === 'heartbeat') {
      updateConnectionStatus();
    } else if (message.type === 'task' && message.imageData) {
      displayImage(message.imageData);
      updateConnectionStatus();
    } else if (message.type === 'result' && message.imageUrl) {
      // 处理结果图片URL
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
      img.src = message.imageUrl;
      updateConnectionStatus();
    }
  });
  
  // 发送初始握手消息
  sendHandshake();
  
  // 启动连接状态轮询
  startConnectionPolling();
});

// 组件卸载时移除事件监听器和定时器
onBeforeUnmount(() => {
  unsubscribe();
  stopConnectionPolling();
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
  connectionStatus.connected = true;
  connectionStatus.lastHeartbeat = Date.now();
  connectionStatus.retryCount = 0;
  
  // 发送确认消息
  send({
    type: 'status',
    taskId: 'display-board',
    status: 'connected',
    progress: 100,
    total: 100
  });
  console.log('连接已建立');
}

// 更新连接状态
function updateConnectionStatus() {
  connectionStatus.connected = true;
  connectionStatus.lastHeartbeat = Date.now();
  connectionStatus.retryCount = 0;
}

// 启动连接状态轮询
function startConnectionPolling() {
  if (pollingTimer) return;
  
  pollingTimer = window.setInterval(() => {
    const now = Date.now();
    const elapsed = now - connectionStatus.lastHeartbeat;
    
    // 如果超过10秒没有收到心跳，认为连接断开
    if (connectionStatus.connected && elapsed > 10000) {
      connectionStatus.connected = false;
    }
    
    // 如果未连接，尝试重新发送握手
    if (!connectionStatus.connected) {
      if (connectionStatus.retryCount < connectionStatus.maxRetries) {
        sendHandshake();
        connectionStatus.retryCount++;
        console.log(`重试连接 (${connectionStatus.retryCount}/${connectionStatus.maxRetries})`);
      }
    } else {
      // 发送心跳消息
      sendHeartbeat();
    }
  }, connectionStatus.pollingInterval);
}

// 停止连接状态轮询
function stopConnectionPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

// 发送心跳消息
function sendHeartbeat() {
  send({
    type: 'status',
    taskId: 'display-board',
    status: 'heartbeat',
    progress: 100,
    total: 100
  });
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
    clearCanvas();
    
    // 计算图片缩放比例，保持宽高比
    const canvas = canvasRef.value!;
    const context = ctx.value!;
    
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
  
  // 添加 base64 前缀
  img.src = `data:image/png;base64,${imageData}`;
  displaySettings.receivedImage = img.src;
}

// 发送消息到其他标签页
function sendMessage() {
  send({
    type: 'status',
    taskId: 'display-board',
    status: 'ready'
  });
}

// 返回上一页
const goBack = () => {
  router.go(-1);
};
</script>

<template>
  <div class="fixed w-full h-full overflow-hidden m-0 p-0 bg-cover bg-center bg-blend-normal display-container">
    <!-- 顶部导航栏 - 包含返回按钮和Logo -->
    <div class="absolute top-[3%] left-0 right-0 w-full flex flex-row justify-between items-center px-[3%] box-border z-10">
      <div class="flex flex-row items-center">
        <div class="flex flex-row justify-center items-center gap-4 cursor-pointer" @click="goBack">
          <div class="back-button-bg relative">
            <div class="back-arrow"></div>
          </div>
          <div class="title-text">显示交互区域</div>
        </div>
      </div>
      <div class="flex items-center">
        <img src="@/assets/images/logo.svg" alt="艺启创" class="h-10 pointer-events-none" />
      </div>
    </div>
    
    <!-- 连接状态指示器 -->
    <div class="connection-status" :class="{ 'connected': connectionStatus.connected, 'disconnected': !connectionStatus.connected }">
      {{ connectionStatus.connected ? '已连接' : '未连接' }}
    </div>
    
    <!-- 主要内容区域 - 画布和按钮并排 -->
    <div class="absolute bottom-[6%] left-[3%] w-[94%] h-[80%] flex flex-row justify-start items-center gap-4">
      <!-- 画布区域 -->
      <div class="h-full flex-1 flex justify-start items-center">
        <canvas
          ref="canvasRef"
          :width="displaySettings.canvasWidth"
          :height="displaySettings.canvasHeight"
          class="bg-white rounded-lg border-[5px] border-white shadow-md w-full h-full"
        ></canvas>
      </div>
    </div>
    
    <!-- 消息接收状态指示器 -->
    <div v-if="messageReceived" class="message-indicator">
      已接收消息
    </div>
  </div>
</template>

<style scoped>
.display-container {
  background-image: url('@/assets/images/创意中心骨架UI.png'), url('@/assets/images/独特渐变.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: plus-darker, normal;
}

.back-button-bg {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.back-arrow {
  width: 12px;
  height: 12px;
  border-top: 2px solid white;
  border-left: 2px solid white;
  transform: rotate(-45deg);
  margin-left: 5px;
}

.title-text {
  font-family: 'A10', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 24px;
  line-height: 1.2;
  color: white;
  text-shadow: 0px 2px 4px rgba(0, 0, 0, 0.3);
}

.tool-button-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tool-button-wrapper:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.3);
}

.tool-button-wrapper:active {
  transform: scale(0.95);
}

.button-image {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.active-tool {
  background: rgba(255, 255, 255, 0.4);
  box-shadow: 0px 0px 15px rgba(255, 255, 255, 0.5);
}

.message-indicator {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 255, 0, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.5s ease-in-out;
}

.connection-status {
  position: absolute;
  top: 20px;
  left: 20px;
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  color: white;
  z-index: 20;
  font-size: 14px;
  transition: all 0.3s ease;
}

.connected {
  background: rgba(0, 255, 0, 0.2);
}

.disconnected {
  background: rgba(255, 0, 0, 0.2);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>