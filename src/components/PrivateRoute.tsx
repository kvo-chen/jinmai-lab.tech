import { useContext } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { Navigate } from 'react-router-dom'

interface PrivateRouteProps {
  component: React.ComponentType
}

export default function PrivateRoute({ component: Component }: PrivateRouteProps) {
  const { isAuthenticated } = useContext(AuthContext)
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <Component />
}
