<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';

const router = useRouter();
const userStore = useUserStore();

const formData = ref({
  username: '',
  password: ''
});

const loginError = ref('');

const handleLogin = async () => {
  try {
    loginError.value = '';
    
    // 这里可以添加实际的登录逻辑
    // 简单模拟登录验证
    if (formData.value.username === 'admin' && formData.value.password === 'admin') {
      // 登录成功
      userStore.updateUser({
        username: formData.value.username,
        role: 'admin'
      });
      
      // 跳转到管理页面
      router.push('/detail');
    } else {
      loginError.value = '用户名或密码错误';
    }
  } catch (error) {
    loginError.value = '登录失败，请重试';
    console.error('登录错误:', error);
  }
};

const goBack = () => {
  router.push('/');
};
</script>

<template>
  <div class="admin-login-container">
    <!-- 右上角布局 -->
    <div class="header-container">
      <div class="logo-wrapper">
        <img src="@/assets/images/logo.svg" alt="艺启创" class="header-logo px-5" />
      </div>
      <div class="back-button" @click="goBack">
        返回
      </div>
    </div>
    
    <div class="login-frame">
      <div class="login-box">
        <!-- 标题区域 -->
        <div class="title-area">
          <h1 class="main-title">管理者模式</h1>
          <p class="sub-title">Manager model</p>
        </div>
        
        <!-- 输入区域 -->
        <div class="input-group-container">
          <div class="input-group">
            <input 
              type="text" 
              v-model="formData.username" 
              placeholder="请输入邮箱/手机号/用户名"
              class="login-input"
            />
          </div>
          
          <div class="input-group">
            <input 
              type="password" 
              v-model="formData.password" 
              placeholder="请输入密码"
              class="login-input"
            />
          </div>
        </div>
        
        
        <!-- 登录按钮 - 直接使用SVG图片 -->
        <div class="login-button-container">
          <img 
            src="@/assets/images/icon/快速登录.svg" 
            alt="快速登录" 
            class="login-button-image" 
            @click="handleLogin"
          />
        </div>
        <!-- 错误信息 -->
        <div v-if="loginError" class="error-message">{{ loginError }}</div>
      </div>
    </div>
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
  pointer-events: none;
}

.admin-login-container {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background-image: url('@/assets/images/创意中心骨架UI.png'), url('@/assets/images/独特渐变.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: plus-darker, normal;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 右上角布局样式 */
.header-container {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 80px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 0 30px;
  z-index: 10;
}

.logo-wrapper {
  display: flex;
  align-items: center;
}

.header-logo {
  height: 60px;
  pointer-events: auto;
}

.back-button {
  background: rgba(91, 95, 115, 0.22);
  border-radius: 20px;
  color: #FFFFFF;
  padding: 20px 40px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;
}

.back-button:hover {
  background-color: rgba(91, 95, 115, 0.5);
  transform: translateY(-2px);
}

.back-button:active {
  transform: translateY(1px);
}

.login-frame {
  position: relative;
  width: 749px;
  height: 568px;
  filter: drop-shadow(0px 4px 4px rgba(17, 14, 58, 0.52));
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  background: linear-gradient(119.39deg, rgb(255, 210, 233) 0.75%, rgb(149, 215, 239) 60.39%, rgb(142, 181, 240) 100%);
  border: 5px solid #FFFFFF;
  backdrop-filter: blur(12px);
  border-radius: 25px;
  padding: 47px;
  display: flex;
  flex-direction: column;
}

.title-area {
  margin-bottom: 60px;
}

.main-title {
  font-family: 'A10', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 40px;
  line-height: 48px;
  color: #2E2E2E;
  text-shadow: 2px 2px 1.3px #FFFFFF;
  margin: 0;
  padding: 0;
}

.sub-title {
  font-family: 'Poppins', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  text-transform: uppercase;
  color: #6E6E6E;
  opacity: 0.3;
  margin: 20px 0 0 0;
  padding: 0;
}

.input-group-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 40px;
  width: 100%;
}

.input-group {
  width: 100%;
  display: flex;
}

.login-input {
  box-sizing: border-box;
  width: 100%;
  height: 74px;
  background: #FFFFFF;
  border: 1px solid #383737;
  border-radius: 8px;
  padding: 0 20px;
  font-family: 'Poppins', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: 24px;
  line-height: 36px;
  color: #202020;
}

.login-input::placeholder {
  color: #6E6E6E;
}

.login-button-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: auto;
  width: 100%;
}

.login-button-image {
  width: 100%;
  max-width: 655px;
  height: auto;
  cursor: pointer;
  pointer-events: auto; /* 允许点击事件 */
  transition: transform 0.2s ease;
}

.login-button-container:hover .login-button-image {
  transform: translateY(-3px);
}

.login-button-container:active .login-button-image {
  transform: translateY(2px);
}

.error-message {
  color: #ff4d4f;
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
}

/* 防止页面滚动 */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}

@media (max-width: 768px) {
  .login-frame {
    width: 90%;
    height: auto;
    aspect-ratio: 749/568;
  }
  
  .login-box {
    padding: 30px;
  }
  
  .title-area {
    margin-bottom: 30px;
  }
  
  .main-title {
    font-size: 32px;
    line-height: 38px;
  }
  
  .sub-title {
    font-size: 14px;
    margin-top: 10px;
  }
  
  .header-container {
    height: 60px;
    padding: 0 15px;
  }
  
  .header-logo {
    height: 30px;
  }
  
  .back-button {
    padding: 6px 15px;
    font-size: 14px;
  }
}
</style>