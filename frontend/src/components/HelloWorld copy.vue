<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useUserStore } from '@/store/user';
import { ref, reactive } from 'vue';
import CanvasEditor from './CanvasEditor.vue';
import ControlPanel from './ControlPanel.vue';
import ResultDisplay from './ResultDisplay.vue';
import { uploadImage, submitPrompt, pollTaskStatus, getGeneratedImage } from '@/services/comfyuiService';

defineProps<{ msg: string }>();

const { t } = useI18n();
const userStore = useUserStore();

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
  canvasHeight: 512
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

// 发送图像到 ComfyUI 进行处理
// 添加新窗口模式控制
const newWindowMode = ref(false);

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

    // 如果是新窗口模式，打开新标签页
    if (newWindowMode.value) {
      const url = `/result?taskId=${taskId}`;
      window.open(url, `_blank_${taskId}`);
      isLoading.value = false;
      return;
    }
    
    // 3. 轮询任务状态
    processingStatus.value = '正在处理图像...';
    const resultFilename = await pollTaskStatus(taskId, (progress, total) => {
      processingStatus.value = `正在处理中 (${progress}/${total})...`;
    });
    
    // 4. 获取生成的图像
    processingStatus.value = '正在获取生成结果...';
    const imageDataUrl = await getGeneratedImage(resultFilename);
    
    // 设置结果图像
    resultImage.value = imageDataUrl;
    processingStatus.value = '';
  } catch (error) {
    console.error('处理图像时出错:', error);
    errorMessage.value = error instanceof Error ? error.message : '处理图像时出错';
  } finally {
    isLoading.value = false;
  }
}
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
          @update:line-width="(val) => drawingSettings.lineWidth = val"
          @update:line-color="(val) => drawingSettings.lineColor = val"
          @auto-generate="processImage"
        />
        
        <!-- 控制面板组件 -->
        <ControlPanel
          :line-width="drawingSettings.lineWidth"
          :line-color="drawingSettings.lineColor"
          :positive-prompt="promptSettings.positivePrompt"
          :negative-prompt="promptSettings.negativePrompt"
          :is-loading="isLoading"
          @update:line-width="(val) => drawingSettings.lineWidth = val"
          @update:line-color="(val) => drawingSettings.lineColor = val"
          @update:positive-prompt="(val) => promptSettings.positivePrompt = val"
          @update:negative-prompt="(val) => promptSettings.negativePrompt = val"
          @clear-canvas="clearCanvas"
          @process-image="processImage"
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
