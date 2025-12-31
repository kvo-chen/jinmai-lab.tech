import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import path from 'path'

function getPlugins() {
  const plugins = [
    react(), 
    tsconfigPaths(),
    ViteImageOptimizer({
      // 启用WebP和AVIF格式转换
      png: {
        quality: 80,
        compressionLevel: 9,
        force: true
      },
      jpeg: {
        quality: 80,
        force: true
      },
      webp: {
        quality: 85,
        force: true
      },
      avif: {
        quality: 75,
        force: true
      },
      // 启用响应式图片生成
      generateResponsiveImages: true,
      // 响应式图片尺寸配置
      responsive: {
        adapter: {
          name: 'sharp',
          options: {
            sizes: [320, 640, 1024, 1600, 2048],
            format: ['webp', 'avif'],
            quality: [85, 75]
          }
        }
      },
      // 输出路径配置
      svg: {
        quality: 85,
        force: true
      },
      gif: {
        quality: 85,
        force: true
      },
      // 仅在构建时优化
      disable: process.env.NODE_ENV === 'development',
      // 仅优化src目录下的图片
      include: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
      // 排除node_modules目录
      exclude: /node_modules/
    }),
    // 简化PWA配置，解决构建失败问题
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*'],
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
          }
        ]
      },
      workbox: {
        // 简化workbox配置，只保留必要选项
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,gif,woff2,ttf}'],
        navigateFallback: '/index.html',
        skipWaiting: true,
        clientsClaim: true,
        globIgnores: ['**/*.map', '**/node_modules/**']
      }
    })
  ];
  return plugins;
}

export default defineConfig({
  base: '/',
  plugins: [
    react(), 
    tsconfigPaths(),
    ViteImageOptimizer({
      // 启用WebP和AVIF格式转换
      png: {
        quality: 80,
        compressionLevel: 9,
        force: true
      },
      jpeg: {
        quality: 80,
        force: true
      },
      webp: {
        quality: 85,
        force: true
      },
      avif: {
        quality: 75,
        force: true
      },
      // 启用响应式图片生成
      generateResponsiveImages: true,
      // 响应式图片尺寸配置
      responsive: {
        adapter: {
          name: 'sharp',
          options: {
            sizes: [320, 640, 1024, 1600, 2048],
            format: ['webp', 'avif'],
            quality: [85, 75]
          }
        }
      },
      svg: {
        quality: 85,
        force: true
      },
      gif: {
        quality: 85,
        force: true
      },
      // 仅在构建时优化
      disable: process.env.NODE_ENV === 'development',
      // 仅优化src目录下的图片
      include: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
      // 排除node_modules目录
      exclude: /node_modules/
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'assets/*.svg', 'assets/*.woff2', 'icons/*', 'images/*'],
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
        // 添加skipWaiting和clientsClaim选项
        skipWaiting: true,
        clientsClaim: true,
        // 忽略带有no-store头的请求
        globIgnores: ['**/*.map', '**/node_modules/**'],
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
              },
              // 跳过带有no-store头的请求
              matchOptions: {
                ignoreSearch: true,
                ignoreVary: true
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
  ],
  resolve: {
    // 为数据库相关的 Node.js 原生模块创建别名，避免在浏览器环境中打包
    alias: {
      '@': path.resolve(__dirname, './src'),
      'better-sqlite3': '@/utils/databaseStub',
      'mongodb': '@/utils/databaseStub',
      'pg': '@/utils/databaseStub',
      '@neondatabase/serverless': '@/utils/databaseStub',
      'ws': '@/utils/databaseStub',
      'react-reconciler/constants': '@/utils/reactReconcilerStub',
      'react-reconciler': '@/utils/reactReconcilerStub',
    }
  },
  build: {
    // 优化构建输出
    minify: 'terser', // 使用terser进行更高级的压缩
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
        pure_funcs: ['console.debug', 'console.info'], // 移除特定console方法
        passes: 2 // 执行多次压缩
      },
      mangle: {
        toplevel: true, // 顶级变量名混淆
        keep_classnames: false,
        keep_fnames: false
      }
    },
    // 启用更高效的压缩算法
    brotliSize: true, // 启用brotli压缩
    // 优化 CSS 构建
    cssMinify: 'esbuild', // 使用esbuild压缩CSS，确保构建成功
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 生成 sourcemap（生产环境可关闭）
    sourcemap: false,
    // 设置 chunk 大小警告阈值（单位：KB）
    chunkSizeWarningLimit: 800, // 降低警告阈值，确保chunk大小合理
    // 启用资产预加载
    preloadAssets: true, // 启用预加载，优化加载性能
    // 生成构建报告
    reportCompressedSize: true, // 启用构建报告，便于分析
    // 调整资产内联限制，减少内联资源数量
    assetsInlineLimit: 4096, // 内联小于4KB的资源
    // 禁用动态导入 polyfill，减少不必要的代码
    modulePreload: {
      polyfill: false
    },
    // 启用更严格的 tree-shaking
    ssr: false,
    // 优化构建目标，使用更现代的ES版本
    target: 'es2022',
    // 分割代码
    rollupOptions: {
      // 启用更严格的tree-shaking
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        correctVarValueBeforeDeclaration: true
      },
      // 外部化 Node.js 原生模块和不兼容的依赖，避免打包到浏览器代码中
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
        // 优化chunk大小
        experimentalMinChunkSize: 5000, // 减小最小chunk大小，增加代码分割粒度
        // 启用动态导入支持
        dynamicImportInCjs: true,
        // 优化代码分割策略
        manualChunks(id) {
          // 第三方库优化分割
          if (id.includes('node_modules')) {
            // React核心库 - 合并为一个chunk
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            
            // Three.js相关库 - 合并为一个chunk
            if (id.includes('three') || id.includes('@react-three')) {
              return 'three-core';
            }
            
            // 动画库
            if (id.includes('framer-motion')) {
              return 'animation-framer';
            }
            
            // 图表库
            if (id.includes('recharts')) {
              return 'charts-recharts';
            }
            
            // UI库
            if (id.includes('sonner')) {
              return 'ui-sonner';
            }
            
            // 手势识别库
            if (id.includes('@mediapipe') || id.includes('@tensorflow')) {
              return 'gesture-ml';
            }
            
            // 图标库
            if (id.includes('@fortawesome')) {
              return 'icons-fontawesome';
            }
            
            // 国际化库
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n';
            }
            
            // 状态管理库
            if (id.includes('zustand')) {
              return 'state-zustand';
            }
            
            // 其他第三方库合并为一个chunk
            return 'vendor-other';
          }
          
          // 按页面功能模块分割代码
          if (id.includes('src/pages/')) {
            if (id.includes('Admin') || id.includes('admin')) {
              return 'pages-admin';
            }
            if (id.includes('Create') || id.includes('create')) {
              return 'pages-create';
            }
            if (id.includes('Explore') || id.includes('explore')) {
              return 'pages-explore';
            }
            if (id.includes('Community') || id.includes('community')) {
              return 'pages-community';
            }
            if (id.includes('Dashboard') || id.includes('dashboard')) {
              return 'pages-dashboard';
            }
            if (id.includes('Cultural') || id.includes('cultural')) {
              return 'pages-cultural';
            }
            if (id.includes('Lab') || id.includes('lab')) {
              return 'pages-experimental';
            }
            if (id.includes('Test') || id.includes('test')) {
              return 'pages-test';
            }
            if (id.includes('Membership') || id.includes('membership')) {
              return 'pages-membership';
            }
            return 'pages-other';
          }
          
          // 按组件功能模块分割代码
          if (id.includes('src/components/')) {
            if (id.includes('VirtualMap')) {
              return 'components-virtual-map';
            }
            if (id.includes('AR')) {
              return 'components-ar';
            }
            if (id.includes('Game') || id.includes('game')) {
              return 'components-game';
            }
            if (id.includes('Admin')) {
              return 'components-admin';
            }
            if (id.includes('Analytics')) {
              return 'components-analytics';
            }
            if (id.includes('Community')) {
              return 'components-community';
            }
            if (id.includes('Creator') || id.includes('creator')) {
              return 'components-core';
            }
            if (id.includes('PWA') || id.includes('pwa')) {
              return 'components-auxiliary';
            }
            if (id.includes('Floating') || id.includes('floating')) {
              return 'components-ui';
            }
            if (id.includes('UserFeedback') || id.includes('feedback')) {
              return 'components-auxiliary';
            }
            if (id.includes('FirstLaunchGuide')) {
              return 'components-auxiliary';
            }
            if (id.includes('LazyImage') || id.includes('OptimizedImage')) {
              return 'components-media';
            }
            if (id.includes('Skeleton')) {
              return 'components-ui';
            }
            if (id.includes('MobileLayout') || id.includes('SidebarLayout')) {
              return 'components-layout';
            }
            return 'components-other';
          }
        },
      },
      // 优化插件配置
      plugins: [
        // 只在ANALYZE模式下启用构建分析插件
        process.env.ANALYZE === 'true' && visualizer({
          filename: 'bundle-visualizer.html',
          open: true,
          gzipSize: true,
          template: 'sunburst', // 更直观的可视化模板
          sourcemap: false,
        }),
      ].filter(Boolean) as any[]
    },
  },
  // 优化开发体验和构建速度
  optimizeDeps: {
    // 预构建依赖 - 只包含核心依赖，减少预构建时间
    include: [
      'react', 'react-dom', 'react-router-dom', 
      'clsx', 'tailwind-merge', 
      'framer-motion'
    ],
    // 禁用预构建的依赖，包括数据库依赖和可能存在兼容性问题的库
    exclude: [
      'better-sqlite3', 'mongodb', 'pg', '@neondatabase/serverless',
      '@mediapipe/hands', '@tensorflow/tfjs-core', '@tensorflow/tfjs-backend-webgl',
      'three', '@react-three/fiber', '@react-three/drei' // Three.js相关库不预构建
    ],
    // 优化依赖构建，增加并发数
    esbuildOptions: {
      target: 'es2022', // 使用更现代的ES版本
      // 优化大型依赖的构建
      treeShaking: true,
      // 优化 esbuild 配置
      minify: false, // 禁用预构建时的压缩，加快预构建速度
      minifySyntax: false,
      minifyIdentifiers: false,
      minifyWhitespace: false,
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
    // 自动打开浏览器
    open: true,
    // 优化热更新
    hmr: {
      timeout: 3000,
      overlay: true,
      // 确保HMR连接正常，允许Trae IDE自动刷新
      clientPort: 3000,
      // 强制使用WebSocket连接，确保IDE能正确接收更新
      protocol: 'ws',
      // 禁用客户端自动重连，让IDE处理连接
      reconnect: true,
      // 启用完整重载作为后备选项
      fullReload: true,
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
    // 确保预览服务器也使用相同的resolve配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'better-sqlite3': '@/utils/databaseStub',
        'mongodb': '@/utils/databaseStub',
        'pg': '@/utils/databaseStub',
        '@neondatabase/serverless': '@/utils/databaseStub',
        'ws': '@/utils/databaseStub',
        'react-reconciler/constants': '@/utils/reactReconcilerStub',
        'react-reconciler': '@/utils/reactReconcilerStub',
      }
    }
  },
});
