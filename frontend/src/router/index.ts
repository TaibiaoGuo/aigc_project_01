import { getToken } from '@/utils/token';
import { createRouter, createWebHistory } from 'vue-router';
import ResultView from '@/views/ResultView.vue';

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
        path: '/',
        name: 'Index',
        meta: {
            title: '首页',
            keepAlive: true,
            requireAuth: false,
        },
        component: () => import('@/components/HomeEntry.vue'),
    },
    {
        path: '/app',
        name: 'App',
        meta: {
            title: 'AI 图像生成',
            keepAlive: true,
            requireAuth: false,
        },
        // component: () => import('@/pages/Index.vue'),
        component: () => import('@/components/SimpleDrawingBoard.vue'),
    },
    {
        path: '/display',
        name: 'Display',
        meta: {
            title: 'AI 图像生成',
            keepAlive: true,
            requireAuth: false,
        },
        component: () => import('@/components/SimpleDisplayBoard.vue'),
    },
    
    {
        path: '/admin',
        name: 'Admin',
        meta: {
            title: '管理员登录',
            keepAlive: false,
            requireAuth: false,
        },
        component: () => import('@/components/AdminLogin.vue'),
    },
    {
        path: '/detail',
        name: 'Detail',
        meta: {
            title: '管理页面',
            keepAlive: true,
            requireAuth: true,
        },
        component: () => import('@/pages/Detail.vue'),
    },
    {
        path: '/result',
        name: 'Result',
        meta: {
            title: 'AI 图像生成结果',
            keepAlive: false,
            requireAuth: false,
        },
        component: ResultView,
    },
    // 添加绘图板路由
    {
        path: '/drawing',
        name: 'Drawing',
        meta: {
            title: '手绘交互区域',
            keepAlive: true,
            requireAuth: false,
        },
        component: () => import('@/components/DrawingBoard.vue'),
    },
    // 添加AIGC生成板路由
    {
        path: '/aigc-result',
        name: 'AIGCResult',
        meta: {
            title: 'AIGC实时生成画面',
            keepAlive: false,
            requireAuth: false,
        },
        component: () => import('@/components/AIGCGenerationBoard.vue'),
    },
  ]
});

export default router;
router.beforeEach(async (to) => {
    const token = getToken();
    if (!token && to.name !== 'Index' && to.name !== 'Result' && to.name !== 'App' && to.name !== 'Admin' && to.name !== 'Drawing' && to.name !== 'AIGCResult' && to.name !== 'Display') {
        return { name: 'Index' };
    }
});

export { router };
