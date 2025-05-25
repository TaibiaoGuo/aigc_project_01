


          
# img2img 项目实现指南

本指南将帮助你实现在 SimpleDrawingBoard 组件中添加画图功能，并创建一个新的 ShowDrawedWindow 组件用于展示结果（使用 WebSocket）。

## 目标

1. 在 SimpleDrawingBoard 组件中实现画图功能
2. 创建新的 ShowDrawedWindow 组件用于展示结果
3. 保留两个标签页链接的效果

## 实现步骤

### 1. 创建 ShowDrawedWindow 组件

首先，我们需要创建一个新的 ShowDrawedWindow 组件，用于展示绘图结果：

```vue:d:\janxl\workplace\NodeJS\img2img\src\components\ShowDrawedWindow.vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { useCommunication, TaskMessage } from '@/services/channelService';
import { pollTaskStatus, getGeneratedImage } from '@/services/comfyuiService';

const route = useRoute();
const { lastMessage, send, unsubscribe } = useCommunication();

// 状态管理
const width = ref(512);
const height = ref(512);
const resultImage = ref('');
const isLoading = ref(true);
const errorMessage = ref('');
const processingStatus = ref('等待接收任务...');
const promptId = ref('');

// 从 URL 获取任务 ID
const taskIdFromUrl = route.query.taskId as string;

// 处理任务消息
async function handleTaskMessage(message: TaskMessage) {
  if (taskIdFromUrl && message.taskId !== taskIdFromUrl) {
    return; // 忽略不匹配的任务
  }
  
  try {
    promptId.value = message.taskId;
    isLoading.value = true;
    errorMessage.value = '';
    
    // 更新状态并通知发送方
    const updateStatus = (status: string, progress?: number, total?: number) => {
      processingStatus.value = status;
      send({
        type: 'status',
        taskId: message.taskId,
        status,
        progress,
        total
      });
    };
    
    updateStatus('正在处理图像...');
    
    // 轮询任务状态
    const resultFilename = await pollTaskStatus(message.taskId, (progress, total) => {
      updateStatus(`处理中: ${progress}/${total}`, progress, total);
    });
    
    updateStatus('正在获取生成的图像...');
    
    // 获取生成的图像
    const imageUrl = await getGeneratedImage(resultFilename);
    resultImage.value = imageUrl;
    isLoading.value = false;
    
    // 通知发送方任务完成
    send({
      type: 'result',
      taskId: message.taskId,
      imageUrl
    });
    
  } catch (error) {
    console.error('处理任务时出错:', error);
    errorMessage.value = error instanceof Error ? error.message : '未知错误';
    isLoading.value = false;
    
    // 通知发送方任务失败
    send({
      type: 'error',
      taskId: promptId.value,
      error: errorMessage.value
    });
  }
}

// 处理打印请求
function handlePrintRequest() {
  if (resultImage.value) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>打印 AI 生成图像</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
              img { max-width: 100%; max-height: 100vh; }
            </style>
          </head>
          <body>
            <img src="${resultImage.value}" alt="AI 生成图像" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 300);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }
}

// 监听消息
onMounted(() => {
  // 监听来自其他窗口的消息
  watch(lastMessage, (message) => {
    if (!message) return;
    
    if (message.type === 'task') {
      handleTaskMessage(message as TaskMessage);
    } else if (message.type === 'print') {
      handlePrintRequest();
    }
  });
  
  // 如果有任务 ID，发送就绪消息
  if (taskIdFromUrl) {
    send({
      type: 'ready',
      taskId: taskIdFromUrl
    });
  }
});

// 组件卸载时取消订阅
onBeforeUnmount(() => {
  unsubscribe();
});
</script>

<template>
  <div class="result-window">
    <div class="header">
      <h1>AI 图像生成结果</h1>
    </div>
    
    <div class="content">
      <div 
        class="result-container"
        :style="{width: `${width}px`, height: `${height}px`}"
      >
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p class="status-text">{{ processingStatus }}</p>
        </div>
        <div v-else-if="errorMessage" class="error-state">
          <div class="error-icon">⚠️</div>
          <p class="error-text">{{ errorMessage }}</p>
          <p class="error-hint">请检查 ComfyUI 服务是否正常运行</p>
        </div>
        <img 
          v-else-if="resultImage" 
          :src="resultImage" 
          alt="AI 生成结果" 
          class="result-image"
        />
        <div v-else class="empty-state">
          <p>等待接收图像数据...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.result-window {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  padding: 1rem 2rem;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #333;
}

.content {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.result-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.loading-state, .error-state, .empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.error-text {
  color: #e74c3c;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.error-hint {
  color: #7f8c8d;
  font-size: 0.875rem;
}

.result-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
```

### 2. 修改 SimpleDrawingBoard 组件

接下来，我们需要修改 SimpleDrawingBoard 组件，添加生成图像的功能：

```vue:d:\janxl\workplace\NodeJS\img2img\src\components\SimpleDrawingBoard.vue
<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import SignatureModal from './SignatureModal.vue';
import BrushSelector from './BrushSelector.vue';
import { createBrush, BrushType } from '@/utils/brushes';
import { BaseBrush } from '@/utils/brushes';
import { uploadImage, submitPrompt } from '@/services/comfyuiService';
import { useCommunication } from '@/services/channelService';

const router = useRouter();
const { send } = useCommunication();

// 状态管理
// ... existing code ...

// 添加结果窗口引用
const resultWindow = ref<Window | null>(null);

// 添加提示词设置
const promptSettings = reactive({
  positivePrompt: "masterpiece, best quality, detailed",
  negativePrompt: "lowres, bad anatomy, bad hands, cropped, worst quality"
});

// ... existing code ...

// 获取画布数据
function getImageData(): string | null {
  if (!canvasRef.value) return null;
  
  // 去除 base64 前缀
  const dataUrl = canvasRef.value.toDataURL('image/png');
  return dataUrl.replace(/^data:image\/png;base64,/, '');
}

// ... existing code ...

// 生成图像
async function generateImage() {
  try {
    // 获取画布数据
    const imageData = getImageData();
    if (!imageData) {
      throw new Error('无法获取画布数据');
    }
    
    // 打开结果窗口
    openResultWindow();
    
    // 等待窗口加载
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 上传图像
    const imageName = await uploadImage(imageData);
    
    // 提交工作流
    const taskId = await submitPrompt(
      imageName, 
      promptSettings.positivePrompt, 
      promptSettings.negativePrompt
    );
    
    // 发送任务数据到结果窗口
    send({
      type: 'task',
      taskId,
      imageData,
      positivePrompt: promptSettings.positivePrompt,
      negativePrompt: promptSettings.negativePrompt
    });
    
  } catch (error) {
    console.error('处理图像时出错:', error);
  }
}

// 打开结果窗口
function openResultWindow() {
  // 如果已经有打开的窗口且未关闭，则不需要再次打开
  if (resultWindow.value && !resultWindow.value.closed) {
    resultWindow.value.focus();
    return;
  }
  
  // 打开新窗口
  const url = `/aigc-result`;
  resultWindow.value = window.open(url, 'img2img_result');
  
  // 检查窗口是否成功打开
  if (!resultWindow.value) {
    console.error('无法打开结果窗口，可能被浏览器拦截');
    return;
  }
}

// 处理确认按钮点击
function handleConfirm() {
  // 如果需要签名，显示签名框
  if (signatureData.value === '') {
    showSignatureModal.value = true;
  } else {
    // 已有签名，直接生成图像
    generateImage();
  }
}

// 处理签名确认
function handleSignatureConfirm(data: string) {
  signatureData.value = data;
  showSignatureModal.value = false;
  console.log('签名数据已获取');
  
  // 签名完成后自动生成图像
  generateImage();
}

// ... existing code ...
</script>

<template>
  <!-- ... existing code ... -->
  
  <!-- 右侧按钮区域 -->
  <div class="flex flex-col justify-end items-center gap-5 h-full mx-4 w-[17.2vw]">
    <!-- ... existing code ... -->
    
    <div class="tool-button-wrapper" @click="undo">
      <img src="@/assets/images/icon/撤回.svg" alt="撤回" class="button-image pointer-events-auto" />
    </div>
    
    <div class="tool-button-wrapper" @click="handleConfirm">
      <img src="@/assets/images/icon/确定.svg" alt="确定" class="button-image pointer-events-auto" />
    </div>
  </div>
  
  <!-- ... existing code ... -->
</template>

<style scoped>
/* ... existing code ... */
</style>
```

### 3. 更新路由配置

修改路由配置，添加 ShowDrawedWindow 组件的路由：

```typescript:d:\janxl\workplace\NodeJS\img2img\src\router\index.ts
import { getToken } from '@/utils/token';
import { createRouter, createWebHistory } from 'vue-router';
import ResultView from '@/views/ResultView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ... existing code ...
    
    // 添加AIGC生成板路由
    {
        path: '/aigc-result',
        name: 'AIGCResult',
        meta: {
            title: 'AIGC实时生成画面',
            keepAlive: false,
            requireAuth: false,
        },
        component: () => import('@/components/ShowDrawedWindow.vue')
    }
  ]
});

// ... existing code ...
```

### 4. 创建通信服务

确保 channelService.ts 文件包含以下内容：

```typescript:d:\janxl\workplace\NodeJS\img2img\src\services\channelService.ts
import { ref, watch } from 'vue';

// 消息类型定义
export interface BaseMessage {
  type: string;
  taskId: string;
}

export interface TaskMessage extends BaseMessage {
  type: 'task';
  imageData: string;
  positivePrompt: string;
  negativePrompt: string;
}

export interface StatusMessage extends BaseMessage {
  type: 'status';
  status: string;
  progress?: number;
  total?: number;
}

export interface ResultMessage extends BaseMessage {
  type: 'result';
  imageUrl: string;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  error: string;
}

export interface ReadyMessage extends BaseMessage {
  type: 'ready';
}

export interface PrintMessage extends BaseMessage {
  type: 'print';
  action: string;
}

export type ChannelMessage = TaskMessage | StatusMessage | ResultMessage | ErrorMessage | ReadyMessage | PrintMessage;

// 创建一个通信频道
const CHANNEL_NAME = 'img2img_communication_channel';
const broadcastChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL_NAME) : null;

// 最后接收的消息
const lastMessage = ref<ChannelMessage | null>(null);

// 发送消息
function send(message: ChannelMessage) {
  if (broadcastChannel) {
    broadcastChannel.postMessage(message);
  } else {
    console.warn('BroadcastChannel API 不可用，无法发送消息');
  }
}

// 取消订阅
function unsubscribe() {
  if (broadcastChannel) {
    broadcastChannel.close();
  }
}

// 初始化接收消息
if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    lastMessage.value = event.data;
  };
}

// 通信服务钩子
export function useCommunication() {
  return {
    lastMessage,
    send,
    unsubscribe
  };
}
```

### 5. 创建 ComfyUI 服务

确保 comfyuiService.ts 文件包含以下内容：

```typescript:d:\janxl\workplace\NodeJS\img2img\src\services\comfyuiService.ts
// ComfyUI 服务 API 地址
const API_BASE_URL = 'http://127.0.0.1:6006';

// 上传图像到 ComfyUI
export async function uploadImage(base64Data: string): Promise<string> {
  try {
    // 将 base64 转换为 Blob
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    
    const blob = new Blob(byteArrays, { type: 'image/png' });
    
    // 创建表单数据
    const formData = new FormData();
    formData.append('image', blob, 'input.png');
    
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`上传图像失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.name;
  } catch (error) {
    console.error('上传图像时出错:', error);
    throw error;
  }
}

// 提交提示词到 ComfyUI
export async function submitPrompt(
  imageName: string,
  positivePrompt: string,
  negativePrompt: string
): Promise<string> {
  try {
    // 构建工作流
    const workflow = {
      // 这里是你的 ComfyUI 工作流配置
      // 需要根据实际情况修改
      nodes: {
        // 输入节点
        1: {
          type: "LoadImage",
          inputs: {
            image: imageName
          }
        },
        // 正向提示词
        2: {
          type: "CLIPTextEncode",
          inputs: {
            text: positivePrompt,
            clip: ["4", 0]
          }
        },
        // 负向提示词
        3: {
          type: "CLIPTextEncode",
          inputs: {
            text: negativePrompt,
            clip: ["4", 0]
          }
        },
        // 模型加载
        4: {
          type: "CheckpointLoaderSimple",
          inputs: {
            ckpt_name: "v1-5-pruned-emaonly.safetensors"
          }
        },
        // KSampler
        5: {
          type: "KSampler",
          inputs: {
            seed: Math.floor(Math.random() * 1000000),
            steps: 20,
            cfg: 7,
            sampler_name: "euler_ancestral",
            scheduler: "normal",
            denoise: 0.8,
            model: ["4", 0],
            positive: ["2", 0],
            negative: ["3", 0],
            latent_image: ["6", 0]
          }
        },
        // 预处理
        6: {
          type: "ControlNetApply",
          inputs: {
            conditioning: ["2", 0],
            control_net: ["7", 0],
            image: ["1", 0]
          }
        },
        // ControlNet 模型
        7: {
          type: "ControlNetLoader",
          inputs: {
            control_net_name: "control_v11p_sd15_scribble.pth"
          }
        },
        // VAE 解码
        8: {
          type: "VAEDecode",
          inputs: {
            samples: ["5", 0],
            vae: ["4", 2]
          }
        },
        // 保存图像
        9: {
          type: "SaveImage",
          inputs: {
            images: ["8", 0],
            filename_prefix: "img2img_result"
          }
        }
      }
    };
    
    // 发送请求
    const response = await fetch(`${API_BASE_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: workflow
      })
    });
    
    if (!response.ok) {
      throw new Error(`提交提示词失败: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.prompt_id;
  } catch (error) {
    console.error('提交提示词时出错:', error);
    throw error;
  }
}

// 轮询任务状态
export async function pollTaskStatus(
  promptId: string,
  progressCallback?: (progress: number, total: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/history/${promptId}`);
        
        if (!response.ok) {
          throw new Error(`获取任务状态失败: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // 检查是否有输出节点
        if (data.outputs && Object.keys(data.outputs).length > 0) {
          // 找到 SaveImage 节点的输出
          for (const nodeId in data.outputs) {
            const output = data.outputs[nodeId];
            if (output.images && output.images.length > 0) {
              return resolve(output.images[0].filename);
            }
          }
        }
        
        // 检查进度
        if (data.progress && progressCallback) {
          progressCallback(data.progress.value, data.progress.max);
        }
        
        // 继续轮询
        setTimeout(checkStatus, 1000);
      } catch (error) {
        console.error('轮询任务状态时出错:', error);
        reject(error);
      }
    };
    
    // 开始轮询
    checkStatus();
  });
}

// 获取生成的图像
export async function getGeneratedImage(filename: string): Promise<string> {
  return `${API_BASE_URL}/view?filename=${filename}`;
}
```

## 使用说明

1. 在 SimpleDrawingBoard 组件中绘制图像
2. 点击"确定"按钮，会弹出签名框
3. 签名后，系统会自动打开一个新窗口展示 AI 生成的图像结果
4. 两个窗口之间通过 BroadcastChannel API 进行通信

## 注意事项

1. 确保 ComfyUI 服务在 http://127.0.0.1:6006 上运行
2. 可能需要根据实际情况调整 ComfyUI 工作流配置
3. 浏览器可能会阻止弹出窗口，请确保允许弹出窗口
4. 如果 BroadcastChannel API 不可用，通信功能将无法正常工作

## 后续优化建议

1. 添加错误处理和用户提示
2. 优化 UI 界面，提升用户体验
3. 添加更多绘图工具和选项
4. 实现图像历史记录和管理功能
5. 添加更多 AI 模型和参数选择