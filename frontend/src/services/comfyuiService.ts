import axios from 'axios';

// 会话信息
interface SessionInfo {
    session_id: string;
    status: string;
    message: string;
    websocket_url: string;
}

// 风格信息
interface StylesResponse {
    styles: string[];
}

// 上传草图到后端
export async function uploadSketch(
    imageData: string,
    styleName: string = 'demo2',
    sessionId?: string,
): Promise<SessionInfo> {
    try {
        // 将 base64 转换为 Blob
        const byteString = atob(imageData.split(',')[1] || imageData);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: 'image/png' });

        // 创建 FormData
        const formData = new FormData();
        formData.append('file', blob, 'sketch.png');
        formData.append('style_name', styleName);

        if (sessionId) {
            formData.append('session_id', sessionId);
        }

        // 上传草图
        const response = await axios.post('/api/sketch', formData);

        return response.data;
    } catch (error) {
        console.error('上传草图时出错:', error);
        throw error;
    }
}

// 获取可用的风格列表
export async function getAvailableStyles(): Promise<string[]> {
    try {
        const response = await axios.get<StylesResponse>('/api/styles');
        return response.data.styles;
    } catch (error) {
        console.error('获取风格列表时出错:', error);
        throw error;
    }
}

// 获取生成的图像结果
export async function getGeneratedImage(sessionId: string): Promise<string> {
    try {
        // 构建图像 URL
        const imageUrl = `/api/result/${sessionId}`;

        // 获取图像数据
        const response = await axios.get(imageUrl, {
            responseType: 'blob',
        });

        // 将 Blob 转换为 base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(response.data);
        });
    } catch (error) {
        console.error('获取生成图像时出错:', error);
        throw error;
    }
}

// 创建WebSocket连接
export function createWebSocketConnection(
    sessionId: string,
    callbacks: {
        onOpen?: () => void;
        onMessage?: (data: any) => void;
        onError?: (error: Event) => void;
        onClose?: () => void;
    },
) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/${sessionId}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        console.log('WebSocket连接已建立');
        callbacks.onOpen?.();
    };

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            callbacks.onMessage?.(data);
        } catch (error) {
            console.error('解析WebSocket消息时出错:', error);
        }
    };

    socket.onerror = (error) => {
        console.error('WebSocket错误:', error);
        callbacks.onError?.(error);
    };

    socket.onclose = () => {
        console.log('WebSocket连接已关闭');
        callbacks.onClose?.();
    };

    return {
        socket,
        close: () => socket.close(),
        send: (data: any) => socket.send(JSON.stringify(data)),
    };
}

// 轮询任务状态
export async function pollTaskStatus(
    taskId: string,
    onProgress?: (progress: number, total: number) => void,
): Promise<string> {
    try {
        const maxAttempts = 60; // 最多尝试60次
        const interval = 1000; // 每秒检查一次
        let attempts = 0;

        while (attempts < maxAttempts) {
            const response = await axios.get(`/api/task/${taskId}/status`);
            const { status, progress, total, result } = response.data;

            if (onProgress && progress !== undefined && total !== undefined) {
                onProgress(progress, total);
            }

            if (status === 'completed' && result) {
                return result;
            } else if (status === 'failed') {
                throw new Error('任务处理失败');
            }

            await new Promise((resolve) => setTimeout(resolve, interval));
            attempts++;
        }

        throw new Error('任务处理超时');
    } catch (error) {
        console.error('轮询任务状态时出错:', error);
        throw error;
    }
}
