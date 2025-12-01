// 豆包多模态API测试脚本

async function testDoubaoMultimodalAPI() {
  console.log('开始测试豆包多模态API连接...');
  
  // 使用本地API代理服务器地址
  const apiBaseUrl = 'http://localhost:3001/api/doubao';
  
  // 测试数据 - 使用用户提供的信息
  const testData = {
    model: 'doubao-seed-1-6-251015',
    max_completion_tokens: 65535,
    messages: [
      {
        content: [
          {
            image_url: {
              url: 'https://ark-project.tos-cn-beijing.ivolces.com/images/view.jpeg'
            },
            type: 'image_url'
          },
          {
            text: '图片主要讲了什么?',
            type: 'text'
          }
        ],
        role: 'user'
      }
    ],
    reasoning_effort: 'medium'
  };

  try {
    // 发送请求到本地代理服务器
    console.log('发送请求到本地代理服务器...');
    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    // 检查响应状态
    if (!response.ok) {
      console.error(`请求失败: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      console.error('错误详情:', errorData);
      return;
    }

    // 获取响应数据
    const data = await response.json();
    console.log('请求成功!');
    console.log('响应状态:', data.ok ? '成功' : '失败');
    
    if (data.ok && data.data) {
      console.log('API响应详情:');
      console.log(`- 模型: ${data.data.model || '未知'}`);
      console.log(`- 完成原因: ${data.data.choices?.[0]?.finish_reason || '未知'}`);
      
      if (data.data.choices && data.data.choices.length > 0) {
        console.log('- 响应内容:');
        console.log(data.data.choices[0].message?.content || '无内容');
      }
      
      console.log(`- 令牌使用情况: 提示词 ${data.data.usage?.prompt_tokens || 0}, 完成 ${data.data.usage?.completion_tokens || 0}, 总计 ${data.data.usage?.total_tokens || 0}`);
    }
    
    console.log('测试完成! 豆包多模态API连接正常工作。');
  } catch (error) {
    console.error('请求过程中发生错误:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('无法连接到本地API代理服务器。请确保服务器已启动并运行在端口3001。');
    }
  }
}

// 执行测试
testDoubaoMultimodalAPI();
