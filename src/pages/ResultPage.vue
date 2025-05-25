<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute } from 'vue-router';
import ResultDisplay from '@/components/ResultDisplay.vue';
import { getGeneratedImage, createWebSocketConnection } from '@/services/comfyuiService';
import { useCommunication, ChannelMessage } from '@/services/channelService';

const route = useRoute();
const { lastMessage, send, unsubscribe } = useCommunication();

const width = ref(512);
const height = ref(512);
const resultImage = ref('');
const isLoading = ref(true);
const errorMessage = ref('');
const processingStatus = ref('等待接收数据...');

// 从 URL 获取会话 ID
const sessionId = route.query.sessionId as string;
let wsConnection: any = null;

// 初始化WebSocket连接
function initWebSocket() {
  if (!sessionId) {
    errorMessage.value = '未提供会话ID';
    isLoading.value = false;
    return;
  }
  
  wsConnection = createWebSocketConnection(sessionId, {
    onOpen: () => {
      processingStatus.value = '已连接到服务器，等待处理...';
    },
    onMessage: async (data) => {
      // 更新状态
      if (data.status) {
        processingStatus.value = data.message || `状态: ${data.status}`;
        
        if (data.progress) {
          processingStatus.value = `正在处理中 (${data.progress * 100}%)...`;
        }
        
        // 如果处理完成，获取结果图像
        if (data.status === 'completed' && data.result_url) {
          try {
            resultImage.value = await getGeneratedImage(sessionId);
            isLoading.value = false;
          } catch (error) {
            console.error('获取结果图像时出错:', error);
            errorMessage.value = '获取结果图像失败';
            isLoading.value = false;
          }
        }
        
        // 如果处理出错
        if (data.status === 'error') {
          errorMessage.value = data.message || '处理图像时出错';
          isLoading.value = false;
        }
      }
    },
    onError: () => {
      errorMessage.value = 'WebSocket连接错误';
      isLoading.value = false;
    },
    onClose: () => {
      console.log('WebSocket连接已关闭');
    }
  });
}

// 在页面加载时初始化WebSocket
onMounted(() => {
  initWebSocket();
  
  // 发送就绪消息
  send({
    type: 'status',
    taskId: 'system',
    status: 'ready'
  });
});

// 组件卸载时关闭WebSocket连接
onBeforeUnmount(() => {
  if (wsConnection) {
    wsConnection.close();
  }
  unsubscribe();
});
</script>

<style scoped>
.result-page-container {
  max-width: 800px;
  margin: 0 auto;
}
</style>