import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import SidebarLayout from '@/components/SidebarLayout';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';

const Analytics: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <SidebarLayout>
      {/* 导航栏 */}
      <nav className={`sticky top-0 z-50 ${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} px-4 py-3`}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <span className="text-xl font-bold text-red-600">AI</span>
            <span className="text-xl font-bold">共创</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 dark:text-gray-400">创作者数据分析</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnalyticsDashboard />
        </motion.div>
      </main>
    </SidebarLayout>
  );
};

export default Analytics;
