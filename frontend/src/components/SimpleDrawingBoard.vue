<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import SignatureModal from './SignatureModal.vue';
import BrushSelector from './BrushSelector.vue';
import { createBrush, BrushType } from '@/utils/brushes';
import { BaseBrush } from '@/utils/brushes';
import {
    useCommunication,
    communicationService,
} from '@/services/channelService'; // 修改导入
import {
    uploadSketch,
    createWebSocketConnection,
} from '@/services/comfyuiService';

const router = useRouter();

// 添加通信相关
const { send, unsubscribe } = useCommunication();
const displayWindow = ref<Window | null>(null);
let heartbeatInterval: number | null = null;

// 添加连接状态管理
const connectionStatus = reactive({
    connected: false,
    lastHeartbeat: 0,
    retryCount: 0,
    maxRetries: 5,
    pollingInterval: 3000, // 3秒轮询一次
    missedHeartbeats: 0,
    maxMissedHeartbeats: 3,
});

// 状态管理
const isDrawing = ref(false);
const lastX = ref(0);
const lastY = ref(0);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const ctx = ref<CanvasRenderingContext2D | null>(null);

// 添加签名框相关状态
const showSignatureModal = ref(false);
const signatureData = ref('');

// 添加画笔选择器相关状态
const showBrushSelector = ref(false);
const showBrushTip = ref(false);
const brushButtonRef = ref<HTMLDivElement | null>(null);
const brushSelectorPosition = ref({ top: 0, left: 0 });

// 添加历史记录相关状态
const history = ref<string[]>([]);
const currentHistoryIndex = ref(-1);

// 当前使用的画笔
const currentBrush = ref<BaseBrush | null>(null);

// 添加打开DisplayBoard的函数
function openDisplayBoard() {
    // 如果已经有打开的窗口且未关闭，则不需要再次打开
    if (displayWindow.value && !displayWindow.value.closed) {
        displayWindow.value.focus();
        return;
    }

    // 打开新窗口
    const url = `/display`; // 确保路由中已配置此路径
    displayWindow.value = window.open(url, 'simple_display_board');

    // 检查窗口是否成功打开
    if (!displayWindow.value) {
        console.error('无法打开显示窗口，可能被浏览器拦截');
        return;
    }

    // 等待窗口加载完成后发送握手消息
    displayWindow.value.onload = () => {
        send({
            type: 'status',
            taskId: 'drawing-board',
            status: 'handshake',
        });
    };
}

// 添加检查连接状态的函数
function checkConnection() {
    if (!displayWindow.value || displayWindow.value.closed) {
        // 窗口已关闭，尝试重新打开
        openDisplayBoard();
    } else if (!connectionStatus.connected) {
        // 未连接，发送握手消息
        send({
            type: 'status',
            taskId: 'drawing-board',
            status: 'handshake',
        });
    }
}

// 启动心跳机制
function startHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }

    heartbeatInterval = window.setInterval(() => {
        if (displayWindow.value && !displayWindow.value.closed) {
            send({
                type: 'status',
                taskId: 'drawing-board',
                status: 'heartbeat',
            });

            // 检查是否收到响应
            if (Date.now() - connectionStatus.lastHeartbeat > 10000) {
                connectionStatus.missedHeartbeats++;
                if (
                    connectionStatus.missedHeartbeats >=
                    connectionStatus.maxMissedHeartbeats
                ) {
                    // 连续3次未收到响应，认为连接断开
                    updateConnectionStatus(false);
                    checkConnection(); // 尝试重连
                }
            }
        } else {
            stopHeartbeat();
        }
    }, 5000); // 每5秒发送一次心跳
}

// 停止心跳机制
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

// 更新连接状态
function updateConnectionStatus(connected: boolean) {
    connectionStatus.connected = connected;
    connectionStatus.lastHeartbeat = Date.now();
    if (connected) {
        connectionStatus.retryCount = 0;
        connectionStatus.missedHeartbeats = 0;
    }
}

// 处理确认按钮点击
function handleConfirm() {
    // 获取画布数据
    const imageData = getImageData();
    if (!imageData) {
        console.error('无法获取画布数据');
        return;
    }

    // 如果DisplayBoard窗口未打开，则打开它
    if (!displayWindow.value || displayWindow.value.closed) {
        openDisplayBoard();
        // 设置定时发送心跳消息
        startHeartbeat();
    } else {
        sendImageToDisplayBoard(imageData);
    }

    // 显示签名框
    showSignatureModal.value = true;
}

// 添加发送图像数据到DisplayBoard的函数

// 绘图设置
const drawingSettings = reactive({
    lineWidth: 5,
    lineColor: '#000000',
    canvasWidth: 640, // 16:9 比例
    canvasHeight: 360, // 16:9 比例
    toolType: 'brush', // 'brush', 'eraser' 或 'undo'
    minLineWidth: 1, // 最小线宽
    maxLineWidth: 8, // 最大线宽
    pressureSensitivity: 0.5, // 压力敏感度
    brushType: 'pressure', // 画笔类型
    eraserSize: 20, // 橡皮擦大小
});

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

    // 初始化画笔
    currentBrush.value = createBrush(BrushType.PRESSURE, {
        lineWidth: drawingSettings.lineWidth,
        lineColor: drawingSettings.lineColor,
        minLineWidth: drawingSettings.minLineWidth,
        maxLineWidth: drawingSettings.maxLineWidth,
        pressureSensitivity: drawingSettings.pressureSensitivity,
    });

    // 监听文档级别的粘贴事件
    window.addEventListener('paste', handlePaste);

    // 添加键盘事件监听，用于撤销
    window.addEventListener('keydown', handleKeyDown);

    // 保存初始状态到历史记录
    saveToHistory();

    // 添加消息接收处理
    const unsubscribeFunc = communicationService.receive((message) => {
        console.log('收到消息:', message);

        // 处理握手响应
        if (message.type === 'status' && message.status === 'connected') {
            updateConnectionStatus(true);
            console.log('连接已建立');
        }
        // 处理心跳响应
        else if (message.type === 'status' && message.status === 'heartbeat') {
            updateConnectionStatus(true);
        }
    });

    // 自动打开DisplayBoard
    openDisplayBoard();

    // 启动心跳机制
    startHeartbeat();

    // 启动定期检查连接状态
    setInterval(checkConnection, connectionStatus.pollingInterval);
});

// 组件卸载时清理
onBeforeUnmount(() => {
    stopHeartbeat();
    unsubscribe();
    window.removeEventListener('paste', handlePaste);
    window.removeEventListener('keydown', handleKeyDown);

    // 关闭DisplayBoard窗口
    if (displayWindow.value && !displayWindow.value.closed) {
        displayWindow.value.close();
    }
});

// 开始绘制
function startDrawing(e: MouseEvent) {
    // 检查是否为右键点击
    if (e.button === 2) return;

    isDrawing.value = true;
    const [x, y] = getCoordinates(e);
    lastX.value = x;
    lastY.value = y;

    // 使用画笔开始绘制
    if (ctx.value && currentBrush.value) {
        currentBrush.value.startStroke(ctx.value, { x, y, pressure: 1 });
    }
}

// 绘制中
function draw(e: MouseEvent) {
    if (!isDrawing.value || !ctx.value || !currentBrush.value) return;

    const [x, y] = getCoordinates(e);

    // 使用画笔绘制
    currentBrush.value.drawStroke({
        ctx: ctx.value,
        lastPoint: { x: lastX.value, y: lastY.value, pressure: 1 },
        currentPoint: { x, y },
    });

    // 更新上一个点的位置
    lastX.value = x;
    lastY.value = y;
}

// 简化获取画布数据的函数
function getImageData(): string | null {
    if (!canvasRef.value) return null;
    return canvasRef.value.toDataURL('image/png');
}

// 修改发送图像到DisplayBoard的函数
async function sendImageToDisplayBoard(imageData: string) {
    try {
        // 上传草图到后端
        const sessionInfo = await uploadSketch(imageData, 'demo2');

        // 创建WebSocket连接
        const wsConnection = createWebSocketConnection(sessionInfo.session_id, {
            onMessage: (data) => {
                // 发送状态更新到DisplayBoard
                send({
                    type: 'status',
                    taskId: sessionInfo.session_id,
                    status: data.status,
                    progress: data.progress || 0,
                    total: 100,
                });

                // 如果处理完成，发送结果URL
                if (data.status === 'completed' && data.result_url) {
                    send({
                        type: 'result',
                        taskId: sessionInfo.session_id,
                        imageUrl: data.result_url,
                    });
                }
            },
        });

        // 发送草图数据到DisplayBoard
        send({
            type: 'canvas_update',
            imageData: imageData,
        });

        // 发送生成状态
        send({
            type: 'status',
            taskId: 'drawing-board',
            status: 'generating',
        });
    } catch (error) {
        console.error('发送图像时出错:', error);
        // 发送错误状态
        send({
            type: 'status',
            taskId: 'drawing-board',
            status: 'error',
            message: '发送图像时出错',
        });
    }
}

// 添加自动同步功能 - 在绘制结束时自动发送画布数据
function stopDrawing() {
    if (isDrawing.value) {
        isDrawing.value = false;

        // 使用画笔结束绘制
        if (ctx.value && currentBrush.value) {
            currentBrush.value.endStroke(ctx.value);
        }

        // 保存当前状态到历史记录
        saveToHistory();

        // 自动发送画布数据到DisplayBoard
        const imageData = getImageData();
        if (imageData && connectionStatus.connected) {
            sendImageToDisplayBoard(imageData);
        }
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
    // Ctrl+Z 撤销
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    }
}

// 处理粘贴事件
function handlePaste(e: ClipboardEvent) {
    if (!e.clipboardData) return;

    // 检查是否有图片
    const items = e.clipboardData.items;
    let imageItem = null;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            imageItem = items[i];
            break;
        }
    }

    if (!imageItem) return;

    // 获取图片并绘制到画布
    const blob = imageItem.getAsFile();
    if (!blob) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
        if (!event.target || !event.target.result) return;

        img.onload = () => {
            if (!canvasRef.value || !ctx.value) return;

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
    e.preventDefault();
}

// 删除这个重复的handleConfirm函数
function handleSignatureConfirmOpen() {
    showSignatureModal.value = true;
}

// 处理签名确认
function handleSignatureConfirm(data: string) {
    signatureData.value = data;
    showSignatureModal.value = false;
    console.log('签名数据已获取');

    // 如果DisplayBoard窗口已打开，发送签名数据
    if (displayWindow.value && !displayWindow.value.closed) {
        send({
            type: 'signature',
            signatureData: data,
        });
    }
}

// 处理签名框关闭
function handleSignatureClose() {
    showSignatureModal.value = false;
}

// 返回上一页
const goBack = () => {
    router.go(-1);
};

// 处理画笔按钮点击
function handleBrushClick() {
    drawingSettings.toolType = 'brush';

    // 计算画笔选择器位置
    if (brushButtonRef.value) {
        const rect = brushButtonRef.value.getBoundingClientRect();
        brushSelectorPosition.value = {
            top: rect.top - 300,
            left: rect.left - 300, // 面板宽度约300px，放在按钮左侧
        };
    }

    showBrushSelector.value = !showBrushSelector.value;
}

// 处理画笔选择器关闭
function handleBrushSelectorClose() {
    showBrushSelector.value = false;
}

// 处理画笔颜色更新
function updateBrushColor(color: string) {
    drawingSettings.lineColor = color;

    if (currentBrush.value) {
        currentBrush.value.updateOptions({ lineColor: color });
    }
}

// 处理橡皮擦按钮点击
function handleEraserClick() {
    // 切换工具类型
    if (drawingSettings.toolType === 'eraser') {
        // 如果已经是橡皮擦，则切换回画笔
        drawingSettings.toolType = 'brush';

        // 重新创建画笔
        if (drawingSettings.brushType === 'pressure') {
            currentBrush.value = createBrush(BrushType.PRESSURE, {
                lineWidth: drawingSettings.lineWidth,
                lineColor: drawingSettings.lineColor,
                minLineWidth: drawingSettings.minLineWidth,
                maxLineWidth: drawingSettings.maxLineWidth,
                pressureSensitivity: drawingSettings.pressureSensitivity,
            });
        } else {
            currentBrush.value = createBrush(BrushType.SIMPLE, {
                lineWidth: drawingSettings.lineWidth,
                lineColor: drawingSettings.lineColor,
            });
        }
    } else {
        // 切换到橡皮擦
        drawingSettings.toolType = 'eraser';

        // 创建橡皮擦画笔（使用白色画笔模拟橡皮擦）
        currentBrush.value = createBrush(BrushType.SIMPLE, {
            lineWidth: drawingSettings.eraserSize,
            lineColor: '#FFFFFF',
        });
    }
}

// 处理画笔大小更新
function updateBrushSize(size: number) {
    drawingSettings.lineWidth = size;
    drawingSettings.maxLineWidth = size; // 同时更新最大线宽

    if (currentBrush.value && drawingSettings.toolType === 'brush') {
        currentBrush.value.updateOptions({
            lineWidth: size,
            maxLineWidth: size, // 同时更新最大线宽
        });
    } else if (currentBrush.value && drawingSettings.toolType === 'eraser') {
        // 如果当前是橡皮擦，更新橡皮擦大小
        drawingSettings.eraserSize = size;
        currentBrush.value.updateOptions({
            lineWidth: size,
        });
    }
}

// 处理画笔类型更新
function updateBrushType(type: string) {
    drawingSettings.brushType = type;

    // 创建新的画笔
    if (type === 'pressure') {
        currentBrush.value = createBrush(BrushType.PRESSURE, {
            lineWidth: drawingSettings.lineWidth,
            lineColor: drawingSettings.lineColor,
            minLineWidth: drawingSettings.minLineWidth,
            maxLineWidth: drawingSettings.maxLineWidth,
            pressureSensitivity: drawingSettings.pressureSensitivity,
        });
    } else {
        currentBrush.value = createBrush(BrushType.SIMPLE, {
            lineWidth: drawingSettings.lineWidth,
            lineColor: drawingSettings.lineColor,
        });
    }
}

// 显示画笔提示
function showBrushTipHandler() {
    showBrushTip.value = true;
}

// 隐藏画笔提示
function hideBrushTipHandler() {
    showBrushTip.value = false;
}
</script>

<template>
    <div
        class="fixed w-full h-full overflow-hidden m-0 p-0 bg-cover bg-center bg-blend-normal drawing-container"
    >
        <!-- 顶部导航栏 - 包含返回按钮和Logo -->
        <div
            class="absolute top-[3%] left-0 right-0 w-full flex flex-row justify-between items-center px-[3%] box-border z-10"
        >
            <div class="flex flex-row items-center">
                <div
                    class="flex flex-row justify-center items-center gap-4 cursor-pointer"
                    @click="goBack"
                >
                    <div class="back-button-bg relative">
                        <div class="back-arrow"></div>
                    </div>
                    <div class="title-text">手绘交互区域</div>
                </div>
            </div>
            <div class="flex items-center">
                <img
                    src="@/assets/images/logo.svg"
                    alt="艺启创"
                    class="h-10 pointer-events-none"
                />
            </div>
        </div>

        <!-- 主要内容区域 - 画布和按钮并排 -->
        <div
            class="absolute bottom-[6%] left-[3%] w-[94%] h-[80%] flex flex-row justify-start items-center gap-4"
        >
            <!-- 画布区域 -->
            <div class="h-full flex-1 flex justify-start items-center">
                <canvas
                    ref="canvasRef"
                    :width="drawingSettings.canvasWidth"
                    :height="drawingSettings.canvasHeight"
                    class="bg-white rounded-lg border-[5px] border-white shadow-md w-full h-full"
                    @mousedown="startDrawing"
                    @mousemove="draw"
                    @mouseup="stopDrawing"
                    @mouseleave="stopDrawing"
                    @contextmenu.prevent
                ></canvas>
            </div>

            <!-- 右侧按钮区域 -->
            <div
                class="flex flex-col justify-end items-center gap-5 h-full mx-4 w-[17.2vw]"
            >
                <div
                    class="connection-status"
                    :class="{ connected: connectionStatus.connected }"
                >
                    {{ connectionStatus.connected ? '已连接' : '未连接' }}
                </div>
                <div
                    ref="brushButtonRef"
                    class="tool-button-wrapper relative"
                    :class="{
                        'active-tool': drawingSettings.toolType === 'brush',
                    }"
                    @click="handleBrushClick"
                    @mouseenter="showBrushTipHandler"
                    @mouseleave="hideBrushTipHandler"
                >
                    <!-- 画笔提示 -->
                    <div v-if="showBrushTip" class="brush-tip">
                        点击设置画笔
                    </div>
                    <img
                        src="@/assets/images/icon/brush.svg"
                        alt="画笔"
                        class="button-image pointer-events-auto"
                    />
                    <!-- 当前画笔预览 -->
                    <div
                        class="absolute bottom-2 right-2 rounded-full border-2 border-white shadow-sm"
                        :style="{
                            width: `${Math.min(drawingSettings.lineWidth * 3, 24)}px`,
                            height: `${Math.min(drawingSettings.lineWidth * 3, 24)}px`,
                            backgroundColor: drawingSettings.lineColor,
                            border:
                                drawingSettings.lineColor === '#FFFFFF'
                                    ? '1px solid #E0E0E0'
                                    : 'none',
                        }"
                    ></div>
                </div>

                <!-- 橡皮擦按钮 -->
                <div
                    class="tool-button-wrapper relative"
                    :class="{
                        'active-tool': drawingSettings.toolType === 'eraser',
                    }"
                    @click="handleEraserClick"
                >
                    <img
                        src="@/assets/images/icon/eraser.svg"
                        alt="橡皮擦"
                        class="button-image pointer-events-auto"
                    />
                    <!-- 当前橡皮擦大小预览 -->
                    <div
                        v-if="drawingSettings.toolType === 'eraser'"
                        class="absolute bottom-2 right-2 rounded-full border-2 border-white shadow-sm bg-white"
                        :style="{
                            width: `${Math.min(drawingSettings.eraserSize * 2, 24)}px`,
                            height: `${Math.min(drawingSettings.eraserSize * 2, 24)}px`,
                            border: '1px solid #E0E0E0',
                        }"
                    ></div>
                </div>

                <div class="tool-button-wrapper" @click="undo">
                    <img
                        src="@/assets/images/icon/undo.svg"
                        alt="撤回"
                        class="button-image pointer-events-auto"
                    />
                </div>

                <!-- <div
                    class="tool-button-wrapper"
                    @click="handleSignatureConfirmOpen"
                >
                    <img
                        src="@/assets/images/icon/confirm.svg"
                        alt="确定"
                        class="button-image pointer-events-auto"
                    />
                </div> -->
                <div
                    class="tool-button-wrapper"
                    @click="clearCanvas"
                >
                    <img
                        src="@/assets/images/icon/confirm.svg"
                        alt="确定"
                        class="button-image pointer-events-auto"
                    />
                </div>
            </div>
        </div>

        <!-- 签名框组件 -->
        <SignatureModal
            :visible="showSignatureModal"
            :parent-width="drawingSettings.canvasWidth"
            :parent-height="drawingSettings.canvasHeight"
            @close="handleSignatureClose"
            @confirm="handleSignatureConfirm"
        />

        <!-- 画笔选择器组件 -->
        <BrushSelector
            :visible="showBrushSelector"
            :current-color="drawingSettings.lineColor"
            :current-size="drawingSettings.lineWidth"
            :current-brush-type="drawingSettings.brushType"
            :position="brushSelectorPosition"
            @update:color="updateBrushColor"
            @update:size="updateBrushSize"
            @update:brush-type="updateBrushType"
            @close="handleBrushSelectorClose"
        />
    </div>
</template>

<style scoped>
/* 全局禁止图片拖拽 */
img {
    -webkit-user-drag: none;
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
}

.drawing-container {
    background-image: url('@/assets/images/ui-skeleton.png'),
        url('@/assets/images/gradient.jpg');
    background-size: cover;
    background-position: center;
    background-blend-mode: plus-darker, normal;
}

.back-button-bg {
    width: 56px;
    height: 37px;
    background: rgba(20, 20, 20, 0.15);
    border: 2px solid #fff5fb;
    backdrop-filter: blur(4px);
    border-radius: 12px;
}

.back-arrow {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 0;
    height: 0;
    border-width: 8px 8px 8px 0;
    border-style: solid;
    border-color: transparent #fff5fb transparent transparent;
}

.title-text {
    font-family: 'A10', sans-serif;
    font-size: 28px;
    line-height: 34px;
    color: #2e2e2e;
    text-shadow: 2px 2px 1.3px #ffffff;
}

.tool-button-wrapper {
    border-radius: 35px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
    user-select: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
}

.tool-button-wrapper:hover {
    transform: translateY(-3px);
    box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
}

.tool-button-wrapper:active {
    transform: translateY(2px);
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

.button-image {
    width: auto;
    pointer-events: auto;
    width: 17.2vw;
}

/* 画笔提示样式 */
.brush-tip {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 14px;
    white-space: nowrap;
    z-index: 30;
    animation: fadeIn 0.3s ease-out;
}

.brush-tip::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(0, 0, 0, 0.7);
}
/* 连接状态指示器样式 */
.connection-status {
    position: absolute;
    top: 20px;
    right: 20px;
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 14px;
    background-color: rgba(255, 0, 0, 0.7);
    color: white;
    transition: background-color 0.3s ease;
}

.connection-status.connected {
    background-color: rgba(0, 128, 0, 0.7);
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateX(-50%) translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
}

/* 响应式设计 */
@media (max-width: 768px) {
    .back-button-bg {
        width: 45px;
        height: 30px;
    }

    .back-arrow {
        border-width: 6px 6px 6px 0;
    }

    .title-text {
        font-size: 20px;
        line-height: 28px;
    }
}
</style>
