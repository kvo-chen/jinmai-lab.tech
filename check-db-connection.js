// 检查数据库连接状态的脚本
import { getDB, getDBStatus } from './server/database.mjs';

async function checkDatabaseConnection() {
  console.log('=== 检查数据库连接状态 ===');
  
  try {
    // 先获取当前配置和状态
    const status = getDBStatus();
    console.log('当前数据库类型:', status.currentDbType);
    console.log('连接状态:', status.status);
    console.log('重试次数:', status.retryCounts);
    
    // 尝试获取数据库连接
    console.log('\n正在尝试连接数据库...');
    const db = await getDB();
    console.log('✅ 数据库连接成功!');
    
    // 测试简单查询
    if (status.currentDbType === 'postgresql') {
      console.log('\n正在测试PostgreSQL查询...');
      const result = await db.query('SELECT NOW() as current_time');
      console.log('✅ 查询成功! 当前时间:', result.rows[0].current_time);
    } else if (status.currentDbType === 'neon_api') {
      console.log('\n正在测试Neon API查询...');
      const result = await db.query('SELECT NOW() as current_time');
      console.log('✅ 查询成功! 当前时间:', result.result.rows[0].current_time);
    } else if (status.currentDbType === 'sqlite') {
      console.log('\n正在测试SQLite查询...');
      const result = db.prepare('SELECT datetime(\'now\') as current_time').get();
      console.log('✅ 查询成功! 当前时间:', result.current_time);
    }
    
    console.log('\n🎉 数据库连接正常!');
    return true;
  } catch (error) {
    console.error('\n❌ 数据库连接失败:', error.message);
    console.error('错误详情:', error.stack);
    return false;
  }
}

// 运行测试
checkDatabaseConnection();
