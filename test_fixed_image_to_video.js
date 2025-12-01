import http from 'http';

// 测试图生视频API功能
async function testImageToVideo() {
  console.log('开始测试图生视频API...');
  
  // 准备请求数据
  const postData = JSON.stringify({
    model: 'doubao-seedance-1-0-pro-fast-251015',
    content: [
      {
        type: 'text',
        text: 'test image to video --resolution 720p --duration 5 --camerafixed false'
      },
      {
        type: 'image_url',
        image_url: {
          url: 'https://picsum.photos/512/512'
        }
      }
    ]
  });
  
  // 设置请求选项
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/doubao/videos/tasks',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log('响应头:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('响应体:', data);
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.ok && response.data?.id) {
            console.log(`✅ 图生视频任务创建成功! 任务ID: ${response.data.id}`);
            resolve({ success: true, taskId: response.data.id });
          } else {
            console.log('❌ 图生视频任务创建失败');
            console.log('错误详情:', response.error || '未知错误');
            resolve({ success: false, error: response.error || '未知错误' });
          }
        } catch (e) {
          console.log('❌ JSON解析错误:', e.message);
          resolve({ success: false, error: 'JSON解析错误' });
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`请求错误: ${e.message}`);
      reject(e);
    });
    
    // 发送请求
    req.write(postData);
    req.end();
  });
}

// 执行测试
testImageToVideo()
  .then(result => {
    if (result.success) {
      console.log(`\n可使用以下命令检查任务状态:`);
      console.log(`curl http://localhost:3001/api/doubao/videos/tasks/${result.taskId}`);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('测试失败:', error);
    process.exit(1);
  });
