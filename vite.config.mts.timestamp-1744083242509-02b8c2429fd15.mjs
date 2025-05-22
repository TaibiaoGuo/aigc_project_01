// vite.config.mts
import { defineConfig } from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/vite@5.3.1_@types+node@20.14.6_sass@1.77.6_stylus@0.57.0_terser@5.31.1/node_modules/vite/dist/node/index.js";
import vue from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/@vitejs+plugin-vue@5.0.5_vite@5.3.1_@types+node@20.14.6_sass@1.77.6_stylus@0.57.0_terser@5.31_zmlsxxhfadk5tdoz47drjp4qey/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import AutoImport from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/unplugin-auto-import@0.17.6_@vueuse+core@10.11.0_vue@3.4.29_typescript@5.4.5___rollup@4.18.0/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/unplugin-vue-components@0.27.0_@babel+parser@7.27.0_rollup@4.18.0_vue@3.4.29_typescript@5.4.5_/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/unplugin-vue-components@0.27.0_@babel+parser@7.27.0_rollup@4.18.0_vue@3.4.29_typescript@5.4.5_/node_modules/unplugin-vue-components/dist/resolvers.js";
import * as path from "path";
import { VitePWA } from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/vite-plugin-pwa@0.16.7_vite@5.3.1_@types+node@20.14.6_sass@1.77.6_stylus@0.57.0_terser@5.31.1_bbcde6cx7hmkm3xonxisepkzce/node_modules/vite-plugin-pwa/dist/index.js";
import replace from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/@rollup+plugin-replace@5.0.7_rollup@4.18.0/node_modules/@rollup/plugin-replace/dist/es/index.js";
import VueI18n from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/@intlify+unplugin-vue-i18n@4.0.0_rollup@4.18.0_vue-i18n@9.13.1_vue@3.4.29_typescript@5.4.5__/node_modules/@intlify/unplugin-vue-i18n/lib/vite.mjs";
import Unocss from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/unocss@0.61.0_postcss@8.4.38_rollup@4.18.0_vite@5.3.1_@types+node@20.14.6_sass@1.77.6_stylus@0.57.0_terser@5.31.1_/node_modules/unocss/dist/vite.mjs";
import VueDevTools from "file:///D:/janxl/workplace/NodeJS/bot-frontend-vite/node_modules/.pnpm/vite-plugin-vue-devtools@7.3.2_rollup@4.18.0_vite@5.3.1_@types+node@20.14.6_sass@1.77.6_stylus@0.57.0_terser@5.31.1_/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var __vite_injected_original_dirname = "D:\\janxl\\workplace\\NodeJS\\bot-frontend-vite";
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
    // 根据环境动态设置基础路径
    base: isProd ? "https://mybox-1257251314.cos.ap-chengdu.myqcloud.com/www/test/bot/" : "/",
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "src")
      }
    },
    build: {
      target: "es2015",
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
        "/api": {
          target: "http://172.20.47.190:18080",
          changeOrigin: true,
          rewrite: (path2) => path2.replace(/^\/api/, "")
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubXRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcamFueGxcXFxcd29ya3BsYWNlXFxcXE5vZGVKU1xcXFxib3QtZnJvbnRlbmQtdml0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcamFueGxcXFxcd29ya3BsYWNlXFxcXE5vZGVKU1xcXFxib3QtZnJvbnRlbmQtdml0ZVxcXFx2aXRlLmNvbmZpZy5tdHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2phbnhsL3dvcmtwbGFjZS9Ob2RlSlMvYm90LWZyb250ZW5kLXZpdGUvdml0ZS5jb25maWcubXRzXCI7Ly8vIDxyZWZlcmVuY2UgdHlwZXM9XCJ2aXRlc3RcIiAvPlxyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnO1xyXG5pbXBvcnQgQXV0b0ltcG9ydCBmcm9tICd1bnBsdWdpbi1hdXRvLWltcG9ydC92aXRlJztcclxuaW1wb3J0IENvbXBvbmVudHMgZnJvbSAndW5wbHVnaW4tdnVlLWNvbXBvbmVudHMvdml0ZSc7XHJcbmltcG9ydCB7IEVsZW1lbnRQbHVzUmVzb2x2ZXIgfSBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy9yZXNvbHZlcnMnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBNYW5pZmVzdE9wdGlvbnMsIFZpdGVQV0EsIFZpdGVQV0FPcHRpb25zIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcclxuaW1wb3J0IHJlcGxhY2UgZnJvbSAnQHJvbGx1cC9wbHVnaW4tcmVwbGFjZSc7XHJcbmltcG9ydCBWdWVJMThuIGZyb20gJ0BpbnRsaWZ5L3VucGx1Z2luLXZ1ZS1pMThuL3ZpdGUnO1xyXG5pbXBvcnQgVW5vY3NzIGZyb20gJ3Vub2Nzcy92aXRlJztcclxuaW1wb3J0IFZ1ZURldlRvb2xzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1kZXZ0b29scyc7XHJcblxyXG5jb25zdCBwd2FPcHRpb25zOiBQYXJ0aWFsPFZpdGVQV0FPcHRpb25zPiA9IHtcclxuICAgIG1vZGU6ICdkZXZlbG9wbWVudCcsXHJcbiAgICBiYXNlOiAnLycsXHJcbiAgICBpbmNsdWRlQXNzZXRzOiBbJ2Zhdmljb24uc3ZnJ10sXHJcbiAgICBtYW5pZmVzdDoge1xyXG4gICAgICAgIG5hbWU6ICdQV0EgUm91dGVyJyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnUFdBIFJvdXRlcicsXHJcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjZmZmZmZmJyxcclxuICAgICAgICBpY29uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzcmM6ICdwd2EtMTkyeDE5Mi5wbmcnLCAvLyA8PT0gZG9uJ3QgYWRkIHNsYXNoLCBmb3IgdGVzdGluZ1xyXG4gICAgICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzcmM6ICcvcHdhLTUxMng1MTIucG5nJywgLy8gPD09IGRvbid0IHJlbW92ZSBzbGFzaCwgZm9yIHRlc3RpbmdcclxuICAgICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc3JjOiAncHdhLTUxMng1MTIucG5nJywgLy8gPD09IGRvbid0IGFkZCBzbGFzaCwgZm9yIHRlc3RpbmdcclxuICAgICAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICB9LFxyXG4gICAgZGV2T3B0aW9uczoge1xyXG4gICAgICAgIGVuYWJsZWQ6IHByb2Nlc3MuZW52LlNXX0RFViA9PT0gJ3RydWUnLFxyXG4gICAgICAgIC8qIHdoZW4gdXNpbmcgZ2VuZXJhdGVTVyB0aGUgUFdBIHBsdWdpbiB3aWxsIHN3aXRjaCB0byBjbGFzc2ljICovXHJcbiAgICAgICAgdHlwZTogJ21vZHVsZScsXHJcbiAgICAgICAgbmF2aWdhdGVGYWxsYmFjazogJ2luZGV4Lmh0bWwnLFxyXG4gICAgfSxcclxufTtcclxuXHJcbmNvbnN0IGNsYWltcyA9IHByb2Nlc3MuZW52LkNMQUlNUyA9PT0gJ3RydWUnO1xyXG5jb25zdCByZWxvYWQgPSBwcm9jZXNzLmVudi5SRUxPQURfU1cgPT09ICd0cnVlJztcclxuXHJcbmlmIChwcm9jZXNzLmVudi5TVyA9PT0gJ3RydWUnKSB7XHJcbiAgICBwd2FPcHRpb25zLnNyY0RpciA9ICdzcmMnO1xyXG4gICAgcHdhT3B0aW9ucy5maWxlbmFtZSA9IGNsYWltcyA/ICdjbGFpbXMtc3cudHMnIDogJ3Byb21wdC1zdy50cyc7XHJcbiAgICBwd2FPcHRpb25zLnN0cmF0ZWdpZXMgPSAnaW5qZWN0TWFuaWZlc3QnO1xyXG4gICAgKHB3YU9wdGlvbnMubWFuaWZlc3QgYXMgUGFydGlhbDxNYW5pZmVzdE9wdGlvbnM+KS5uYW1lID1cclxuICAgICAgICAnUFdBIEluamVjdCBNYW5pZmVzdCc7XHJcbiAgICAocHdhT3B0aW9ucy5tYW5pZmVzdCBhcyBQYXJ0aWFsPE1hbmlmZXN0T3B0aW9ucz4pLnNob3J0X25hbWUgPSAnUFdBIEluamVjdCc7XHJcbn1cclxuXHJcbmlmIChjbGFpbXMpIHB3YU9wdGlvbnMucmVnaXN0ZXJUeXBlID0gJ2F1dG9VcGRhdGUnO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IGNvbW1hbmQgfSkgPT4ge1xyXG4gIC8vIFx1NTIyNFx1NjVBRFx1NjYyRlx1NTQyNlx1NEUzQVx1NzUxRlx1NEVBN1x1NzNBRlx1NTg4M1x1Njc4NFx1NUVGQVxyXG4gIGNvbnN0IGlzUHJvZCA9IGNvbW1hbmQgPT09ICdidWlsZCc7XHJcbiAgXHJcbiAgcmV0dXJuIHtcclxuICAgIC8vIFx1NjgzOVx1NjM2RVx1NzNBRlx1NTg4M1x1NTJBOFx1NjAwMVx1OEJCRVx1N0Y2RVx1NTdGQVx1Nzg0MFx1OERFRlx1NUY4NFxyXG4gICAgYmFzZTogaXNQcm9kID8gJ2h0dHBzOi8vbXlib3gtMTI1NzI1MTMxNC5jb3MuYXAtY2hlbmdkdS5teXFjbG91ZC5jb20vd3d3L3Rlc3QvYm90LycgOiAnLycsXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgYWxpYXM6IHtcclxuICAgICAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyksXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICAgIHRhcmdldDogJ2VzMjAxNScsXHJcbiAgICAgICAgY3NzVGFyZ2V0OiAnY2hyb21lODAnLFxyXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICAgICAgICAvLyBcdTUxNjVcdTUzRTNcdTY1ODdcdTRFRjZcdTU0MERcdUZGMDhcdTRFMERcdTgwRkRcdTUzRDhcdUZGMENcdTU0MjZcdTUyMTlcdTYyNDBcdTY3MDlcdTYyNTNcdTUzMDVcdTc2ODQganMgaGFzaCBcdTUwM0NcdTUxNjhcdTUzRDhcdTRFODZcdUZGMDlcclxuICAgICAgICAgICAgICAgIGVudHJ5RmlsZU5hbWVzOiAnaW5kZXguanMnLFxyXG4gICAgICAgICAgICAgICAgLy8gXHU5MTREXHU3RjZFQ0ROXHU4REVGXHU1Rjg0XHU1MjREXHU3RjAwXHJcbiAgICAgICAgICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGluZm8gPSBhc3NldEluZm8ubmFtZS5zcGxpdCgnLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBleHRUeXBlID0gaW5mb1tpbmZvLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgvXFwuKG1wNHx3ZWJtfG9nZ3xtcDN8d2F2fGZsYWN8YWFjKShcXD8uKik/JC9pLnRlc3QoYXNzZXRJbmZvLm5hbWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dFR5cGUgPSAnbWVkaWEnO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoL1xcLihwbmd8anBlP2d8Z2lmfHN2Z3xpY298d2VicCkoXFw/LiopPyQvaS50ZXN0KGFzc2V0SW5mby5uYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRUeXBlID0gJ2ltZyc7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgvXFwuKHdvZmYyP3xlb3R8dHRmfG90ZikoXFw/LiopPyQvaS50ZXN0KGFzc2V0SW5mby5uYW1lKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRUeXBlID0gJ2ZvbnRzJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGAke2V4dFR5cGV9L1tuYW1lXS1baGFzaF1bZXh0bmFtZV1gO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnanMvW25hbWVdLVtoYXNoXS5qcycsXHJcbiAgICAgICAgICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICAgICAgICAgICB2dWU6IFsndnVlJywgJ3BpbmlhJywgJ3Z1ZS1yb3V0ZXInXSxcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50cGx1czogWydlbGVtZW50LXBsdXMnLCAnQGVsZW1lbnQtcGx1cy9pY29ucy12dWUnXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBjc3M6IHtcclxuICAgICAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XHJcbiAgICAgICAgICAgIHNjc3M6IHtcclxuICAgICAgICAgICAgICAgIGFkZGl0aW9uYWxEYXRhOiBgQHVzZSBcIkAvYXNzZXRzL3N0eWxlcy9lbGVtZW50L2luZGV4LnNjc3NcIiBhcyAqO2AsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgICAgdnVlKCksXHJcbiAgICAgICAgQXV0b0ltcG9ydCh7XHJcbiAgICAgICAgICAgIGltcG9ydHM6IFtcclxuICAgICAgICAgICAgICAgICd2dWUnLFxyXG4gICAgICAgICAgICAgICAgJ3Z1ZS1yb3V0ZXInLFxyXG4gICAgICAgICAgICAgICAgJ3Z1ZS1pMThuJyxcclxuICAgICAgICAgICAgICAgICd2dWUvbWFjcm9zJyxcclxuICAgICAgICAgICAgICAgICdAdnVldXNlL2hlYWQnLFxyXG4gICAgICAgICAgICAgICAgJ0B2dWV1c2UvY29yZScsXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXHJcbiAgICAgICAgICAgIGR0czogJ2F1dG8taW1wb3J0cy5kLnRzJyxcclxuICAgICAgICAgICAgdnVlVGVtcGxhdGU6IHRydWUsXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgQ29tcG9uZW50cyh7XHJcbiAgICAgICAgICAgIGR0czogJ2NvbXBvbmVudHMuZC50cycsXHJcbiAgICAgICAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hbnRmdS91bm9jc3NcclxuICAgICAgICAvLyBzZWUgdW5vY3NzLmNvbmZpZy50cyBmb3IgY29uZmlnXHJcbiAgICAgICAgVW5vY3NzKCksXHJcblxyXG4gICAgICAgIFZpdGVQV0EocHdhT3B0aW9ucyksXHJcblxyXG4gICAgICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9pbnRsaWZ5L2J1bmRsZS10b29scy90cmVlL21haW4vcGFja2FnZXMvdW5wbHVnaW4tdnVlLWkxOG5cclxuICAgICAgICBWdWVJMThuKHtcclxuICAgICAgICAgICAgcnVudGltZU9ubHk6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbXBvc2l0aW9uT25seTogdHJ1ZSxcclxuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtY29tbWVudCAqL1xyXG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHN0cmljdE1lc3NhZ2U6IGZhbHNlLFxyXG4gICAgICAgICAgICBmdWxsSW5zdGFsbDogdHJ1ZSxcclxuICAgICAgICAgICAgLy8gZG8gbm90IHN1cHBvcnQgdHMgZXh0ZW5zaW9uXHJcbiAgICAgICAgICAgIGluY2x1ZGU6IFtwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnbG9jYWxlcy8qLnt5YW1sLHltbCxqc29ufScpXSxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgcmVwbGFjZSh7XHJcbiAgICAgICAgICAgIHByZXZlbnRBc3NpZ25tZW50OiB0cnVlLFxyXG4gICAgICAgICAgICBfX0RBVEVfXzogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxyXG4gICAgICAgICAgICBfX1JFTE9BRF9TV19fOiByZWxvYWQgPyAndHJ1ZScgOiAnJyxcclxuICAgICAgICB9KSxcclxuXHJcbiAgICAgICAgVnVlRGV2VG9vbHMoKSxcclxuICAgIF0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgICBwb3J0OiA5MDAwLFxyXG4gICAgICAgIGhvc3Q6ICcxMjcuMC4wLjEnLFxyXG4gICAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgICAgICcvYXBpJzoge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiAnaHR0cDovLzE3Mi4yMC40Ny4xOTA6MTgwODAnLFxyXG4gICAgICAgICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSxcclxuICAgICAgICAgICAgfSwgXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vdml0ZXN0LWRldi92aXRlc3RcclxuICAgIHRlc3Q6IHtcclxuICAgICAgICBpbmNsdWRlOiBbJ3NyYy90ZXN0cy8qKi8qLnRlc3QudHMnXSxcclxuICAgICAgICBlbnZpcm9ubWVudDogJ2pzZG9tJyxcclxuICAgICAgICBzZXJ2ZXI6IHtcclxuICAgICAgICAgICAgZGVwczoge1xyXG4gICAgICAgICAgICAgICAgaW5saW5lOiBbJ0B2dWUnLCAnQHZ1ZXVzZScsICdlbGVtZW50LXBsdXMnLCAncGluaWEnXSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxufX0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sZ0JBQWdCO0FBQ3ZCLE9BQU8sZ0JBQWdCO0FBQ3ZCLFNBQVMsMkJBQTJCO0FBQ3BDLFlBQVksVUFBVTtBQUN0QixTQUEwQixlQUErQjtBQUN6RCxPQUFPLGFBQWE7QUFDcEIsT0FBTyxhQUFhO0FBQ3BCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGlCQUFpQjtBQVh4QixJQUFNLG1DQUFtQztBQWF6QyxJQUFNLGFB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
