import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">测试页面</h1>
      <p className="text-lg mb-6">这是一个简单的测试页面，用于检查路由是否正常工作。</p>
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">测试内容</h2>
        <p>如果您能看到这个页面，说明路由配置正常。</p>
      </div>
    </div>
  );
};

export default TestPage;