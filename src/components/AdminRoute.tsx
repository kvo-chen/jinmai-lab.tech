import { useContext, ReactNode, memo } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate, useLocation } from 'react-router-dom'

interface AdminRouteProps {
  component?: React.ComponentType;
  children?: ReactNode;
}

// 使用memo优化，避免不必要的重新渲染
const AdminRoute = memo(({ component: Component, children }: AdminRouteProps) => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const location = useLocation();
  
  // 优化重定向逻辑，使用更明确的状态检查
  if (isAuthenticated === false || !user?.isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // 如果isAuthenticated为undefined（初始加载状态），返回null避免闪烁
  if (isAuthenticated === undefined) {
    return null;
  }
  
  // 如果有children，直接返回children，用于支持懒加载组件
  if (children) {
    return <>{children}</>;
  }
  
  // 如果提供了component，则渲染该组件
  if (Component) {
    return <Component />;
  }
  
  return null;
});

// 添加显示名称，便于调试
AdminRoute.displayName = 'AdminRoute';

export default AdminRoute;
