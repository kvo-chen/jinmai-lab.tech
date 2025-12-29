// AI API连接状态全面检查脚本
// 基于现有的llmService和test-ai-api.js扩展

// 导入必要的依赖
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// 模拟浏览器环境
if (typeof window === 'undefined') {
  globalThis.window = {
    dispatchEvent: () => {},
    CustomEvent: class CustomEvent {
      constructor(type, options) {
        this.type = type;
        this.detail = options?.detail;
      }
    }
  };
  
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
  
  globalThis.fetch = require('node-fetch');
}

// 导入llmService
import { llmService } from './src/services/llmService.ts';

// 修复TypeScript导入路径
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试配置
const TEST_CONFIG = {
  timeout: 15000, // 单个测试超时时间（毫秒）
  testPrompt: '请用一句话介绍你自己',
  healthCheckEndpoint: '/api/health/llms',
  retryCount: 2, // 重试次数
  retryDelay: 1000 // 重试延迟（毫秒）
};

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
  
  // 生成HTML报告
  generateHtmlReport(testResults);
  
  return testResults;
};

// 生成HTML报告
const generateHtmlReport = (results) => {
  const fs = require('fs');
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI API连接状态检查报告</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      text-align: center;
    }
    h2 {
      color: #555;
      margin-top: 30px;
    }
    .summary {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .summary-item {
      display: inline-block;
      margin-right: 20px;
      font-size: 16px;
    }
    .model-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    .model-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .model-name {
      font-weight: bold;
      font-size: 18px;
    }
    .status {
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: bold;
    }
    .status.pass {
      background-color: #d4edda;
      color: #155724;
    }
    .status.fail {
      background-color: #f8d7da;
      color: #721c24;
    }
    .test-result {
      margin: 10px 0;
      padding: 10px;
      border-left: 3px solid #ddd;
    }
    .test-result.pass {
      border-left-color: #28a745;
      background-color: #f8fff9;
    }
    .test-result.fail {
      border-left-color: #dc3545;
      background-color: #fff8f8;
    }
    .test-name {
      font-weight: bold;
    }
    .test-error {
      color: #dc3545;
      margin-top: 5px;
    }
    .test-details {
      margin-top: 5px;
      font-size: 14px;
      color: #666;
    }
    pre {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AI API连接状态全面检查报告</h1>
    <div class="summary">
      <div class="summary-item">测试模型数量: ${results.length}</div>
      <div class="summary-item">总测试数: ${results.reduce((sum, r) => sum + r.summary.totalTests, 0)}</div>
      <div class="summary-item">通过测试数: ${results.reduce((sum, r) => sum + r.summary.passedTests, 0)}</div>
      <div class="summary-item">失败测试数: ${results.reduce((sum, r) => sum + r.summary.failedTests, 0)}</div>
      <div class="summary-item">总体通过率: ${((results.reduce((sum, r) => sum + r.summary.passedTests, 0) / results.reduce((sum, r) => sum + r.summary.totalTests, 0)) * 100).toFixed(2)}%</div>
    </div>
    
    ${results.map(result => `
    <div class="model-section">
      <div class="model-header">
        <div class="model-name">${result.modelName} (${result.modelId})</div>
        <div class="status ${result.summary.failedTests === 0 ? 'pass' : 'fail'}">
          ${result.summary.failedTests === 0 ? '全部通过' : `${result.summary.passedTests}/${result.summary.totalTests} 通过`}
        </div>
      </div>
      <div>平均响应时间: ${result.summary.averageResponseTime.toFixed(2)}ms</div>
      
      ${result.tests.map(test => `
      <div class="test-result ${test.status}">
        <div class="test-name">${test.name}</div>
        ${test.responseTime ? `<div>响应时间: ${test.responseTime}ms</div>` : ''}
        ${test.status === 'fail' ? `<div class="test-error">错误: ${test.error}</div>` : ''}
        ${test.details ? `<div class="test-details">详情: ${JSON.stringify(test.details)}</div>` : ''}
      </div>
      `).join('')}
    </div>
    `).join('')}
    
    <h2>原始JSON报告</h2>
    <pre>${JSON.stringify(results, null, 2)}</pre>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync('ai-api-test-report.html', htmlContent);
  console.log('\n=== HTML报告已生成 ===');
  console.log('报告文件: ai-api-test-report.html');
};

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
      console.log(`重试第 ${i + 1} 次...`);
      await delay(delayMs);
    }
  }
};

// 测试单个AI模型
const testAIModel = async (model) => {
  const result = new TestResult(model.id, model.name);
  
  // 1. API密钥有效性检查
  const keyTestName = 'API密钥有效性检查';
  try {
    const startTime = Date.now();
    
    // 检查API密钥是否配置
    const apiBase = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : '';
    const useProxy = !!apiBase;
    
    let hasValidKey = true;
    if (!useProxy) {
      const envKey = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env[`VITE_${model.id.toUpperCase()}_API_KEY`] : '';
      const storedKey = typeof localStorage !== 'undefined' ? localStorage.getItem(`${model.id.toUpperCase()}_API_KEY`) : '';
      hasValidKey = !!(storedKey || envKey);
    }
    
    const responseTime = Date.now() - startTime;
    
    if (hasValidKey) {
      result.addTest(keyTestName, 'pass', undefined, responseTime, {
        hasValidKey: true,
        useProxy
      });
    } else {
      result.addTest(keyTestName, 'fail', `${model.id} API密钥未配置`, responseTime, {
        hasValidKey: false,
        useProxy
      });
      // 如果API密钥无效，跳过后续测试
      return result;
    }
  } catch (error) {
    result.addTest(keyTestName, 'fail', error.message, undefined, {
      error: error.message
    });
    return result;
  }
  
  // 2. 网络连通性检查
  const networkTestName = '网络连通性检查';
  try {
    const startTime = Date.now();
    
    // 获取模型的基础URL
    let baseUrl = '';
    switch (model.id) {
      case 'kimi':
        baseUrl = llmService.getConfig().kimi_base_url || 'https://api.moonshot.cn/v1';
        break;
      case 'deepseek':
        baseUrl = llmService.getConfig().deepseek_base_url || 'https://api.deepseek.com';
        break;
      case 'doubao':
        baseUrl = llmService.getConfig().doubao_base_url || 'https://api.doubao.com/v1';
        break;
      case 'qwen':
        baseUrl = llmService.getConfig().qwen_base_url || 'https://dashscope.aliyuncs.com/api/v1';
        break;
      case 'wenxinyiyan':
        const rawWenxinUrl = llmService.getConfig().wenxin_base_url || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions';
        const urlObj = new URL(rawWenxinUrl);
        baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        break;
      case 'chatgpt':
        baseUrl = llmService.getConfig().chatgpt_base_url || 'https://api.openai.com/v1';
        break;
      case 'gemini':
        baseUrl = llmService.getConfig().gemini_base_url || 'https://generativelanguage.googleapis.com/v1';
        break;
      case 'gork':
        baseUrl = llmService.getConfig().gork_base_url || 'https://api.x.ai/v1';
        break;
      case 'zhipu':
        baseUrl = llmService.getConfig().zhipu_base_url || 'https://open.bigmodel.cn/api/paas/v4';
        break;
      default:
        baseUrl = llmService.getConfig().kimi_base_url || 'https://api.moonshot.cn/v1';
    }
    
    // 测试网络连通性
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'manual'
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - startTime;
    
    if (response.status >= 400 && response.status < 600) {
      throw new Error(`服务器返回错误状态码: ${response.status}`);
    }
    
    result.addTest(networkTestName, 'pass', undefined, responseTime, {
      baseUrl,
      status: response.status,
      redirectStatus: response.redirected ? response.status : 'no-redirect'
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    result.addTest(networkTestName, 'fail', error.message, responseTime, {
      error: error.message
    });
    // 如果网络不通，跳过后续测试
    return result;
  }
  
  // 3. 连接状态检查（使用llmService的内置方法）
  const connectionTestName = '连接状态检查';
  try {
    const startTime = Date.now();
    
    const connectionStatus = await llmService.checkConnectionStatus(model.id);
    const responseTime = Date.now() - startTime;
    
    if (connectionStatus === 'connected') {
      result.addTest(connectionTestName, 'pass', undefined, responseTime, {
        connectionStatus
      });
    } else {
      result.addTest(connectionTestName, 'fail', `${model.id} 连接状态为: ${connectionStatus}`, responseTime, {
        connectionStatus
      });
      // 如果连接状态不是connected，跳过后续测试
      return result;
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    result.addTest(connectionTestName, 'fail', error.message, responseTime, {
      error: error.message
    });
    return result;
  }
  
  // 4. 基础AI功能测试
  const basicTestName = '基础AI功能测试';
  try {
    const startTime = Date.now();
    
    // 使用重试机制
    const testResponse = await retry(async () => {
      return await llmService.generateResponse(TEST_CONFIG.testPrompt, {
        signal: AbortSignal.timeout(TEST_CONFIG.timeout)
      });
    }, TEST_CONFIG.retryCount, TEST_CONFIG.retryDelay);
    
    const responseTime = Date.now() - startTime;
    
    if (testResponse && typeof testResponse === 'string' && testResponse.length > 0) {
      result.addTest(basicTestName, 'pass', undefined, responseTime, {
        responseLength: testResponse.length,
        responseSample: testResponse.substring(0, 100) + (testResponse.length > 100 ? '...' : '')
      });
    } else {
      result.addTest(basicTestName, 'fail', 'AI返回结果为空或格式不正确', responseTime, {
        response: testResponse
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    result.addTest(basicTestName, 'fail', error.message, responseTime, {
      error: error.message
    });
  }
  
  // 5. 响应格式验证
  const formatTestName = '响应格式验证';
  try {
    const startTime = Date.now();
    
    const testResponse = await llmService.generateResponse('请返回一个JSON格式的对象，包含name和value字段，值分别为"test"和123');
    const responseTime = Date.now() - startTime;
    
    // 尝试解析JSON
    let parsedJson;
    try {
      parsedJson = JSON.parse(testResponse);
    } catch (e) {
      throw new Error('返回结果不是有效的JSON格式');
    }
    
    // 验证JSON结构
    if (parsedJson && typeof parsedJson === 'object' && parsedJson.name && parsedJson.value) {
      result.addTest(formatTestName, 'pass', undefined, responseTime, {
        parsedJson,
        isValidJson: true
      });
    } else {
      result.addTest(formatTestName, 'fail', 'JSON格式不符合预期', responseTime, {
        parsedJson,
        isValidJson: true
      });
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    result.addTest(formatTestName, 'fail', error.message, responseTime, {
      error: error.message
    });
  }
  
  return result;
};

// 主测试函数
const runTests = async () => {
  console.log('开始AI API连接状态全面检查...\n');
  
  // 获取所有可用模型
  const availableModels = llmService.AVAILABLE_MODELS || [
    { id: 'doubao', name: '豆包' },
    { id: 'kimi', name: 'Kimi' },
    { id: 'deepseek', name: 'DeepSeek' },
    { id: 'qwen', name: '通义千问' },
    { id: 'wenxinyiyan', name: '文心一言' },
    { id: 'chatgpt', name: 'ChatGPT' },
    { id: 'gemini', name: 'Gemini' },
    { id: 'zhipu', name: '智谱' }
  ];
  
  // 遍历所有AI模型
  for (const model of availableModels) {
    console.log(`测试模型: ${model.name} (${model.id})...`);
    const modelResult = await testAIModel(model);
    testResults.push(modelResult);
    
    // 输出模型测试结果
    console.log(`${model.name}测试完成: ${modelResult.summary.failedTests === 0 ? '✅ 全部通过' : `❌ ${modelResult.summary.failedTests}个测试失败`}`);
  }
  
  // 生成最终测试报告
  generateTestReport();
};

// 运行测试
runTests().catch(error => {
  console.error('测试过程中发生错误:', error);
  process.exit(1);
});
