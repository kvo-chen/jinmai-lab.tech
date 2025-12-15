import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const NEON_API_ENDPOINT = 'https://ep-bold-flower-agmuls0b.apirest.c-2.eu-central-1.aws.neon.tech/neondb/rest/v1';

try {
  console.log('正在测试Neon API连接...');
  console.log('API端点:', NEON_API_ENDPOINT);
  
  // 测试1: 检查API是否可访问
  console.log('\n1. 测试API基本访问...');
  const healthCheck = await fetch(NEON_API_ENDPOINT);
  console.log('健康检查状态:', healthCheck.status);
  
  // 测试2: 执行简单SQL查询
  console.log('\n2. 执行简单SQL查询...');
  const sqlQuery = await fetch(`${NEON_API_ENDPOINT}/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      sql: 'SELECT 1 as test_result',
      options: {
        "connection": {
          "database": "neondb"
        }
      }
    })
  });
  
  if (sqlQuery.ok) {
    const result = await sqlQuery.json();
    console.log('查询成功:', result);
    if (result.result?.rows?.[0]) {
      console.log('查询结果:', result.result.rows[0]);
    }
  } else {
    console.log('查询失败，状态码:', sqlQuery.status);
    try {
      const errorData = await sqlQuery.json();
      console.log('错误详情:', errorData);
    } catch (e) {
      console.log('无法解析错误响应:', e.message);
    }
  }
  
  // 测试3: 使用API密钥（如果有）
  console.log('\n3. 测试使用API密钥访问...');
  const API_KEY = process.env.NEON_API_KEY;
  if (API_KEY) {
    const authenticatedQuery = await fetch(`${NEON_API_ENDPOINT}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' LIMIT 3',
        options: {
          "connection": {
            "database": "neondb"
          }
        }
      })
    });
    
    if (authenticatedQuery.ok) {
      const result = await authenticatedQuery.json();
      console.log('使用API密钥查询成功:', result);
      if (result.result?.rows) {
        console.log('表列表:', result.result.rows);
      }
    } else {
      console.log('使用API密钥查询失败，状态码:', authenticatedQuery.status);
      try {
        const errorData = await authenticatedQuery.json();
        console.log('错误详情:', errorData);
      } catch (e) {
        console.log('无法解析错误响应:', e.message);
      }
    }
  } else {
    console.log('未找到NEON_API_KEY环境变量，跳过API密钥测试');
  }
  
  console.log('\n✅ Neon API测试完成！');
  
} catch (error) {
  console.error('❌ Neon API测试失败:', error.message);
  console.error('详细错误:', error);
  process.exit(1);
}