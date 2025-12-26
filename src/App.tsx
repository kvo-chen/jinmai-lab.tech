import { Routes, Route } from "react-router-dom";
import { Suspense } from 'react';
import TestBasic from "@/pages/TestBasic";

// 简化的LazyComponent，提供基本的加载状态
const LazyComponent = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      {children}
    </Suspense>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* 简单的测试页面，确保应用能正常运行 */}
        <Route path="/test-basic" element={<TestBasic />} />
        
        {/* 默认路由重定向到测试页面 */}
        <Route path="/" element={<TestBasic />} />
        
        {/* 所有其他路由也重定向到测试页面 */}
        <Route path="/*" element={<TestBasic />} />
      </Routes>
    </div>
  );
};