// vite.config.mts
import { defineConfig } from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.6_sass@1.77.6/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/@vitejs+plugin-vue@5.0.5_vite@5.3.1_vue@3.4.29/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/unplugin-auto-import@0.17.6_@vueuse+core@10.11.0_rollup@4.18.0/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/unplugin-vue-components@0.27.0_rollup@4.18.0_vue@3.4.29/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/unplugin-vue-components@0.27.0_rollup@4.18.0_vue@3.4.29/node_modules/unplugin-vue-components/dist/resolvers.js";
import * as path from "path";
import { VitePWA } from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/vite-plugin-pwa@0.16.7_vite@5.3.1_workbox-build@7.3.0_workbox-window@7.1.0/node_modules/vite-plugin-pwa/dist/index.js";
import replace from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/@rollup+plugin-replace@5.0.7_rollup@4.18.0/node_modules/@rollup/plugin-replace/dist/es/index.js";
import VueI18n from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/@intlify+unplugin-vue-i18n@4.0.0_rollup@4.18.0_vue-i18n@9.13.1/node_modules/@intlify/unplugin-vue-i18n/lib/vite.mjs";
import Unocss from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/unocss@0.61.0_postcss@8.4.38_rollup@4.18.0_vite@5.3.1/node_modules/unocss/dist/vite.mjs";
import VueDevTools from "file:///D:/app/Wechat/xwechat_files/wxid_nfydm90evedb22_dbd9/msg/file/2025-05/img2comfyui%203/img2comfyui/frontend/node_modules/.pnpm/vite-plugin-vue-devtools@7.3.2_rollup@4.18.0_vite@5.3.1_vue@3.4.29/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_dirname = "D:\\app\\Wechat\\xwechat_files\\wxid_nfydm90evedb22_dbd9\\msg\\file\\2025-05\\img2comfyui 3\\img2comfyui\\frontend";
var pwaOptions = {
  mode: "development",
  base: "/",
  includeAssets: ["favicon.svg"],
  manifest: {
    name: "PWA Router",
    short_name: "PWA Router",
    theme_color: "#ffffff",
    icons: [
      {
        src: "pwa-192x192.png",
        // <== don't add slash, for testing
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/pwa-512x512.png",
        // <== don't remove slash, for testing
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "pwa-512x512.png",
        // <== don't add slash, for testing
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  },
  devOptions: {
    enabled: process.env.SW_DEV === "true",
    /* when using generateSW the PWA plugin will switch to classic */
    type: "module",
    navigateFallback: "index.html"
  }
};
var claims = process.env.CLAIMS === "true";
var reload = process.env.RELOAD_SW === "true";
if (process.env.SW === "true") {
  pwaOptions.srcDir = "src";
  pwaOptions.filename = claims ? "claims-sw.ts" : "prompt-sw.ts";
  pwaOptions.strategies = "injectManifest";
  pwaOptions.manifest.name = "PWA Inject Manifest";
  pwaOptions.manifest.short_name = "PWA Inject";
}
if (claims) pwaOptions.registerType = "autoUpdate";
var vite_config_default = defineConfig(({ command }) => {
  const isProd = command === "build";
  return {
    // 修改基础路径为'/'，确保与路由配置一致
    base: "/",
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    build: {
      target: "es2020",
      cssTarget: "chrome80",
      rollupOptions: {
        output: {
          // 入口文件名（不能变，否则所有打包的 js hash 值全变了）
          entryFileNames: "index.js",
          // 配置CDN路径前缀
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split(".");
            let extType = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              extType = "media";
            } else if (/\.(png|jpe?g|gif|svg|ico|webp)(\?.*)?$/i.test(assetInfo.name)) {
              extType = "img";
            } else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
              extType = "fonts";
            }
            return `${extType}/[name]-[hash][extname]`;
          },
          chunkFileNames: "js/[name]-[hash].js",
          manualChunks: {
            vue: ["vue", "pinia", "vue-router"],
            elementplus: ["element-plus", "@element-plus/icons-vue"]
          }
        }
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/element/index.scss" as *;`
        }
      }
    },
    plugins: [
      vue(),
      AutoImport({
        imports: [
          "vue",
          "vue-router",
          "vue-i18n",
          "vue/macros",
          "@vueuse/head",
          "@vueuse/core"
        ],
        resolvers: [ElementPlusResolver()],
        dts: "auto-imports.d.ts",
        vueTemplate: true
      }),
      Components({
        dts: "components.d.ts",
        resolvers: [ElementPlusResolver()]
      }),
      // https://github.com/antfu/unocss
      // see unocss.config.ts for config
      Unocss(),
      VitePWA(pwaOptions),
      // https://github.com/intlify/bundle-tools/tree/main/packages/unplugin-vue-i18n
      VueI18n({
        runtimeOnly: true,
        compositionOnly: true,
        /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        strictMessage: false,
        fullInstall: true,
        // do not support ts extension
        include: [path.resolve(__vite_injected_original_dirname, "locales/*.{yaml,yml,json}")]
      }),
      replace({
        preventAssignment: true,
        __DATE__: (/* @__PURE__ */ new Date()).toISOString(),
        __RELOAD_SW__: reload ? "true" : ""
      }),
      VueDevTools()
    ],
    server: {
      port: 9e3,
      host: "127.0.0.1",
      proxy: {
        // 修改为后端FastAPI服务器
        "/api": {
          target: 'http://127.0.0.1:8000',
          // target: "http://120.79.22.43:30083/",
          changeOrigin: true
          // 不需要重写路径，因为后端API已经包含/api前缀
          // rewrite: (path) => path.replace(/^/api/, ''),
        }
      }
    },
    // https://github.com/vitest-dev/vitest
    test: {
      include: ["src/tests/**/*.test.ts"],
      environment: "jsdom",
      server: {
        deps: {
          inline: ["@vue", "@vueuse", "element-plus", "pinia"]
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcYXBwXFxcXFdlY2hhdFxcXFx4d2VjaGF0X2ZpbGVzXFxcXHd4aWRfbmZ5ZG05MGV2ZWRiMjJfZGJkOVxcXFxtc2dcXFxcZmlsZVxcXFwyMDI1LTA1XFxcXGltZzJjb21meXVpIDNcXFxcaW1nMmNvbWZ5dWlcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGFwcFxcXFxXZWNoYXRcXFxceHdlY2hhdF9maWxlc1xcXFx3eGlkX25meWRtOTBldmVkYjIyX2RiZDlcXFxcbXNnXFxcXGZpbGVcXFxcMjAyNS0wNVxcXFxpbWcyY29tZnl1aSAzXFxcXGltZzJjb21meXVpXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLm10c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovYXBwL1dlY2hhdC94d2VjaGF0X2ZpbGVzL3d4aWRfbmZ5ZG05MGV2ZWRiMjJfZGJkOS9tc2cvZmlsZS8yMDI1LTA1L2ltZzJjb21meXVpJTIwMy9pbWcyY29tZnl1aS9mcm9udGVuZC92aXRlLmNvbmZpZy5tdHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnO1xuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XG5pbXBvcnQgeyBFbGVtZW50UGx1c1Jlc29sdmVyIH0gZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvcmVzb2x2ZXJzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBNYW5pZmVzdE9wdGlvbnMsIFZpdGVQV0EsIFZpdGVQV0FPcHRpb25zIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcbmltcG9ydCByZXBsYWNlIGZyb20gJ0Byb2xsdXAvcGx1Z2luLXJlcGxhY2UnO1xuaW1wb3J0IFZ1ZUkxOG4gZnJvbSAnQGludGxpZnkvdW5wbHVnaW4tdnVlLWkxOG4vdml0ZSc7XG5pbXBvcnQgVW5vY3NzIGZyb20gJ3Vub2Nzcy92aXRlJztcbmltcG9ydCBWdWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnO1xuXG5jb25zdCBwd2FPcHRpb25zOiBQYXJ0aWFsPFZpdGVQV0FPcHRpb25zPiA9IHtcbiAgICBtb2RlOiAnZGV2ZWxvcG1lbnQnLFxuICAgIGJhc2U6ICcvJyxcbiAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uc3ZnJ10sXG4gICAgbWFuaWZlc3Q6IHtcbiAgICAgICAgbmFtZTogJ1BXQSBSb3V0ZXInLFxuICAgICAgICBzaG9ydF9uYW1lOiAnUFdBIFJvdXRlcicsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnI2ZmZmZmZicsXG4gICAgICAgIGljb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc3JjOiAncHdhLTE5MngxOTIucG5nJywgLy8gPD09IGRvbid0IGFkZCBzbGFzaCwgZm9yIHRlc3RpbmdcbiAgICAgICAgICAgICAgICBzaXplczogJzE5MngxOTInLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzcmM6ICcvcHdhLTUxMng1MTIucG5nJywgLy8gPD09IGRvbid0IHJlbW92ZSBzbGFzaCwgZm9yIHRlc3RpbmdcbiAgICAgICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzcmM6ICdwd2EtNTEyeDUxMi5wbmcnLCAvLyA8PT0gZG9uJ3QgYWRkIHNsYXNoLCBmb3IgdGVzdGluZ1xuICAgICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXG4gICAgICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAgZGV2T3B0aW9uczoge1xuICAgICAgICBlbmFibGVkOiBwcm9jZXNzLmVudi5TV19ERVYgPT09ICd0cnVlJyxcbiAgICAgICAgLyogd2hlbiB1c2luZyBnZW5lcmF0ZVNXIHRoZSBQV0EgcGx1Z2luIHdpbGwgc3dpdGNoIHRvIGNsYXNzaWMgKi9cbiAgICAgICAgdHlwZTogJ21vZHVsZScsXG4gICAgICAgIG5hdmlnYXRlRmFsbGJhY2s6ICdpbmRleC5odG1sJyxcbiAgICB9LFxufTtcblxuY29uc3QgY2xhaW1zID0gcHJvY2Vzcy5lbnYuQ0xBSU1TID09PSAndHJ1ZSc7XG5jb25zdCByZWxvYWQgPSBwcm9jZXNzLmVudi5SRUxPQURfU1cgPT09ICd0cnVlJztcblxuaWYgKHByb2Nlc3MuZW52LlNXID09PSAndHJ1ZScpIHtcbiAgICBwd2FPcHRpb25zLnNyY0RpciA9ICdzcmMnO1xuICAgIHB3YU9wdGlvbnMuZmlsZW5hbWUgPSBjbGFpbXMgPyAnY2xhaW1zLXN3LnRzJyA6ICdwcm9tcHQtc3cudHMnO1xuICAgIHB3YU9wdGlvbnMuc3RyYXRlZ2llcyA9ICdpbmplY3RNYW5pZmVzdCc7XG4gICAgKHB3YU9wdGlvbnMubWFuaWZlc3QgYXMgUGFydGlhbDxNYW5pZmVzdE9wdGlvbnM+KS5uYW1lID1cbiAgICAgICAgJ1BXQSBJbmplY3QgTWFuaWZlc3QnO1xuICAgIChwd2FPcHRpb25zLm1hbmlmZXN0IGFzIFBhcnRpYWw8TWFuaWZlc3RPcHRpb25zPikuc2hvcnRfbmFtZSA9ICdQV0EgSW5qZWN0Jztcbn1cblxuaWYgKGNsYWltcykgcHdhT3B0aW9ucy5yZWdpc3RlclR5cGUgPSAnYXV0b1VwZGF0ZSc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiB7XG4gIC8vIFx1NTIyNFx1NjVBRFx1NjYyRlx1NTQyNlx1NEUzQVx1NzUxRlx1NEVBN1x1NzNBRlx1NTg4M1x1Njc4NFx1NUVGQVxuICBjb25zdCBpc1Byb2QgPSBjb21tYW5kID09PSAnYnVpbGQnO1xuICBcbiAgcmV0dXJuIHtcbiAgICAvLyBcdTRGRUVcdTY1MzlcdTU3RkFcdTc4NDBcdThERUZcdTVGODRcdTRFM0EnLydcdUZGMENcdTc4NkVcdTRGRERcdTRFMEVcdThERUZcdTc1MzFcdTkxNERcdTdGNkVcdTRFMDBcdTgxRjRcbiAgICBiYXNlOiAnLycsXG4gICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgICAgICBjc3NUYXJnZXQ6ICdjaHJvbWU4MCcsXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICAgIG91dHB1dDoge1xuICAgICAgICAgICAgICAgIC8vIFx1NTE2NVx1NTNFM1x1NjU4N1x1NEVGNlx1NTQwRFx1RkYwOFx1NEUwRFx1ODBGRFx1NTNEOFx1RkYwQ1x1NTQyNlx1NTIxOVx1NjI0MFx1NjcwOVx1NjI1M1x1NTMwNVx1NzY4NCBqcyBoYXNoIFx1NTAzQ1x1NTE2OFx1NTNEOFx1NEU4Nlx1RkYwOVxuICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnaW5kZXguanMnLFxuICAgICAgICAgICAgICAgIC8vIFx1OTE0RFx1N0Y2RUNETlx1OERFRlx1NUY4NFx1NTI0RFx1N0YwMFxuICAgICAgICAgICAgICAgIGFzc2V0RmlsZU5hbWVzOiAoYXNzZXRJbmZvKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZS5zcGxpdCgnLicpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZXh0VHlwZSA9IGluZm9baW5mby5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKC9cXC4obXA0fHdlYm18b2dnfG1wM3x3YXZ8ZmxhY3xhYWMpKFxcPy4qKT8kL2kudGVzdChhc3NldEluZm8ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dFR5cGUgPSAnbWVkaWEnO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKC9cXC4ocG5nfGpwZT9nfGdpZnxzdmd8aWNvfHdlYnApKFxcPy4qKT8kL2kudGVzdChhc3NldEluZm8ubmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dFR5cGUgPSAnaW1nJztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXFwuKHdvZmYyP3xlb3R8dHRmfG90ZikoXFw/LiopPyQvaS50ZXN0KGFzc2V0SW5mby5uYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXh0VHlwZSA9ICdmb250cyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2V4dFR5cGV9L1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY2h1bmtGaWxlTmFtZXM6ICdqcy9bbmFtZV0tW2hhc2hdLmpzJyxcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICAgICAgICAgICAgdnVlOiBbJ3Z1ZScsICdwaW5pYScsICd2dWUtcm91dGVyJ10sXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnRwbHVzOiBbJ2VsZW1lbnQtcGx1cycsICdAZWxlbWVudC1wbHVzL2ljb25zLXZ1ZSddLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgIH0sXG4gICAgY3NzOiB7XG4gICAgICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgICAgICAgIHNjc3M6IHtcbiAgICAgICAgICAgICAgICBhZGRpdGlvbmFsRGF0YTogYEB1c2UgXCJAL2Fzc2V0cy9zdHlsZXMvZWxlbWVudC9pbmRleC5zY3NzXCIgYXMgKjtgLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgdnVlKCksXG4gICAgICAgIEF1dG9JbXBvcnQoe1xuICAgICAgICAgICAgaW1wb3J0czogW1xuICAgICAgICAgICAgICAgICd2dWUnLFxuICAgICAgICAgICAgICAgICd2dWUtcm91dGVyJyxcbiAgICAgICAgICAgICAgICAndnVlLWkxOG4nLFxuICAgICAgICAgICAgICAgICd2dWUvbWFjcm9zJyxcbiAgICAgICAgICAgICAgICAnQHZ1ZXVzZS9oZWFkJyxcbiAgICAgICAgICAgICAgICAnQHZ1ZXVzZS9jb3JlJyxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZXNvbHZlcnM6IFtFbGVtZW50UGx1c1Jlc29sdmVyKCldLFxuICAgICAgICAgICAgZHRzOiAnYXV0by1pbXBvcnRzLmQudHMnLFxuICAgICAgICAgICAgdnVlVGVtcGxhdGU6IHRydWUsXG4gICAgICAgIH0pLFxuICAgICAgICBDb21wb25lbnRzKHtcbiAgICAgICAgICAgIGR0czogJ2NvbXBvbmVudHMuZC50cycsXG4gICAgICAgICAgICByZXNvbHZlcnM6IFtFbGVtZW50UGx1c1Jlc29sdmVyKCldLFxuICAgICAgICB9KSxcblxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW50ZnUvdW5vY3NzXG4gICAgICAgIC8vIHNlZSB1bm9jc3MuY29uZmlnLnRzIGZvciBjb25maWdcbiAgICAgICAgVW5vY3NzKCksXG5cbiAgICAgICAgVml0ZVBXQShwd2FPcHRpb25zKSxcblxuICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vaW50bGlmeS9idW5kbGUtdG9vbHMvdHJlZS9tYWluL3BhY2thZ2VzL3VucGx1Z2luLXZ1ZS1pMThuXG4gICAgICAgIFZ1ZUkxOG4oe1xuICAgICAgICAgICAgcnVudGltZU9ubHk6IHRydWUsXG4gICAgICAgICAgICBjb21wb3NpdGlvbk9ubHk6IHRydWUsXG4gICAgICAgICAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1jb21tZW50ICovXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICBzdHJpY3RNZXNzYWdlOiBmYWxzZSxcbiAgICAgICAgICAgIGZ1bGxJbnN0YWxsOiB0cnVlLFxuICAgICAgICAgICAgLy8gZG8gbm90IHN1cHBvcnQgdHMgZXh0ZW5zaW9uXG4gICAgICAgICAgICBpbmNsdWRlOiBbcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2xvY2FsZXMvKi57eWFtbCx5bWwsanNvbn0nKV0sXG4gICAgICAgIH0pLFxuXG4gICAgICAgIHJlcGxhY2Uoe1xuICAgICAgICAgICAgcHJldmVudEFzc2lnbm1lbnQ6IHRydWUsXG4gICAgICAgICAgICBfX0RBVEVfXzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgX19SRUxPQURfU1dfXzogcmVsb2FkID8gJ3RydWUnIDogJycsXG4gICAgICAgIH0pLFxuXG4gICAgICAgIFZ1ZURldlRvb2xzKCksXG4gICAgXSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgcG9ydDogOTAwMCxcbiAgICAgICAgaG9zdDogJzEyNy4wLjAuMScsXG4gICAgICAgIHByb3h5OiB7XG4gICAgICAgICAgICAvLyBcdTRGRUVcdTY1MzlcdTRFM0FcdTU0MEVcdTdBRUZGYXN0QVBJXHU2NzBEXHU1MkExXHU1NjY4XG4gICAgICAgICAgICAnL2FwaSc6IHtcbiAgICAgICAgICAgICAgICAvLyB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDAnLFxuICAgICAgICAgICAgICAgIHRhcmdldDogJ2h0dHA6Ly8xMjAuNzkuMjIuNDM6MzAwODMvJyxcbiAgICAgICAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgICAgICAgLy8gXHU0RTBEXHU5NzAwXHU4OTgxXHU5MUNEXHU1MTk5XHU4REVGXHU1Rjg0XHVGRjBDXHU1NkUwXHU0RTNBXHU1NDBFXHU3QUVGQVBJXHU1REYyXHU3RUNGXHU1MzA1XHU1NDJCL2FwaVx1NTI0RFx1N0YwMFxuICAgICAgICAgICAgICAgIC8vIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL14vYXBpLywgJycpLFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcblxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS92aXRlc3QtZGV2L3ZpdGVzdFxuICAgIHRlc3Q6IHtcbiAgICAgICAgaW5jbHVkZTogWydzcmMvdGVzdHMvKiovKi50ZXN0LnRzJ10sXG4gICAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxuICAgICAgICBzZXJ2ZXI6IHtcbiAgICAgICAgICAgIGRlcHM6IHtcbiAgICAgICAgICAgICAgICBpbmxpbmU6IFsnQHZ1ZScsICdAdnVldXNlJywgJ2VsZW1lbnQtcGx1cycsICdwaW5pYSddLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxufX0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUNoQixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLDJCQUEyQjtBQUNwQyxZQUFZLFVBQVU7QUFDdEIsU0FBMEIsZUFBK0I7QUFDekQsT0FBTyxhQUFhO0FBQ3BC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
