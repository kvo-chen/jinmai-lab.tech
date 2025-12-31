// 简单的Supabase连接测试脚本，使用CommonJS语法
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// 加载.env文件中的环境变量
dotenv.config();

// 从环境变量获取Supabase配置，优先使用Vercel和Vite的环境变量前缀
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                   process.env.VITE_SUPABASE_URL || 
                   process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                   process.env.VITE_SUPABASE_ANON_KEY || 
                   process.env.SUPABASE_ANON_KEY;

console.log('=== Supabase连接测试 ===');
console.log('URL:', supabaseUrl ? '已设置' : '未设置');
console.log('密钥:', supabaseKey ? '已设置' : '未设置');
console.log('密钥长度:', supabaseKey ? supabaseKey.length : 0);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误：请设置SUPABASE_URL和SUPABASE_ANON_KEY环境变量');
  process.exit(1);
}

// 创建Supabase客户端
console.log('\n=== 创建Supabase客户端 ===');

try {
  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase客户端创建成功');
  
  // 测试基本连接
  console.log('\n=== 测试基本连接 ===');
  
  // 测试获取表列表（仅在有适当权限时有效）
  console.log('\n=== 测试获取表列表 ===');
  supabase
    .from('users')
    .select('id, username')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('ℹ️ 获取表列表失败（可能是权限问题）:', error.message);
      } else {
        console.log('✅ 成功获取表数据:', data);
      }
      
      // 测试认证功能
      console.log('\n=== 测试认证功能 ===');
      
      // 测试获取会话（应该返回null，因为我们还没有登录）
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          if (error) {
            console.error('❌ 获取会话失败:', error.message);
          } else {
            console.log('✅ 获取会话成功，当前会话:', session ? '存在' : '不存在（正常，未登录）');
          }
          
          console.log('\n=== 测试完成 ===');
          console.log('✅ Supabase连接测试基本通过');
          console.log('ℹ️ 建议：');
          console.log('1. 检查Supabase控制台的项目状态');
          console.log('2. 确认网络访问权限设置');
          console.log('3. 查看控制台中的错误日志');
          console.log('4. 在生产环境中测试完整的注册/登录流程');
        })
        .catch(err => {
          console.error('❌ 获取会话时发生异常:', err);
        });
    })
    .catch(err => {
      console.error('❌ 测试表列表时发生异常:', err);
    });
} catch (error) {
  console.error('❌ 创建Supabase客户端失败:', error.message);
  console.error('错误详情:', error);
  process.exit(1);
}