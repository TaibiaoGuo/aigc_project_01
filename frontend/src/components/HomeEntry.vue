<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const startApp = () => {
  router.push('/app');
};

const goToAdminLogin = () => {
  router.push('/admin');
};
</script>

<template>
  <div class="home-entry-container">
    <div class="background-container">
      <!-- 按钮容器 -->
      <div class="buttons-container">
        <!-- 开始按钮 -->
        <div class="start-button-wrapper" @click="startApp">
          <img src="@/assets/images/icon/开始.svg" alt="开始" class="button-image" />
        </div>
        
        <!-- 管理者模式按钮 -->
        <div class="admin-button-wrapper" @click="goToAdminLogin">
          <img src="@/assets/images/icon/管理员模式.svg" alt="管理员模式" class="button-image" />
        </div>
      </div>
      
      <!-- Logo 图片 -->
      <div class="logo-container">
        <img src="@/assets/images/logo-text.svg" alt="艺启创 欢迎来到灵动创想" class="logo-text" />
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

.home-entry-container {
  position: fixed;
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.background-container {
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  background-image: url('@/assets/images/background.png');
  background-size: cover;
  background-position: center;
  background-blend-mode: plus-darker, normal;
}

.buttons-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0;
  gap: 3.33vw; /* 64px / 1920px */
  position: absolute;
  height: 9.08%; /* 98.02px / 1080px */
  left: calc(50% - 39.65vw/2);
  top: 70.55vh; /* 761.98px / 1080px */
}

.start-button-wrapper {
  border-radius: 30px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 9.08vh; /* 98.02px / 1080px */
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
}

.start-button-wrapper:hover {
  border-radius: 30px;
  transform: translateY(-0.28vh); /* -3px / 1080px */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
}

.start-button-wrapper:active {
  transform: translateY(0.19vh); /* 2px / 1080px */
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

.admin-button-wrapper {
  border-radius: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 9.07vh; /* 98px / 1080px */
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  user-select: none;
}

.admin-button-wrapper:hover {
  transform: translateY(-0.28vh); /* -3px / 1080px */
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.15);
}

.admin-button-wrapper:active {
  transform: translateY(0.19vh); /* 2px / 1080px */
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
}

.button-image {
  width: 100%;
  height: 100%;
  object-fit: fill;
}

.logo-container {
  position: absolute;
  width: 55.42vw; /* 1064px / 1920px */
  height: 45.83vh; /* 495px / 1080px */
  left: 22.29vw; /* 428px / 1920px */
  top: 17.22vh; /* 186px / 1080px */
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo-text {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 防止页面滚动 */
html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100%;
}
</style>