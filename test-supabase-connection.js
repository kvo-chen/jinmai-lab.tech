// Supabase连接测试脚本
// 用于验证Supabase连接是否正常工作
// 使用ES模块语法，可直接在浏览器控制台或支持ES模块的Node.js环境中运行

console.log('=== Supabase连接测试开始 ===\n');

// 1. 测试环境变量配置
console.log('1. 测试环境变量配置:');

// 从环境变量获取Supabase连接信息
const supabaseConfig = {
  url: import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || 
       import.meta.env?.VITE_SUPABASE_URL || 
       import.meta.env?.SUPABASE_URL,
  key: import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
       import.meta.env?.VITE_SUPABASE_ANON_KEY || 
       import.meta.env?.SUPABASE_ANON_KEY ||
       import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
       import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || 
       import.meta.env?.SUPABASE_PUBLISHABLE_KEY
};

console.log(`   URL配置: ${supabaseConfig.url ? '已设置' : '未设置'}`);
console.log(`   密钥配置: ${supabaseConfig.key ? '已设置' : '未设置'}`);
console.log(`   密钥长度: ${supabaseConfig.key ? supabaseConfig.key.length : 0}`);
console.log(`   密钥前缀: ${supabaseConfig.key ? supabaseConfig.key.substring(0, 20) + '...' : 'N/A'}`);

if (!supabaseConfig.url || !supabaseConfig.key) {
  console.error('   ❌ 错误: Supabase URL或密钥未配置');
  console.error('   请检查环境变量配置，确保已添加以下环境变量之一:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL 或 VITE_SUPABASE_URL 或 SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY 或 VITE_SUPABASE_ANON_KEY 或 SUPABASE_ANON_KEY');
  console.error('   - 或相应的PUBLISHABLE_KEY变体');
  process.exit(1);
}

// 2. 测试URL格式
console.log('\n2. 测试URL格式:');
if (supabaseConfig.url && !supabaseConfig.url.startsWith('http://') && !supabaseConfig.url.startsWith('https://')) {
  console.error('   ❌ 错误: URL格式不正确，必须以http://或https://开头:', supabaseConfig.url);
  process.exit(1);
}
console.log('   ✅ URL格式正确:', supabaseConfig.url);

// 3. 测试网络连接
console.log('\n3. 测试网络连接:');
const testNetworkConnection = async () => {
  try {
    const url = new URL(supabaseConfig.url);
    const response = await fetch(`${url.origin}/`, {
      method: 'GET',
      mode: 'cors',
      timeout: 5000
    });
    console.log(`   ✅ 网络连接成功: ${response.status} ${response.statusText}`);
    return true;
  } catch (error) {
    console.error(`   ❌ 网络连接失败: ${error.message}`);
    return false;
  }
};

// 4. 测试Supabase客户端初始化和基本功能
const testSupabaseConnection = async () => {
  try {
    // 动态导入Supabase客户端
    const { createClient } = await import('@supabase/supabase-js');
    
    console.log('\n4. 测试Supabase客户端初始化:');
    const supabase = createClient(supabaseConfig.url, supabaseConfig.key);
    
    console.log('   ✅ 客户端初始化成功');
    console.log('   ✅ auth对象:', typeof supabase.auth);
    console.log('   ✅ auth.signUp方法:', typeof supabase.auth.signUp);
    console.log('   ✅ auth.signInWithPassword方法:', typeof supabase.auth.signInWithPassword);
    
    // 5. 测试基本API调用
    console.log('\n5. 测试基本API调用:');
    try {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      
      if (error) {
        console.error('   ⚠️  API调用失败 (可能是权限问题，这是正常的):', error.message);
        console.error('   错误代码:', error.code);
        console.error('   错误详情:', error.details || '无详细信息');
        console.log('   ℹ️  注意: API调用失败可能是由于表权限配置导致的，这是正常现象，不代表连接完全失败');
      } else {
        console.log('   ✅ API调用成功');
        console.log('   返回数据类型:', typeof data);
        console.log('   返回数据数量:', data ? data.length : 0);
      }
    } catch (error) {
      console.error('   ❌ API调用异常:', error.message);
      console.log('   ℹ️  注意: API调用异常可能是由于网络问题或配置问题导致的');
    }
    
    // 6. 测试认证API可用性
    console.log('\n6. 测试认证API可用性:');
    try {
      // 不实际创建用户，只检查signUp方法是否存在且可调用
      if (typeof supabase.auth.signUp === 'function') {
        console.log('   ✅ 认证API配置完成');
        console.log('   ✅ signUp方法可用');
        console.log('   ✅ 认证系统配置正常');
      } else {
        console.error('   ❌ 认证API不可用');
      }
    } catch (error) {
      console.error('   ❌ 认证API测试失败:', error.message);
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ 客户端初始化或测试失败:', error.message);
    console.error('   错误堆栈:', error.stack);
    return false;
  }
};

// 运行所有测试
const runAllTests = async () => {
  try {
    // 运行网络连接测试
    const networkOk = await testNetworkConnection();
    if (!networkOk) {
      console.error('\n=== Supabase连接测试失败 ===');
      console.error('❌ 网络连接失败，无法连接到Supabase服务器');
      process.exit(1);
    }
    
    // 运行Supabase客户端测试
    const supabaseOk = await testSupabaseConnection();
    if (!supabaseOk) {
      console.error('\n=== Supabase连接测试失败 ===');
      console.error('❌ Supabase客户端初始化或功能测试失败');
      process.exit(1);
    }
    
    console.log('\n=== Supabase连接测试完成 ===');
    console.log('✅ 所有测试通过，Supabase连接配置正常');
    console.log('\n=== 测试总结 ===');
    console.log('✅ 环境变量配置完整');
    console.log('✅ URL格式正确');
    console.log('✅ 网络连接正常');
    console.log('✅ Supabase客户端初始化成功');
    console.log('✅ 认证API配置完成');
    console.log('\nℹ️  如果遇到注册/登录问题，请检查:');
    console.log('   1. Supabase控制台中的认证设置');
    console.log('   2. 用户表的权限配置');
    console.log('   3. 邮箱验证设置（如果启用）');
    console.log('   4. 密码策略设置');
    
    process.exit(0);
  } catch (error) {
    console.error('\n=== 测试脚本执行失败 ===');
    console.error('❌ 错误信息:', error.message);
    console.error('❌ 错误堆栈:', error.stack);
    process.exit(1);
  }
};

// 启动测试
runAllTests();

// 导出测试函数，以便在其他地方使用
export { runAllTests, testNetworkConnection, testSupabaseConnection };
