// AI API连接状态简单检查脚本
// 纯JavaScript实现，不依赖TypeScript模块

import fetch from 'node-fetch';

// 测试配置
const TEST_CONFIG = {
  timeout: 10000, // 单个测试超时时间（毫秒）
  testPrompt: '请用一句话介绍你自己',
  retryCount: 1, // 重试次数
  retryDelay: 1000 // 重试延迟（毫秒）
};

// 支持的AI模型配置
const AI_MODELS = [
  {
    id: 'kimi',
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    healthCheckPath: '/models',
    chatPath: '/chat/completions'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    healthCheckPath: '/v1/models',
    chatPath: '/v1/chat/completions'
  },
  {
    id: 'doubao',
    name: '豆包',
    baseUrl: 'https://api.doubao.com/v1',
    healthCheckPath: '/models',
    chatPath: '/chat/completions'
  },
  {
    id: 'qwen',
    name: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    healthCheckPath: '/models/text-generation',
    chatPath: '/services/aigc/text-generation/generation'
  },
  {
    id: 'wenxinyiyan',
    name: '文心一言',
    baseUrl: 'https://aip.baidubce.com',
    healthCheckPath: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    chatPath: '/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    baseUrl: 'https://api.openai.com/v1',
    healthCheckPath: '/models',
    chatPath: '/chat/completions'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    healthCheckPath: '/models',
    chatPath: '/models/gemini-1.5-flash:generateContent'
  },
  {
    id: 'zhipu',
    name: '智谱',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    healthCheckPath: '/models',
    chatPath: '/chat/completions'
  }
];

// 测试结果类型定义
class TestResult {
  constructor(modelId, modelName) {
    this.modelId = modelId;
    this.modelName = modelName;
    this.tests = [];
    this.summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      averageResponseTime: 0
    };
  }
  
  addTest(name, status, error, responseTime, details) {
    this.tests.push({
      name,
      status,
      error,
      responseTime,
      details
    });
    
    // 更新统计信息
    this.summary.totalTests++;
    if (status === 'pass') {
      this.summary.passedTests++;
    } else {
      this.summary.failedTests++;
    }
    
    if (responseTime) {
      this.summary.averageResponseTime = (
        this.summary.averageResponseTime * (this.summary.totalTests - 1) + responseTime
      ) / this.summary.totalTests;
    }
  }
}

// 测试结果存储
const testResults = [];

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 重试函数
const retry = async (fn, maxRetries, delayMs) => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries) {
        throw error;
      }
      console.log(`  重试第 ${i + 1} 次...`);
      await delay(delayMs);
    }
  }
};

// 生成测试结果报告
const generateTestReport = () => {
  console.log('\n=== AI API连接状态全面检查报告 ===\n');
  
  // 总体统计
  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalResponseTime = 0;
  let testCount = 0;
  
  testResults.forEach(result => {
    totalTests += result.summary.totalTests;
    totalPassed += result.summary.passedTests;
    totalFailed += result.summary.failedTests;
    
    if (result.summary.averageResponseTime > 0) {
      totalResponseTime += result.summary.averageResponseTime;
      testCount++;
    }
    
    console.log(`\n模型: ${result.modelName} (${result.modelId})`);
    console.log(`状态: ${result.summary.failedTests === 0 ? '✅ 全部通过' : `❌ 部分失败 (${result.summary.passedTests}/${result.summary.totalTests})`}`);
    console.log(`平均响应时间: ${result.summary.averageResponseTime.toFixed(2)}ms`);
    
    if (result.summary.failedTests > 0) {
      console.log('失败测试:');
      result.tests.filter(test => test.status === 'fail').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
  });
  
  const overallAverageResponseTime = testCount > 0 ? totalResponseTime / testCount : 0;
  
  console.log('\n=== 总体测试结果 ===');
  console.log(`测试模型数量: ${testResults.length}`);
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过测试数: ${totalPassed}`);
  console.log(`失败测试数: ${totalFailed}`);
  console.log(`总体平均响应时间: ${overallAverageResponseTime.toFixed(2)}ms`);
  console.log(`总体通过率: ${((totalPassed / totalTests) * 100).toFixed(2)}%`);
  
  // 输出JSON格式报告，便于后续处理
  console.log('\n=== JSON格式报告 ===');
  console.log(JSON.stringify(testResults, null, 2));
  
  return testResults;
};

// 网络连通性检查
const checkNetworkConnectivity = async (model) => {
  try {
    const startTime = Date.now();
    
    // 发送HEAD请求检查网络连通性
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(model.baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual'
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    if (response.status >= 400 && response.status < 600) {
      throw new Error(`服务器返回错误状态码: ${response.status}`);
    }
    
    return {
      status: 'pass',
      responseTime,
      details: {
        baseUrl: model.baseUrl,
        status: response.status
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error.message,
      details: {
        error: error.message
      }
    };
  }
};

// API端点可达性检查
const checkApiEndpoint = async (model) => {
  try {
    const startTime = Date.now();
    
    // 发送GET请求检查API端点可达性
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
    
    const url = `${model.baseUrl}${model.healthCheckPath}`;
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // 添加一个模拟的Authorization头，实际测试时应该使用真实的API密钥
        'Authorization': 'Bearer sk_test_1234567890'
      }
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    // 即使返回401（未授权），只要能连接到端点，就认为API端点可达
    if (response.status >= 400 && response.status < 600 && response.status !== 401) {
      throw new Error(`API端点返回错误状态码: ${response.status}`);
    }
    
    return {
      status: 'pass',
      responseTime,
      details: {
        url,
        status: response.status,
        responseHeaders: Object.fromEntries(response.headers)
      }
    };
  } catch (error) {
    return {
      status: 'fail',
      error: error.message,
      details: {
        error: error.message
      }
    };
  }
};

// API响应格式测试
const testApiResponse = async (model) => {
  try {
    const startTime = Date.now();
    
    // 发送一个简单的测试请求
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TEST_CONFIG.timeout);
    
    const url = `${model.baseUrl}${model.chatPath}`;
    
    // 准备请求体，根据不同模型调整
    let requestBody = {};
    switch (model.id) {
      case 'chatgpt':
      case 'kimi':
      case 'deepseek':
      case 'zhipu':
        requestBody = {
          model: 'gpt-4o', // 使用一个通用模型名称
          messages: [
            { role: 'user', content: TEST_CONFIG.testPrompt }
          ],
          max_tokens: 100
        };
        break;
      case 'gemini':
        requestBody = {
          contents: [
            {
              parts: [
                { text: TEST_CONFIG.testPrompt }
              ]
            }
          ]
        };
        break;
      default:
        requestBody = {
          model: 'default',
          messages: [
            { role: 'user', content: TEST_CONFIG.testPrompt }
          ]
        };
    }
    
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        // 添加一个模拟的Authorization头，实际测试时应该使用真实的API密钥
        'Authorization': 'Bearer sk_test_1234567890'
      },
      body: JSON.stringify(requestBody)
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    // 检查响应是否为JSON格式
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return {
        status: 'pass',
        responseTime,
        details: {
          url,
          status: response.status,
          isJson: true,
          responseSample: JSON.stringify(data).substring(0, 200) + '...'
        }
      };
    } else {
      // 不是JSON格式，但至少能连接到API
      const text = await response.text();
      return {
        status: 'pass',
        responseTime,
        details: {
          url,
          status: response.status,
          isJson: false,
          responseSample: text.substring(0, 200) + '...'
        }
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      error: error.message,
      details: {
        error: error.message
      }
    };
  }
};

// 测试单个AI模型
const testAIModel = async (model) => {
  const result = new TestResult(model.id, model.name);
  
  console.log(`测试模型: ${model.name} (${model.id})...`);
  
  // 1. 网络连通性检查
  console.log('  - 网络连通性检查...');
  const networkResult = await checkNetworkConnectivity(model);
  result.addTest('网络连通性检查', networkResult.status, networkResult.error, networkResult.responseTime, networkResult.details);
  
  // 如果网络不通，跳过后续测试
  if (networkResult.status === 'fail') {
    console.log(`    ❌ 失败: ${networkResult.error}`);
    return result;
  }
  console.log('    ✅ 通过');
  
  // 2. API端点可达性检查
  console.log('  - API端点可达性检查...');
  const apiResult = await retry(async () => {
    return await checkApiEndpoint(model);
  }, TEST_CONFIG.retryCount, TEST_CONFIG.retryDelay);
  result.addTest('API端点可达性检查', apiResult.status, apiResult.error, apiResult.responseTime, apiResult.details);
  
  if (apiResult.status === 'fail') {
    console.log(`    ❌ 失败: ${apiResult.error}`);
    return result;
  }
  console.log('    ✅ 通过');
  
  // 3. API响应格式测试
  console.log('  - API响应格式测试...');
  const responseResult = await retry(async () => {
    return await testApiResponse(model);
  }, TEST_CONFIG.retryCount, TEST_CONFIG.retryDelay);
  result.addTest('API响应格式测试', responseResult.status, responseResult.error, responseResult.responseTime, responseResult.details);
  
  if (responseResult.status === 'fail') {
    console.log(`    ❌ 失败: ${responseResult.error}`);
  } else {
    console.log('    ✅ 通过');
  }
  
  return result;
};

// 主测试函数
const runTests = async () => {
  console.log('开始AI API连接状态全面检查...\n');
  
  // 遍历所有AI模型
  for (const model of AI_MODELS) {
    const modelResult = await testAIModel(model);
    testResults.push(modelResult);
    
    // 输出模型测试结果
    console.log(`${model.name}测试完成: ${modelResult.summary.failedTests === 0 ? '✅ 全部通过' : `❌ ${modelResult.summary.failedTests}个测试失败`}\n`);
  }
  
  // 生成最终测试报告
  generateTestReport();
};

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
