import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from 'rollup-plugin-visualizer';

function getPlugins() {
  const plugins = [
    react(), 
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.svg', 'fonts/*.ttf', 'fonts/*.woff2', 'images/*.png', 'images/*.jpg'],
      manifest: {
        name: '津脉智坊 - 津门老字号共创平台',
        short_name: '津脉智坊',
        description: '津门老字号共创平台，传承与创新的桥梁',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icons/icon-180x180.svg',
            sizes: '180x180',
            type: 'image/svg+xml',
            purpose: 'apple touch icon'
          }
        ]
      },
      workbox: {
        // 增加最大缓存文件大小限制到8MB，解决大型文件无法缓存的问题
        maximumFileSizeToCacheInBytes: 8000000,
        // 预缓存所有生成的资源
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,gif,woff2,ttf}'],
        // 预缓存资源的缓存策略
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          // API请求缓存 - 使用NetworkFirst策略
          {
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // 字体资源缓存 - 长期缓存
          {
            urlPattern: /^https?:\/\/.*\.(woff2|woff|ttf|otf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // 图片资源缓存 - 增加缓存条目数量
          {
            urlPattern: /^https?:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|avif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100, // 增加到100个条目
                maxAgeSeconds: 60 * 60 * 24 * 60 // 60 days
              },
              rangeRequests: true // 支持范围请求，优化大图片加载
            }
          },
          // CSS和JS资源缓存 - 调整缓存策略
          {
            urlPattern: /^https?:\/\/.*\.(js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 50, // 增加到50个条目
                maxAgeSeconds: 60 * 60 * 24 * 14 // 14 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // CDN资源缓存
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          // 视频资源缓存
          {
            urlPattern: /^https?:\/\/.*\.(mp4|webm|ogg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'video-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              rangeRequests: true // 支持范围请求
            }
          }
        ]
      }
    })
  ];
  return plugins;
}

export default defineConfig({
  base: '/',
  plugins: getPlugins(),
  resolve: {
    // 为数据库相关的 Node.js 原生模块创建别名，避免在浏览器环境中打包
    alias: {
      'better-sqlite3': '@/utils/databaseStub',
      'mongodb': '@/utils/databaseStub',
      'pg': '@/utils/databaseStub',
      '@neondatabase/serverless': '@/utils/databaseStub',
    }
  },
  build: {
    // 优化构建输出
    minify: 'terser',
    // 启用更高效的压缩算法
    brotliSize: true,
    // 优化 CSS 构建
    cssMinify: 'csso', // 使用更高效的CSS压缩
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 生成 sourcemap（生产环境可关闭）
    sourcemap: false,
    // 设置 chunk 大小警告阈值（单位：KB）
    chunkSizeWarningLimit: 100, // 调整为更合理的阈值，减少不必要的警告
    // 启用资产预加载
    preloadAssets: true,
    // 生成构建报告
    reportCompressedSize: true,
    // 调整资产内联限制，进一步减少HTTP请求
    assetsInlineLimit: 4096, // 4KB以下的资源内联
    // 禁用动态导入 polyfill，减少不必要的代码
    modulePreload: {
      polyfill: false
    },
    // 启用更严格的 tree-shaking
    ssr: false,
    // 优化构建目标，使用更现代的ES版本
    target: 'es2022',
    // 优化 terser 配置，进一步压缩代码
    terserOptions: {
      compress: {
        drop_console: true, // 始终移除控制台日志
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.error', 'console.debug', 'console.info', 'console.trace', 'console.dir', 'console.table'],
        pure_getters: true,
        passes: 6, // 增加压缩次数
        // 更激进的压缩选项
        collapse_vars: true,
        reduce_vars: true,
        dead_code: true,
        conditionals: true,
        booleans: true,
        unused: true,
        if_return: true,
        join_vars: true,
        side_effects: true,
        evaluate: true,
        unsafe: true,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_symbols: true,
        unsafe_undefined: true,
        keep_classnames: false,
        keep_fargs: false,
        keep_fnames: false,
        keep_infinity: false,
        // 新增压缩选项
        sequences: true,
        properties: true,
        comparisons: true,
        computed_props: true,
        arrows: true,
        loops: true,
        toplevel: true,
        ie8: false
      },
      mangle: {
        toplevel: true,
        keep_classnames: false,
        keep_fnames: false,
        properties: {
          regex: /^_/, // 只混淆下划线开头的私有属性
          keep_quoted: false,
          reserved: [],
        },
      },
      format: {
        comments: false,
        beautify: false,
        // 优化输出格式
        ecma: 2022,
        wrap_func_args: false,
        wrap_iife: true,
        ascii_only: false,
        webkit: false,
        preamble: '',
        shebang: false,
        indent_level: 0,
        quote_style: 3,
        preserve_annotations: false
      },
    },
    // 分割代码
    rollupOptions: {
      // 启用更严格的tree-shaking
      treeshake: {
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        // 新增tree-shake选项
        correctVarValueBeforeDeclaration: true,
        moduleSideEffects: (id) => {
          // 排除需要保留副作用的模块
          return id.includes('@fortawesome') || id.includes('sonner') || id.includes('@vercel/analytics') || id.includes('@vercel/speed-insights');
        }
      },
      // 外部化 Node.js 原生模块，避免打包到浏览器代码中
      external: ['better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless', 'ws'],
      // 优化输入选项
      input: {
        main: 'index.html',
      },
      output: {
        // 优化资产输出
        assetFileNames: 'assets/[name]-[hash:8][extname]',
        chunkFileNames: 'chunks/[name]-[hash:8].js',
        entryFileNames: 'entries/[name]-[hash:8].js',
        // 启用代码分割，优化chunk大小
        experimentalMinChunkSize: 5000, // 最小chunk大小5KB，减少小chunk数量
        // 启用动态导入支持
        dynamicImportInCjs: true,
        // 优化代码分割策略
        manualChunks(id) {
          // 优先使用手动 chunk 配置，优化chunk数量
          const manualChunkNames = {
            // React核心库 - 合并为一个chunk
            'react': 'vendor-react',
            'react-dom/client': 'vendor-react',
            'react-dom': 'vendor-react',
            'react-router-dom': 'vendor-react',
            
            // 工具库 - 合并为一个chunk
            'clsx': 'utils-core',
            'tailwind-merge': 'utils-core',
            
            // 动画库
            'framer-motion': 'animation-framer',
            
            // Three.js相关库 - 合并为更少的chunk
            'three': 'three-core',
            'three/src/Three': 'three-core',
            'three/src/renderers': 'three-core',
            'three/src/scenes': 'three-core',
            'three/src/cameras': 'three-core',
            'three/src/objects': 'three-core',
            'three/src/geometries': 'three-core',
            'three/src/materials': 'three-core',
            'three/src/loaders': 'three-core',
            '@react-three/fiber': 'three-react',
            '@react-three/drei': 'three-react',
            
            // 图表库
            'recharts': 'charts-recharts',
            
            // UI库
            'sonner': 'ui-sonner',
            
            // 辅助库 - 合并为一个chunk
            'zod': 'helpers-core',
            'jsonwebtoken': 'helpers-core',
            'bcryptjs': 'helpers-core',
            
            // 手势识别库 - 合并为一个chunk
            '@mediapipe/hands': 'gesture-media-pipe',
            '@mediapipe/camera_utils': 'gesture-media-pipe',
            '@mediapipe/control_utils': 'gesture-media-pipe',
            '@mediapipe/drawing_utils': 'gesture-media-pipe',
            '@tensorflow/tfjs-core': 'gesture-tensorflow',
            '@tensorflow/tfjs-backend-webgl': 'gesture-tensorflow',
            '@tensorflow/tfjs': 'gesture-tensorflow',
          };
          
          // 精确匹配three.js相关依赖，确保正确分割
          if (id.includes('three') && !id.includes('@react-three')) {
            return 'three-core';
          }
          
          if (id.includes('@react-three')) {
            return 'three-react';
          }
          
          // 优先匹配精确的库名
          for (const [lib, chunkName] of Object.entries(manualChunkNames)) {
            if (id.includes(lib)) {
              return chunkName;
            }
          }
          
          // 自动分割大型node_modules依赖
          if (id.includes('node_modules') && !id.includes('.css')) {
            // 进一步细分vendor依赖
            if (id.includes('lodash')) {
              return 'utils-lodash';
            } else if (id.includes('date-fns')) {
              return 'utils-date-fns';
            } else if (id.includes('uuid')) {
              return 'utils-uuid';
            } else if (id.includes('axios')) {
              return 'network-axios';
            } else if (id.includes('@fortawesome')) {
              return 'icons-fontawesome';
            } else if (id.includes('@vercel/analytics')) {
              return 'analytics-vercel';
            } else if (id.includes('@vercel/speed-insights')) {
              return 'analytics-speed-insights';
            } else if (id.includes('react-window')) {
              return 'utils-react-window';
            } else if (id.includes('zustand')) {
              return 'state-zustand';
            }
            
            // 其他第三方库
            return 'vendor-other';
          }
          
          // 按页面分割代码 - 更细粒度的页面分割
          if (id.includes('src/pages/')) {
            // 精确到具体页面文件
            const pagePath = id.split('src/pages/')[1].replace('.tsx', '').replace('.ts', '');
            return `page-${pagePath}`;
          }
          
          // 按组件分割大型组件 - 扩展更多大型组件
          if (id.includes('src/components/') && id.includes('.tsx')) {
            const componentName = id.split('src/components/')[1].split('.')[0];
            // 分割更多大型组件
            const largeComponents = [
              'ARPreview', 'ThreeDPreview', 'ModelViewer', 'ErrorMonitoringDashboard',
              'AICollaborationPanel', 'AICreativeAssistant', 'CollaborationPanel',
              'CulturalKnowledgeBase', 'CulturalPuzzleGame', 'EventCalendar',
              'ParticleSystem', 'AdminRoute', 'PrivateRoute', 'MobileLayout',
              'SidebarLayout', 'UserProfile', 'CreatorDashboard', 'Leaderboard',
              'TianjinCreativeActivities', 'TianjinCulturalAssets', 'CulturalNews',
              'ChallengeCenter', 'IPIncubationCenter', 'GestureControl', 'LazyImage'
            ];
            
            if (largeComponents.includes(componentName)) {
              return `component-${componentName}`;
            }
          }
          
          // 服务层代码分割
          if (id.includes('src/services/')) {
            const serviceName = id.split('src/services/')[1].split('.')[0];
            return `service-${serviceName}`;
          }
          
          // 上下文层代码分割
          if (id.includes('src/contexts/')) {
            const contextName = id.split('src/contexts/')[1].split('.')[0];
            return `context-${contextName}`;
          }
          
          // 钩子层代码分割
          if (id.includes('src/hooks/')) {
            const hookName = id.split('src/hooks/')[1].split('.')[0];
            return `hook-${hookName}`;
          }
        },
      },
      // 优化插件配置
      plugins: [
        // 构建分析插件 - rollup-plugin-visualizer
        process.env.ANALYZE === 'true' && visualizer({
          filename: 'bundle-visualizer.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'sunburst', // 更直观的可视化模板
          sourcemap: false,
        }),
        // 自定义构建分析插件
        process.env.ANALYZE === 'true' && {
          name: 'build-analyzer',
          generateBundle(outputOptions, bundle) {
            const fs = require('fs');
            const path = require('path');
            const bundleStats = {
              totalSize: 0,
              chunks: [],
              assets: []
            };
            
            for (const [name, chunk] of Object.entries(bundle)) {
              if (chunk.type === 'chunk') {
                const size = chunk.code.length;
                bundleStats.totalSize += size;
                bundleStats.chunks.push({
                  name,
                  size,
                  sizeFormatted: formatBytes(size),
                  modules: chunk.modules ? Object.keys(chunk.modules).length : 0
                });
              } else if (chunk.type === 'asset') {
                const size = chunk.source.length;
                bundleStats.totalSize += size;
                bundleStats.assets.push({
                  name,
                  size,
                  sizeFormatted: formatBytes(size)
                });
              }
            }
            
            bundleStats.chunks.sort((a, b) => b.size - a.size);
            bundleStats.assets.sort((a, b) => b.size - a.size);
            
            const outputPath = path.resolve(process.cwd(), 'bundle-stats.json');
            fs.writeFileSync(outputPath, JSON.stringify(bundleStats, null, 2));
            
            console.log('\n=== Bundle Analysis ===');
            console.log(`Total size: ${formatBytes(bundleStats.totalSize)}`);
            console.log('\nTop 10 chunks:');
            bundleStats.chunks.slice(0, 10).forEach((chunk, index) => {
              console.log(`${index + 1}. ${chunk.name}: ${chunk.sizeFormatted} (${chunk.modules} modules)`);
            });
            console.log('\nTop 10 assets:');
            bundleStats.assets.slice(0, 10).forEach((asset, index) => {
              console.log(`${index + 1}. ${asset.name}: ${asset.sizeFormatted}`);
            });
            console.log('\nFull stats saved to bundle-stats.json');
            console.log('Visualizer report generated at bundle-visualizer.html');
            console.log('======================\n');
          }
        },
        // 优化CSS输出
        {
          name: 'css-optimizer',
          transform(code, id) {
            // 优化CSS导入，移除重复导入
            if (id.endsWith('.css')) {
              // 简单的CSS去重（实际项目中可能需要更复杂的处理）
              return { code, map: null };
            }
            return null;
          },
        },
      ].filter(Boolean)
    },
  },
  // 优化开发体验
  optimizeDeps: {
    // 预构建依赖 - 添加react和react-dom确保正确处理
    include: [
      'react', 'react-dom', 'react-router-dom', 
      'clsx', 'tailwind-merge', 
      'framer-motion',
      '@react-three/fiber', '@react-three/drei'
    ],
    // 禁用预构建的依赖，包括数据库依赖和可能存在兼容性问题的XR库
    exclude: [
      'better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless',
      '@mediapipe/hands', '@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl'
    ],
    // 优化依赖构建
    esbuildOptions: {
      target: 'es2020',
      // 优化大型依赖的构建
      treeShaking: true,
      // 优化 esbuild 配置
      minify: true,
      minifySyntax: true,
      minifyIdentifiers: true,
      minifyWhitespace: true,
      // 启用更严格的 tree-shaking
      pure: process.env.NODE_ENV === 'production' ? ['console.log', 'console.warn', 'console.error'] : [],
    },
  },
  // 开发服务器配置
  server: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3000
    port: 3000,
    // 优化热更新
    hmr: {
      timeout: 3000,
      overlay: true,
    },
    // 添加开发服务器代理配置
    proxy: {
      '/api/proxy/trae-api': {
        target: 'https://trae-api-sg.mchost.guru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/trae-api/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/proxy/unsplash': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/unsplash/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
    },
  },
  // 预览服务器配置
  preview: {
    // 启用 gzip 压缩
    compress: true,
    // 设置端口为3000
    port: 3000,
    // 添加预览服务器代理配置
    proxy: {
      '/api/proxy/trae-api': {
        target: 'https://trae-api-sg.mchost.guru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/trae-api/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
      '/api/proxy/unsplash': {
        target: 'https://images.unsplash.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/proxy\/unsplash/, ''),
        configure: (proxy, options) => {
          // 允许所有响应头通过
          options.onProxyRes = (proxyRes, req, res) => {
            // 确保响应头被正确设置，特别是对于图片请求
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
          };
        },
      },
    },
  },
});

// 辅助函数：格式化字节大小
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
