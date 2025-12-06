# AR加载优化方案

## 问题分析

通过分析代码，我发现AR加载不出来的主要原因包括：

1. **TextureLoader加载完成后没有触发重渲染**：在`ImagePreview`组件中，`TextureLoader`加载完成后只是更新了`textureRef.current`，但没有触发组件重渲染，导致纹理没有显示出来。

2. **加载状态管理不完善**：ARPreview组件的`isLoading`状态设置为true，但实际资源加载完成后没有正确更新状态，尤其是在TextureLoader异步加载完成后。

3. **缺乏资源加载错误处理**：没有处理TextureLoader加载失败的情况，导致加载异常时没有反馈。

4. **缺少加载超时机制**：如果资源加载超时，用户会一直看到加载状态，影响用户体验。

5. **环境预设可能存在问题**：Environment组件的preset设置可能存在问题，导致3D场景渲染失败。

## 优化方案

### 1. 修复TextureLoader加载完成后的重渲染问题

在`ImagePreview`组件中，将`textureRef`替换为`useState`，确保纹理加载完成后触发组件重渲染：

```typescript
// 将textureRef替换为useState
const [texture, setTexture] = useState<THREE.Texture | null>(null);

// 在useEffect中
loader.load(url, (texture: THREE.Texture) => {
  setTexture(texture); // 使用setState触发重渲染
});
```

### 2. 完善加载状态管理

- 将`isLoading`状态细化，区分组件加载、纹理加载、模型加载等不同阶段
- 在所有资源加载完成后才将`isLoading`设置为false
- 添加加载进度反馈

### 3. 添加错误处理机制

- 为`TextureLoader`添加错误回调
- 处理3D模型加载失败的情况
- 添加全局错误捕获

### 4. 实现加载超时机制

- 设置合理的超时时间（如10秒）
- 超时后显示错误提示，允许用户重试

### 5. 优化Environment组件配置

- 简化Environment组件的preset设置，确保默认值正确
- 添加环境加载错误处理

### 6. 添加调试信息

- 在开发环境下显示加载日志
- 添加加载状态的详细信息

## 实现步骤

1. 修改`ImagePreview`组件，修复纹理加载问题
2. 完善ARPreview组件的加载状态管理
3. 添加资源加载错误处理
4. 实现加载超时机制
5. 优化Environment组件配置
6. 添加调试信息

## 预期效果

- AR预览能够正常加载并显示
- 加载状态及时更新，提供良好的用户反馈
- 加载失败时有明确的错误提示
- 防止无限加载状态
- 提高AR预览的稳定性和可靠性