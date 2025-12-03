import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

function getPlugins() {
  const plugins = [react(), tsconfigPaths()];
  return plugins;
}

export default defineConfig({
  plugins: getPlugins(),
  build: {
    // 优化构建输出
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 分割代码
    rollupOptions: {
      output: {
        manualChunks: {
          // 将第三方库打包到单独的 chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // 将工具库打包到单独的 chunk
          utils: ['clsx', 'tailwind-merge'],
          // 将动画库打包到单独的 chunk
          animation: ['framer-motion'],
          // 将3D相关库打包到单独的 chunk
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          // 将图表库打包到单独的 chunk
          charts: ['recharts'],
          // 将数据库相关库打包到单独的 chunk
          db: ['@neondatabase/serverless', 'mongodb', 'pg', 'better-sqlite3'],
          // 将UI组件库打包到单独的 chunk
          ui: ['sonner'],
          // 将工具函数库打包到单独的 chunk
          helpers: ['zod', 'jsonwebtoken', 'bcryptjs'],
          // 移除直接引用页面组件的配置，改为让 Rollup 自动分割
          // 我们将通过其他方式优化大型组件
        },
      },
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true,
    // 生成 sourcemap（生产环境可关闭）
    sourcemap: false,
    // 设置 chunk 大小警告阈值（单位：KB）
    chunkSizeWarningLimit: 200,
  },
  // 优化开发体验
  optimizeDeps: {
    // 预构建依赖
    include: ['react', 'react-dom', 'react-router-dom', 'clsx', 'tailwind-merge'],
    // 禁用预构建的依赖
    exclude: [],
  },
});
