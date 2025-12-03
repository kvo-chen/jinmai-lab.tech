# 修复ARPreview组件Canvas元素错误

## 1. 问题分析

- **错误信息**：`R3F: P is not part of the THREE namespace! Did you forget to extend?`
- **错误原因**：在React Three Fiber的Canvas组件内部使用了普通HTML元素
- **具体问题**：
  1. `LoadingProgress`组件直接在Canvas内部渲染HTML元素
  2. AR模式下的提示按钮直接放置在Canvas内部
  3. Canvas内部只能包含Three.js相关元素，不能包含普通HTML元素

## 2. 修复方案

### 2.1 将LoadingProgress组件移到Canvas外部
- 将LoadingProgress组件从Canvas内部移除
- 作为普通React组件渲染在AR预览区域
- 使用绝对定位覆盖在Canvas上方

### 2.2 将AR模式提示按钮移到Canvas外部
- 将AR模式下的提示按钮从Canvas内部移除
- 作为普通React组件渲染在AR预览区域
- 使用绝对定位放置在Canvas上方

### 2.3 确保Canvas内部只包含Three.js元素
- 检查Canvas内部所有元素，确保它们都是Three.js相关元素
- 移除所有普通HTML元素
- 确保所有组件都是React Three Fiber或Three.js相关组件

## 3. 实现步骤

1. 将`LoadingProgress`组件移到Canvas外部，使用绝对定位覆盖在Canvas上方
2. 将AR模式提示按钮移到Canvas外部，使用绝对定位放置在Canvas上方
3. 调整组件结构，确保Canvas内部只包含Three.js相关元素
4. 测试修复后的组件，确保错误不再出现
5. 运行类型检查，确保代码符合TypeScript规范

## 4. 预期效果

- 修复React Three Fiber错误，确保ARPreview组件能够正常渲染
- 保持原有功能不变，包括加载进度显示和AR模式提示
- 提升组件的性能和稳定性
- 确保代码符合React Three Fiber的使用规范

这个修复计划将解决当前ARPreview组件的Canvas元素错误，确保组件能够正常渲染和运行。