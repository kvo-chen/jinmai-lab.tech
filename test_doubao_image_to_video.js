// 中文注释：使用本地代理接口进行图生视频测试，避免在代码中暴露密钥

console.log('=== 图生视频本地接口测试开始 ===');

// 中文注释：轮询任务状态直到完成
async function pollTask(taskId, { intervalMs = 10000, timeoutMs = 600000 } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await fetch(`http://localhost:3001/api/doubao/videos/tasks/${taskId}`);
    const data = await r.json();
    console.log('任务状态查询：', r.status, data);
    if (r.status !== 200 || !data.ok) return data;
    const s = data.data?.status;
    if (s === 'succeeded' || s === 'failed' || s === 'cancelled') return data;
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  return { ok: false, error: 'TIMEOUT' };
}

// 中文注释：图生视频创建与查询测试
async function testImageToVideo() {
  try {
    const body = {
      model: 'doubao-seedance-1-0-pro-fast-251015',
      content: [
        { type: 'text', text: '无人机以极快速度穿越复杂障碍或自然奇观，带来沉浸式飞行体验 --resolution 1080p --duration 5 --camerafixed false --watermark true' },
        { type: 'image_url', image_url: { url: 'https://ark-project.tos-cn-beijing.volces.com/doc_image/seepro_i2v.png' } },
      ],
    };

    console.log('发送图生视频创建请求到本地接口...');
    const r = await fetch('http://localhost:3001/api/doubao/videos/image-to-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    console.log('创建任务响应：', r.status, data);

    if (r.status !== 200 || !data.ok || !data.data?.id) {
      console.error('❌ 创建任务失败');
      return;
    }

    const taskId = data.data.id;
    console.log('✅ 已创建任务，ID：', taskId);

    console.log('开始轮询任务状态（每10秒一次）...');
    const final = await pollTask(taskId);
    console.log('最终任务结果：', final);
    if (final?.data?.status === 'succeeded') {
      console.log('✅ 视频地址：', final.data.content?.video_url || '(未提供)');
      console.log('✅ 封面帧地址：', final.data.content?.last_frame_url || '(未提供)');
    } else if (final?.data?.status === 'failed') {
      console.log('❌ 任务失败：', final.data?.error);
    } else if (final?.data?.status === 'cancelled') {
      console.log('⚠️ 任务被取消');
    } else {
      console.log('❌ 未获取到有效的任务结果');
    }
  } catch (e) {
    console.error('❌ 测试异常：', e?.message || e);
  }
}

// 中文注释：运行测试
testImageToVideo();
