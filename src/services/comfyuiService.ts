import axios from 'axios';

// 上传图像到 ComfyUI
export async function uploadImage(imageData: string): Promise<string> {
  try {
    // 将 base64 转换为 Blob
    const byteString = atob(imageData);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: 'image/png' });
    
    // 创建 FormData
    const formData = new FormData();
    formData.append('image', blob, 'sketch.png');
    
    // 上传图像
    const response = await axios.post('/api/upload/image', formData);
    
    if (response.data && response.data.name) {
      return response.data.name;
    } else {
      throw new Error('上传图像失败');
    }
  } catch (error) {
    console.error('上传图像时出错:', error);
    throw error;
  }
}

// 提交工作流到 ComfyUI
export async function submitPrompt(imageName: string, positivePrompt: string, negativePrompt: string): Promise<string> {
  try {
    const clientId = "baa1883608444b728f3ed985912c24f9";
    
    // 构建工作流 JSON
    const workflow = {
      "3": {
        "inputs": {
          "seed": Math.floor(Math.random() * 1000000000),
          "steps": 20,
          "cfg": 8,
          "sampler_name": "dpmpp_2m",
          "scheduler": "normal",
          "denoise": 0.8700000000000001,
          "model": [
            "14",
            0
          ],
          "positive": [
            "6",
            0
          ],
          "negative": [
            "7",
            0
          ],
          "latent_image": [
            "12",
            0
          ]
        },
        "class_type": "KSampler",
        "_meta": {
          "title": "K采样器"
        }
      },
      "6": {
        "inputs": {
          "text": positivePrompt,
          "clip": [
            "14",
            1
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP文本编码（提示）"
        }
      },
      "7": {
        "inputs": {
          "text": negativePrompt,
          "clip": [
            "14",
            1
          ]
        },
        "class_type": "CLIPTextEncode",
        "_meta": {
          "title": "CLIP文本编码（提示）"
        }
      },
      "8": {
        "inputs": {
          "samples": [
            "3",
            0
          ],
          "vae": [
            "14",
            2
          ]
        },
        "class_type": "VAEDecode",
        "_meta": {
          "title": "VAE解码"
        }
      },
      "9": {
        "inputs": {
          "filename_prefix": "ComfyUI",
          "images": [
            "8",
            0
          ]
        },
        "class_type": "SaveImage",
        "_meta": {
          "title": "保存图像"
        }
      },
      "10": {
        "inputs": {
          "image": imageName,
          "upload": "image"
        },
        "class_type": "LoadImage",
        "_meta": {
          "title": "加载图像"
        }
      },
      "12": {
        "inputs": {
          "pixels": [
            "10",
            0
          ],
          "vae": [
            "14",
            2
          ]
        },
        "class_type": "VAEEncode",
        "_meta": {
          "title": "VAE编码"
        }
      },
      "14": {
        "inputs": {
          "ckpt_name": "juggernautXL_version6Rundiffusion.safetensors"
        },
        "class_type": "CheckpointLoaderSimple",
        "_meta": {
          "title": "加载检查点"
        }
      }
    };
    
    // 提交工作流
    const response = await axios.post('/api/prompt', {
      client_id: clientId,
      prompt: workflow
    });
    
    if (response.data && response.data.prompt_id) {
      return response.data.prompt_id;
    } else {
      throw new Error('提交工作流失败');
    }
  } catch (error) {
    console.error('提交工作流时出错:', error);
    throw error;
  }
}

// 轮询任务状态
export async function pollTaskStatus(promptId: string, onProgress: (progress: number, total: number) => void): Promise<string> {
  try {
    // 轮询间隔 (毫秒)
    const pollInterval = 2000;
    // 最大轮询次数
    const maxPolls = 30;
    
    for (let i = 0; i < maxPolls; i++) {
      onProgress(i + 1, maxPolls);
      
      // 等待一段时间
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      // 获取任务状态
      const response = await axios.get(`/api/history/${promptId}`);
      
      if (response.data && response.data[promptId]) {
        const taskData = response.data[promptId];
        
        // 检查是否有输出图像
        if (taskData.outputs) {
          // 找到第一个输出节点
          const outputNode = Object.values(taskData.outputs)[0] as any;
          
          if (outputNode && outputNode.images && outputNode.images.length > 0) {
            const image = outputNode.images[0];
            return image.filename;
          }
        }
      }
    }
    
    throw new Error('任务处理超时');
  } catch (error) {
    console.error('轮询任务状态时出错:', error);
    throw error;
  }
}

// 获取生成的图像
export async function getGeneratedImage(filename: string): Promise<string> {
  try {
    // 构建图像 URL
    const imageUrl = `/api/view?filename=${filename}&type=output`;
    
    // 获取图像数据
    const response = await axios.get(imageUrl, {
      responseType: 'blob'
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