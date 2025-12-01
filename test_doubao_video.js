import https from 'https';
import http from 'http';

// 配置信息
const API_BASE_URL = 'http://localhost:3001';
const CREATE_TASK_ENDPOINT = `${API_BASE_URL}/api/doubao/videos/tasks`;
const GET_TASK_ENDPOINT = `${API_BASE_URL}/api/doubao/videos/tasks/`;

// 用于创建视频的测试内容
const testContent = [
  {
    type: 'text',
    text: '一只小猫在草地上玩耍，阳光明媚，周围有几朵小花。'
  }
];

// 创建视频生成任务
async function createVideoTask() {
  console.log('Step 1: Creating video generation task...');
  
  const requestBody = {
        model: 'doubao-seedance-1-0-pro-250528',
    content: [
      {
        type: 'text',
        text: '一只小猫在草地上玩耍，阳光明媚，微风吹拂着草地。小猫追逐着蝴蝶，非常活泼可爱。'
      }
    ],
    height: 720,
    width: 1280,
    duration: 10
  };
  
  console.log('Sending request with body:', JSON.stringify(requestBody, null, 2));

  try {
    const response = await fetch('http://localhost:3001/api/doubao/videos/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    console.log('Create task response status:', response.status);
    console.log('Create task response data:', data);
    
    return { status: response.status, data: data };
  } catch (error) {
    console.error('Error creating video task:', error);
    throw error;
  }
}

// 用于获取视频任务状态的函数
async function getVideoTask(taskId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/doubao/videos/tasks/${taskId}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          console.log('Get task response status:', res.statusCode);
          console.log('Get task response data:', parsedData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error getting video task:', error);
      reject(error);
    });

    req.end();
  });
}

// 轮询视频任务状态的函数
async function pollVideoTask(taskId, options = {}) {
  const intervalMs = options.intervalMs || 10000; // 默认10秒轮询一次
  const maxRetries = options.maxRetries || 30; // 最多轮询30次，约5分钟
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log(`Polling task ${taskId}, attempt ${retries + 1}/${maxRetries}...`);
      const response = await getVideoTask(taskId);
      
      if (response.status !== 200) {
        console.error(`Error polling task: HTTP ${response.status}`);
        return response;
      }

      if (!response.data.ok) {
        console.error('Task retrieval failed:', response.data.error);
        return response;
      }

      const task = response.data.data;
      console.log(`Task status: ${task.status}`);

      // 检查任务是否完成
      if (task.status === 'succeeded' || task.status === 'failed' || task.status === 'cancelled') {
        console.log(`Task ${taskId} completed with status: ${task.status}`);
        return response;
      }

      // 等待下一次轮询
      console.log(`Task ${taskId} still processing. Waiting ${intervalMs / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      retries++;
    } catch (error) {
      console.error('Error during polling:', error);
      // 继续尝试轮询
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      retries++;
    }
  }

  console.error(`Task ${taskId} polling timed out after ${maxRetries} attempts`);
  return { status: 408, data: { ok: false, error: 'TIMEOUT', message: 'Task polling timed out' } };
}

// 主测试函数
async function runTest() {
  console.log('=== Starting video generation test ===');
  
  try {
    // 步骤1: 创建视频任务
    console.log('Step 1: Creating video generation task...');
    const createResponse = await createVideoTask();
    
    if (createResponse.status !== 200) {
      console.error(`Failed to create video task: HTTP ${createResponse.status}`);
      console.error('Error details:', createResponse.data);
      process.exit(1);
    }

    if (!createResponse.data.ok || !createResponse.data.data || !createResponse.data.data.id) {
      console.error('Invalid response from create task endpoint');
      console.error('Response:', createResponse.data);
      process.exit(1);
    }

    const taskId = createResponse.data.data.id;
    console.log(`Successfully created video task with ID: ${taskId}`);
    
    // 步骤2: 轮询任务状态
    console.log('\nStep 2: Polling task status...');
    console.log('Note: Video generation may take several minutes. The script will poll every 10 seconds.');
    const finalResponse = await pollVideoTask(taskId);
    
    // 步骤3: 输出结果
    console.log('\nStep 3: Task completed. Processing results...');
    if (finalResponse.status === 200 && finalResponse.data.ok) {
      const taskData = finalResponse.data.data;
      if (taskData.status === 'succeeded') {
        console.log('✅ Video generation successful!');
        console.log('Video URL:', taskData.content?.video_url || 'Not available');
        console.log('Last frame URL:', taskData.content?.last_frame_url || 'Not available');
        console.log('Usage:', JSON.stringify(taskData.usage || {}, null, 2));
      } else if (taskData.status === 'failed') {
        console.error('❌ Video generation failed!');
        console.error('Error details:', taskData.error || 'No error details provided');
      } else if (taskData.status === 'cancelled') {
        console.warn('⚠️ Video generation was cancelled');
      }
    } else {
      console.error('❌ Failed to get task result');
      console.error('Response:', finalResponse.data);
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
  
  console.log('\n=== Test completed ===');
}

// 运行测试
runTest();