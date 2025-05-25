<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/store/user';
import { ref, reactive, watch, onBeforeUnmount } from 'vue';
import CanvasEditor from './CanvasEditor.vue';
import ControlPanel from './ControlPanel.vue';
import ResultDisplay from './ResultDisplay.vue';
// 添加 pollTaskStatus 和 getGeneratedImage 的导入
import { uploadImage, submitPrompt, pollTaskStatus, getGeneratedImage } from '@/services/comfyuiService';
import { useCommunication } from '@/services/channelService';

defineProps<{ msg: string }>();

const { t } = useI18n();
const userStore = useUserStore();
const { lastMessage, send, unsubscribe } = useCommunication();

// 引用子组件
const canvasEditorRef = ref<InstanceType<typeof CanvasEditor> | null>(null);

// 状态管理
const resultImage = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const processingStatus = ref('');
const promptId = ref('');

// 绘图设置
const drawingSettings = reactive({
  lineWidth: 5,
  lineColor: '#000000',
  canvasWidth: 512,
  canvasHeight: 512,
  toolType: 'brush' // 添加工具类型属性
});

// 提示词设置
const promptSettings = reactive({
  positivePrompt: "masterpiece, best quality, detailed",
  negativePrompt: "lowres, bad anatomy, bad hands, cropped, worst quality"
});

// 清空画布
function clearCanvas() {
  canvasEditorRef.value?.clearCanvas();
}

// 添加新窗口模式控制
const newWindowMode = ref(false);
// 跟踪已打开的结果窗口
const resultWindow = ref<Window | null>(null);

// 监听新窗口模式变化
watch(newWindowMode, (newValue) => {
  if (newValue) {
    // 如果选中了新窗口模式，立即打开结果页面
    openResultWindow();
  } else {
    // 如果取消了新窗口模式，关闭结果窗口
    if (resultWindow.value && !resultWindow.value.closed) {
      resultWindow.value.close();
      resultWindow.value = null;
    }
  }
});

// 打开结果窗口
function openResultWindow() {
  // 如果已经有打开的窗口且未关闭，则不需要再次打开
  if (resultWindow.value && !resultWindow.value.closed) {
    resultWindow.value.focus();
    return;
  }
  
  // 打开新窗口
  const url = `/result`;
  resultWindow.value = window.open(url, 'img2img_result');
  
  // 检查窗口是否成功打开
  if (!resultWindow.value) {
    console.error('无法打开结果窗口，可能被浏览器拦截');
    newWindowMode.value = false;
    return;
  }
  
  // 窗口关闭时的处理
  const checkWindowClosed = setInterval(() => {
    if (resultWindow.value && resultWindow.value.closed) {
      clearInterval(checkWindowClosed);
      resultWindow.value = null;
      newWindowMode.value = false;
    }
  }, 1000);
}

// 修改 processImage 函数
async function processImage() {
  if (!canvasEditorRef.value) return;
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    processingStatus.value = '准备处理...';
    
    // 获取画布数据
    const imageData = canvasEditorRef.value.getImageData();
    if (!imageData) {
      throw new Error('无法获取画布数据');
    }
    
    // 1. 上传图像
    processingStatus.value = '正在上传图像...';
    const imageName = await uploadImage(imageData);
    
    // 2. 提交工作流
    processingStatus.value = '正在提交工作流...';
    const taskId = await submitPrompt(
      imageName, 
      promptSettings.positivePrompt, 
      promptSettings.negativePrompt
    );
    promptId.value = taskId;

    // 如果是新窗口模式
    if (newWindowMode.value) {
      // 确保结果窗口已打开
      if (!resultWindow.value || resultWindow.value.closed) {
        openResultWindow();
        // 等待窗口加载
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // 发送任务数据
      send({
        type: 'task',
        taskId,
        imageData,
        positivePrompt: promptSettings.positivePrompt,
        negativePrompt: promptSettings.negativePrompt
      });
      
      isLoading.value = false;
      processingStatus.value = '已发送到结果窗口处理';
      return;
    }
    
    // 如果不是新窗口模式，则在当前页面处理
    // 直接处理图像生成，不通过消息传递
    try {
      processingStatus.value = '正在处理图像...';
      const resultFilename = await pollTaskStatus(taskId, (progress, total) => {
        processingStatus.value = `正在处理中 (${progress}/${total})...`;
      });
      
      processingStatus.value = '正在获取生成结果...';
      const imageDataUrl = await getGeneratedImage(resultFilename);
      
      // 设置结果图像
      resultImage.value = imageDataUrl;
      isLoading.value = false;
      processingStatus.value = '';
    } catch (error) {
      console.error('处理图像时出错:', error);
      errorMessage.value = error instanceof Error ? error.message : '处理图像时出错';
      isLoading.value = false;
    }
  } catch (error) {
    console.error('处理图像时出错:', error);
    errorMessage.value = error instanceof Error ? error.message : '处理图像时出错';
    isLoading.value = false;
  }
}

// 监听通信消息
watch(lastMessage, (message) => {
  if (!message) return;
  
  // 处理状态更新消息
  if (message.type === 'status') {
    if (message.taskId === promptId.value) {
      processingStatus.value = message.status;
      if (message.progress && message.total) {
        isLoading.value = true;
      }
    }
  }
  
  // 处理结果消息
  if (message.type === 'result') {
    if (message.taskId === promptId.value) {
      resultImage.value = message.imageUrl;
      isLoading.value = false;
      processingStatus.value = '';
    }
  }
});
</script>

<template>
  <div class="img2img-container">
    <h1 class="text-2xl font-bold mb-6 text-center text-dark dark:text-light">{{ msg }}</h1>
    
    <!-- 添加新窗口模式开关 -->
    <div class="flex justify-end mb-4">
      <label class="inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          v-model="newWindowMode"
          class="sr-only peer"
        >
        <div class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        <span class="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">新窗口显示结果</span>
      </label>
    </div>
    
    <div class="flex flex-col lg:flex-row gap-8 justify-center">
      <!-- 左侧绘图区域 -->
      <div class="drawing-section bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 text-dark dark:text-light">草图绘制区</h2>
        
        <!-- 画布编辑器组件 -->
        <CanvasEditor
          ref="canvasEditorRef"
          :width="drawingSettings.canvasWidth"
          :height="drawingSettings.canvasHeight"
          :line-width="drawingSettings.lineWidth"
          :line-color="drawingSettings.lineColor"
          :tool-type="drawingSettings.toolType"
          @update:line-width="(val) => drawingSettings.lineWidth = val"
          @update:line-color="(val) => drawingSettings.lineColor = val"
          @update:tool-type="(val) => drawingSettings.toolType = val"
          @auto-generate="processImage"
        />
        
        <!-- 控制面板组件 -->
        <ControlPanel
          :line-width="drawingSettings.lineWidth"
          :line-color="drawingSettings.lineColor"
          :positive-prompt="promptSettings.positivePrompt"
          :negative-prompt="promptSettings.negativePrompt"
          :is-loading="isLoading"
          :tool-type="drawingSettings.toolType"
          @update:line-width="(val) => drawingSettings.lineWidth = val"
          @update:line-color="(val) => drawingSettings.lineColor = val"
          @update:positive-prompt="(val) => promptSettings.positivePrompt = val"
          @update:negative-prompt="(val) => promptSettings.negativePrompt = val"
          @update:tool-type="(val) => drawingSettings.toolType = val"
          @clear-canvas="clearCanvas"
          @process-image="processImage"
          @undo="canvasEditorRef?.undo()"
          @redo="canvasEditorRef?.redo()"
        />
      </div>
      
      <!-- 右侧结果区域，根据模式显示或隐藏 -->
      <ResultDisplay
        v-if="!newWindowMode"
        :width="drawingSettings.canvasWidth"
        :height="drawingSettings.canvasHeight"
        :result-image="resultImage"
        :is-loading="isLoading"
        :error-message="errorMessage"
        :processing-status="processingStatus"
        :prompt-id="promptId"
      />
    </div>
  </div>
</template>

<style scoped>
a {
    color: var(--link-color);
}

.img2img-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.drawing-section, .result-section {
  flex: 1;
  min-width: 300px;
  transition: all 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 1024px) {
  .img2img-container {
    padding: 1rem;
  }
  
  .drawing-section, .result-section {
    width: 100%;
  }
}
</style>
