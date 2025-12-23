import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

async function testSupabaseConnection() {
  try {
    // 使用Supabase客户端库连接
    const supabaseUrl = 'https://dinosytgmlceuvbpycq.supabase.co';
    const supabaseKey = 'your-anon-key'; // 这里需要替换为你的Supabase匿名密钥
    
    console.log('正在测试Supabase客户端连接...');
    console.log('使用的Supabase URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 测试连接
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      console.error('❌ Supabase连接测试失败:', error.message);
      console.error('详细错误:', error);
    } else {
      console.log('✅ Supabase连接成功！');
      console.log('✅ 查询结果:', data);
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('详细错误:', error);
  }
}

testSupabaseConnection();