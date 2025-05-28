<script setup lang="ts">
import { ref, reactive, onMounted, watch, onBeforeUnmount } from 'vue';
import { useCommunication } from '@/services/channelService';
import { uploadImage, submitPrompt } from '@/services/comfyuiService';

// 导入防抖函数
function debounce(fn: Function, delay: number) {
    let timer: number | null = null;
    return function (...args: any[]) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
            timer = null;
        }, delay);
    };
}

// 状态管理
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// 添加历史记录相关状态
const history = ref<string[]>([]);
const currentHistoryIndex = ref(-1);

// 绘图设置
// 修改工具类型，将eraser改为undo
const drawingSettings = reactive({
    lineWidth: 5,
    lineColor: '#000000',
    canvasWidth: 512,
    canvasHeight: 512,
    toolType: 'brush', // 'brush' 或 'undo'
});

// 提示词设置
const promptSettings = reactive({
    positivePrompt: 'masterpiece, best quality, detailed',
    negativePrompt: 'lowres, bad anatomy, bad hands, cropped, worst quality',
});

// 结果窗口引用
const resultWindow = ref<Window | null>(null);

// 通信服务
const { send } = useCommunication();

// 初始化画布
onMounted(() => {
    const canvas = canvasRef.value;
    if (!canvas) return;

    ctx.value = canvas.getContext('2d');
    if (!ctx.value) return;

    // 设置画布背景为白色
    ctx.value.fillStyle = '#ffffff';
    ctx.value.fillRect(
        0,
        0,
        drawingSettings.canvasWidth,
        drawingSettings.canvasHeight,
    );

    // 设置线条样式
    ctx.value.lineWidth = drawingSettings.lineWidth;
    ctx.value.strokeStyle = drawingSettings.lineColor;
    ctx.value.lineCap = 'round';
    ctx.value.lineJoin = 'round';

    // 监听文档级别的粘贴事件
    window.addEventListener('paste', handlePaste);

    // 添加键盘事件监听，用于撤销和重做
    window.addEventListener('keydown', handleKeyDown);

    // 保存初始状态到历史记录
    saveToHistory();
});

// 组件卸载时移除事件监听器
onBeforeUnmount(() => {
    window.removeEventListener('paste', handlePaste);
    window.removeEventListener('keydown', handleKeyDown);
});

// 监听工具类型变化
watch(
    () => drawingSettings.toolType,
    (newToolType) => {
        if (ctx.value) {
            // 如果是撤回，不需要改变绘图模式
            if (newToolType === 'brush') {
                ctx.value.globalCompositeOperation = 'source-over';
                ctx.value.strokeStyle = drawingSettings.lineColor;
            }
        }
    },
);

// 开始绘制
function startDrawing(e: MouseEvent) {
    // 检查是否为右键点击（鼠标右键的 button 值为 2）
    if (e.button === 2) {
        return; // 如果是右键点击，不执行任何操作
    }

    isDrawing.value = true;
    [lastX.value, lastY.value] = getCoordinates(e);
}

// 绘制中
function draw(e: MouseEvent) {
    if (!isDrawing.value || !ctx.value) return;

    const [x, y] = getCoordinates(e);

    ctx.value.beginPath();
    ctx.value.moveTo(lastX.value, lastY.value);
    ctx.value.lineTo(x, y);
    ctx.value.stroke();

    [lastX.value, lastY.value] = [x, y];
}

// 结束绘制
function stopDrawing() {
    if (isDrawing.value) {
        isDrawing.value = false;
        // 保存当前状态到历史记录
        saveToHistory();
    }
}

// 获取鼠标坐标
function getCoordinates(e: MouseEvent): [number, number] {
    const canvas = canvasRef.value;
    if (!canvas) return [0, 0];

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return [(e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY];
}

// 清空画布
function clearCanvas() {
    if (!ctx.value || !canvasRef.value) return;

    ctx.value.fillStyle = '#ffffff';
    ctx.value.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height);

    // 清空后保存到历史记录
    saveToHistory();
}

// 获取画布数据
function getImageData(): string | null {
    if (!canvasRef.value) return null;

    // 去除 base64 前缀
    const dataUrl = canvasRef.value.toDataURL('image/png');
    return dataUrl.replace(/^data:image\/png;base64,/, '');
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

// 重做操作
function redo() {
    if (currentHistoryIndex.value < history.value.length - 1) {
        currentHistoryIndex.value++;
        restoreFromHistory();
    }
}

// 从历史记录恢复
function restoreFromHistory() {
    if (!canvasRef.value || !ctx.value) return;

    const img = new Image();
    img.onload = () => {
        ctx.value?.clearRect(
            0,
            0,
            canvasRef.value!.width,
            canvasRef.value!.height,
        );
        ctx.value?.drawImage(img, 0, 0);
    };
    img.src = history.value[currentHistoryIndex.value];
}

// 处理键盘事件
function handleKeyDown(e: KeyboardEvent) {
    // 检查是否按下 Ctrl 键
    if (e.ctrlKey) {
        if (e.key === 'z') {
            // Ctrl+Z 撤销
            e.preventDefault();
            undo();
        } else if (e.key === 'y') {
            // Ctrl+Y 重做
            e.preventDefault();
            redo();
        }
    }
}

// 处理粘贴事件
function handlePaste(e: ClipboardEvent) {
    // 检查是否有图片数据
    if (!e.clipboardData) {
        return;
    }

    // 检查是否有图片
    const items = e.clipboardData.items;
    let imageItem = null;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            imageItem = items[i];
            break;
        }
    }

    if (!imageItem) {
        return;
    }

    // 获取图片并绘制到画布
    const blob = imageItem.getAsFile();
    if (!blob) {
        return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
        if (!event.target || !event.target.result) {
            return;
        }

        img.onload = () => {
            // 确保画布和上下文存在
            if (!canvasRef.value || !ctx.value) {
                return;
            }

            // 清空画布
            clearCanvas();

            // 计算图片缩放比例，保持宽高比
            const canvas = canvasRef.value;
            const ctx = ctx.value;

            const scale = Math.min(
                canvas.width / img.width,
                canvas.height / img.height,
            );

            const x = (canvas.width - img.width * scale) / 2;
            const y = (canvas.height - img.height * scale) / 2;

            // 绘制图片
            ctx.drawImage(
                img,
                0,
                0,
                img.width,
                img.height,
                x,
                y,
                img.width * scale,
                img.height * scale,
            );
        };

        img.src = event.target.result as string;
    };

    reader.readAsDataURL(blob);

    // 阻止默认行为
    e.preventDefault();
}

// 生成图像
async function generateImage() {
    try {
        // 获取画布数据
        const canvas = canvasRef.value;
        if (!canvas) {
            throw new Error('无法获取画布');
        }

        const imageData = canvas.toDataURL('image/png');

        // 上传草图
        const sessionInfo = await uploadSketch(imageData, 'demo2');

        // 打开结果窗口
        openResultWindow(sessionInfo.session_id);

        // 创建WebSocket连接
        const wsConnection = createWebSocketConnection(sessionInfo.session_id, {
            onMessage: (data) => {
                // 发送任务数据到结果窗口
                send({
                    type: 'status',
                    taskId: sessionInfo.session_id,
                    status: data.status,
                    progress: data.progress,
                    message: data.message,
                });

                // 如果处理完成，获取结果图像
                if (data.status === 'completed' && data.result_url) {
                    send({
                        type: 'result',
                        taskId: sessionInfo.session_id,
                        imageUrl: data.result_url,
                    });
                }
            },
        });
    } catch (error) {
        console.error('处理图像时出错:', error);
    }
}

// 打开结果窗口
function openResultWindow(sessionId: string) {
    // 如果已经有打开的窗口且未关闭，则不需要再次打开
    if (resultWindow.value && !resultWindow.value.closed) {
        resultWindow.value.focus();
        return;
    }

    // 打开新窗口
    const url = `/aigc-result?sessionId=${sessionId}`;
    resultWindow.value = window.open(url, 'img2img_result');

    // 检查窗口是否成功打开
    if (!resultWindow.value) {
        console.error('无法打开结果窗口，可能被浏览器拦截');
        return;
    }
}

// 更新线宽
function updateLineWidth(width: number) {
    drawingSettings.lineWidth = width;
    if (ctx.value) {
        ctx.value.lineWidth = width;
    }
}

// 更新颜色
function updateLineColor(color: string) {
    drawingSettings.lineColor = color;
    if (ctx.value && drawingSettings.toolType !== 'eraser') {
        ctx.value.strokeStyle = color;
    }
}

// 打印AIGC生成的图片
function printAIGCImage() {
    // 检查是否有生成的图片
    if (!resultWindow.value || resultWindow.value.closed) {
        console.error('AIGC结果窗口未打开或已关闭');
        return;
    }

    // 向AIGC窗口发送打印请求
    send({
        type: 'print',
        taskId: 'system',
        action: 'print',
    });
}

// 更新工具类型
function updateToolType(type: string) {
    // 如果选择了撤回工具，直接执行撤回操作
    if (type === 'undo') {
        undo();
        // 工具类型保持为画笔
        drawingSettings.toolType = 'brush';
    } else {
        drawingSettings.toolType = type;
    }
}
</script>

<template>
    <div class="drawing-board-container">
        <h1 class="text-2xl font-bold mb-6 text-center">手绘交互区域</h1>

        <div class="drawing-area">
            <!-- 画布 -->
            <div class="canvas-container">
                <canvas
                    ref="canvasRef"
                    :width="drawingSettings.canvasWidth"
                    :height="drawingSettings.canvasHeight"
                    @mousedown="startDrawing"
                    @mousemove="draw"
                    @mouseup="stopDrawing"
                    @mouseleave="stopDrawing"
                    @contextmenu.prevent
                    class="drawing-canvas"
                ></canvas>
            </div>

            <!-- 工具栏 -->
            <div class="tools-container">
                <div class="tool-group">
                    <button
                        class="tool-button"
                        :class="{
                            active: drawingSettings.toolType === 'brush',
                        }"
                        @click="updateToolType('brush')"
                    >
                        画 笔
                    </button>

                    <button class="tool-button" @click="updateToolType('undo')">
                        撤 回
                    </button>

                    <button class="tool-button" @click="printAIGCImage">
                        打 印
                    </button>
                </div>

                <div class="tool-group">
                    <div class="line-width-control">
                        <span class="tool-label"
                            >线宽: {{ drawingSettings.lineWidth }}</span
                        >
                        <input
                            type="range"
                            min="1"
                            max="30"
                            :value="drawingSettings.lineWidth"
                            @input="
                                updateLineWidth(
                                    +($event.target as HTMLInputElement).value,
                                )
                            "
                            class="width-slider"
                        />
                    </div>

                    <div class="color-picker">
                        <span class="tool-label">颜色:</span>
                        <input
                            type="color"
                            :value="drawingSettings.lineColor"
                            @input="
                                updateLineColor(
                                    ($event.target as HTMLInputElement).value,
                                )
                            "
                            class="color-input"
                        />
                    </div>
                </div>

                <div class="prompt-group">
                    <div class="prompt-input">
                        <span class="tool-label">正向提示词:</span>
                        <input
                            type="text"
                            v-model="promptSettings.positivePrompt"
                            class="prompt-text-input"
                            placeholder="输入正向提示词"
                        />
                    </div>

                    <div class="prompt-input">
                        <span class="tool-label">负向提示词:</span>
                        <input
                            type="text"
                            v-model="promptSettings.negativePrompt"
                            class="prompt-text-input"
                            placeholder="输入负向提示词"
                        />
                    </div>
                </div>

                <button class="generate-button" @click="generateImage">
                    生成 AI 图像
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.drawing-board-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1.5rem;
}

.drawing-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.canvas-container {
    border: 1px solid #ccc;
    border-radius: 8px;
    overflow: hidden;
    background-color: white;
}

.drawing-canvas {
    display: block;
    cursor: crosshair;
}

.tools-container {
    width: 100%;
    max-width: 512px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background-color: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.tool-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.tool-button {
    padding: 0.5rem 1rem;
    background-color: #e9ecef;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.tool-button:hover {
    background-color: #dee2e6;
}

.tool-button.active {
    background-color: #adb5bd;
    color: white;
}

.tool-label {
    font-size: 0.875rem;
    margin-right: 0.5rem;
}

.line-width-control {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
}

.width-slider {
    width: 100%;
}

.color-picker {
    display: flex;
    align-items: center;
}

.color-input {
    width: 2rem;
    height: 2rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.prompt-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.prompt-input {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.prompt-text-input {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ced4da;
    border-radius: 4px;
}

.generate-button {
    padding: 0.75rem 1rem;
    background: linear-gradient(90deg, #e6ccff 0%, #cce6ff 100%);
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.generate-button:hover {
    opacity: 0.9;
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .tools-container {
        max-width: 100%;
    }
}

@media (min-width: 1200px) {
    .drawing-board-container {
        padding: 2rem;
    }

    .drawing-area {
        flex-direction: row;
        align-items: flex-start;
    }

    .canvas-container {
        flex: 1;
        max-width: 70%;
    }

    .tools-container {
        width: 25%;
        max-width: 300px;
        margin-left: 2rem;
    }
}
</style>
