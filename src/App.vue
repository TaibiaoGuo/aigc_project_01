<script lang="ts" setup>
import { useTimeAgo } from '@vueuse/core';
import Header from '@/components/shared/Header.vue';
import Footer from '@/components/shared/Footer.vue';
import { useUserStore } from '@/store/user';
import ReloadPrompt from '@/pwa/ReloadPrompt.vue';
import ServiceWorker from './components/ServiceWorker.vue';

const userStore = useUserStore();

userStore.initUser();

const date = '__DATE__';
const timeAgo = useTimeAgo(date);
</script>
<template>
    <el-container>
        <!-- <el-header>
            <Header />
        </el-header> -->
        <el-main class="main">
            <RouterView />
            <br />
            <!-- <ServiceWorker /> -->
            <br />
        </el-main>
        <!-- <el-footer>
            <Footer />
        </el-footer> -->
    </el-container>
    <ReloadPrompt />
</template>
<style lang="scss">
#app {
    font-family: 'AlimamaShuHeiTi','A10', Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    line-height: 150%;
    text-align: center;
}

* {
    user-select: none;
}

.main {
    min-height: 500px;
    padding: 0;
}

.sw-msg {
    margin-top: 20px;
}

body {
    margin: 0;
    padding: 0;
}

/* 添加字体类，方便在特定元素上使用 */
.font-a10 {
    font-family: 'A10', sans-serif;
}

.font-a77 {
    font-family: 'A77', sans-serif;
}

.font-alimama {
    font-family: 'AlimamaShuHeiTi', sans-serif;
}
</style>
