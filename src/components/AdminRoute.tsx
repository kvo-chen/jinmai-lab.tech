import { useContext } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate } from 'react-router-dom'

interface AdminRouteProps {
  component: React.ComponentType
}

export default function AdminRoute({ component: Component }: AdminRouteProps) {
  const { isAuthenticated, user } = useContext(AuthContext)
  if (!isAuthenticated || !user?.isAdmin) {
    return <Navigate to="/login" replace />
  }
  return <Component />
}
