## 修复天津特色专区重复UI问题

### 问题分析
通过查看代码和截图，我发现天津特色专区页面出现了重复的"天津特色专区"标题。具体原因是：

1. 在 `Tianjin.tsx` 文件中，第26-29行包含了一个硬编码的页面标题：
   ```jsx
   {/* 页面标题 */}
   <div className={`container mx-auto px-4 py-6 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
     <h1 className="text-2xl font-bold">天津特色专区</h1>
   </div>
   ```

2. 同时，在 `SidebarLayout.tsx` 文件中，第442行显示了一个基于路由的动态标题：
   ```jsx
   <h2 className="text-lg font-bold">{title}</h2>
   ```
   当路径为 `/tianjin` 时，`title` 变量会被设置为"天津特色专区"。

### 解决方案
删除 `Tianjin.tsx` 文件中硬编码的重复标题部分（第26-29行），只保留 `SidebarLayout` 提供的动态标题。

### 修复步骤
1. 打开 `Tianjin.tsx` 文件
2. 删除第26-29行的重复标题代码
3. 保存文件并检查效果

### 预期效果
修复后，页面上只会显示 `SidebarLayout` 提供的"天津特色专区"标题，符合图2的设计，不再出现重复UI元素。