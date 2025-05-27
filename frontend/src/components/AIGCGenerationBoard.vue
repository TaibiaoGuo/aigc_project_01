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
const usernameActive = ref(false);
const passwordActive = ref(false);

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

const focusUsername = () => {
  usernameActive.value = true;
};

const blurUsername = () => {
  usernameActive.value = false;
};

const focusPassword = () => {
  passwordActive.value = true;
};

const blurPassword = () => {
  passwordActive.value = false;
};
</script>

<template>
  <div class="admin-login-container">
    <div class="login-frame">
      <div class="login-box">
        <!-- 标题区域 -->
        <div class="title-area">
          <h1 class="main-title">管理者模式</h1>
          <p class="sub-title">Manager model</p>
        </div>
        
        <!-- 输入区域 -->
        <div class="input-group-container">
          <div class="input-group" :class="{ 'input-active': usernameActive }">
            <input 
              type="text" 
              v-model="formData.username" 
              placeholder="请输入邮箱/手机号/用户名"
              class="login-input"
              @focus="focusUsername"
              @blur="blurUsername"
            />
          </div>
          
          <div class="input-group" :class="{ 'input-active': passwordActive }">
            <input 
              type="password" 
              v-model="formData.password" 
              placeholder="请输入密码"
              class="login-input"
              @focus="focusPassword"
              @blur="blurPassword"
            />
          </div>
        </div>
        
        <!-- 错误信息 -->
        <div v-if="loginError" class="error-message">{{ loginError }}</div>
        
        <!-- 登录按钮 - 直接使用SVG图片 -->
        <div class="login-button-container">
          <img 
            src="@/assets/images/icon/quick-login.svg" 
            alt="快速登录" 
            class="login-button-image" 
            @click="handleLogin"
          />
        </div>
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
  background-image: url('@/assets/images/ui-skeleton.png'), url('@/assets/images/gradient.jpg');
  background-size: cover;
  background-position: center;
  background-blend-mode: plus-darker, normal;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-frame {
  position: relative;
  width: min(750px, 80%);
  height: min(570px, 80vh);
  filter: drop-shadow(0px 4px 4px rgba(17, 14, 58, 0.52));
}

.login-box {
  box-sizing: border-box;
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background: linear-gradient(119.39deg, rgba(255, 210, 233, 1) 0.75%, rgba(149, 215, 239, 1) 60.39%, rgba(142, 181, 240, 1) 100%);
  border: 5px solid #FFFFFF;
  backdrop-filter: blur(12px);
  border-radius: 25px;
  padding: min(47px, 5%);
  display: flex;
  flex-direction: column;
}

.title-area {
  position: relative;
  margin-bottom: min(60px, 10vh);
}

.main-title {
  font-family: 'A10', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: clamp(28px, 5vw, 40px);
  line-height: 1.2;
  color: #2E2E2E;
  text-shadow: 2px 2px 1.3px #FFFFFF;
  margin: 0;
  padding: 0;
}

.sub-title {
  font-family: 'Poppins', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: clamp(12px, 2vw, 16px);
  line-height: 1.5;
  text-transform: uppercase;
  color: #6E6E6E;
  opacity: 0.3;
  margin: min(20px, 3vh) 0 0 0;
  padding: 0;
}

.input-group-container {
  display: flex;
  flex-direction: column;
  gap: min(15px, 2vh);
  margin-bottom: min(40px, 5vh);
  width: 100%;
  flex-grow: 0;
}

.input-group {
  position: relative;
  width: 100%;
  transition: all 0.3s ease;
}

.input-active {
  transform: scale(1.02);
}

.login-input {
  box-sizing: border-box;
  width: 100%;
  height: min(74px, 8vh);
  background: #FFFFFF;
  border: 1px solid #383737;
  border-radius: 8px;
  padding: 0 min(20px, 3%);
  font-family: 'Poppins', sans-serif;
  font-style: normal;
  font-weight: 400;
  font-size: clamp(16px, 3vw, 24px);
  line-height: 1.5;
  color: #202020;
  transition: all 0.3s ease;
  outline: none;
}

.login-input:focus {
  border: 2px solid #6063DD;
  box-shadow: 0 0 8px rgba(96, 99, 221, 0.4);
}

.login-input::placeholder {
  color: #202020;
  opacity: 0.7;
}

.login-button-container {
  display: flex;
  border-radius: 30px;
  justify-content: center;
  align-items: center;
  margin-top: auto;
  margin-bottom: min(30px, 5vh);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.login-button-image {
  width: 100%;
  max-width: 655px;
  height: auto;
  cursor: pointer;
  pointer-events: auto; /* 允许点击事件 */
}

.login-button-container:hover {
  transform: translateY(-3px);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
}

.login-button-container:active {
  transform: translateY(2px);
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

.error-message {
  color: #ff4d4f;
  font-size: clamp(14px, 2vw, 18px);
  text-align: center;
  margin: 0;
  padding: 10px;
  background-color: rgba(255, 77, 79, 0.1);
  border-radius: 4px;
  position: absolute;
  width: 80%;
  left: 10%;
  bottom: min(120px, 15vh);
}

/* 防止页面滚动 */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}
</style>