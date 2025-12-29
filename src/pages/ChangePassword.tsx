import { useState, useContext } from 'react'
import { AuthContext } from '@/contexts/authContext'
import { useTheme } from '@/hooks/useTheme'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'

export default function ChangePassword() {
  const { user } = useContext(AuthContext)
  const { isDark } = useTheme()
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const validateForm = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('请填写所有必填字段')
      return false
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError('新密码和确认密码不匹配')
      return false
    }
    
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(formData.newPassword)) {
      setError('新密码必须至少8个字符，包含至少一个字母和一个数字')
      return false
    }
    
    return true
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')
    
    if (!validateForm()) {
      setIsLoading(false)
      return
    }
    
    try {
      if (supabase && user?.email) {
        // 使用Supabase的updateUser方法更改密码
        const { error: updateError } = await supabase.auth.updateUser({
          password: formData.newPassword
        })
        
        if (updateError) {
          throw updateError
        }
      } else {
        // 模拟密码更改成功（用于本地开发）
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      setSuccess('密码修改成功！')
      
      // 重置表单
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      
      // 2秒后跳转回设置页面
      setTimeout(() => {
        navigate('/settings')
      }, 2000)
    } catch (err: any) {
      console.error('密码修改失败:', err)
      setError(err.message || '密码修改失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">修改密码</h1>
        <Link 
          to="/settings" 
          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        >
          <i className="fas fa-arrow-left mr-2"></i>返回设置
        </Link>
      </div>
      
      <div className={`max-w-2xl mx-auto rounded-2xl shadow-md p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              当前密码
            </label>
            <input
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="请输入当前密码"
            />
          </div>
          
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              新密码
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="请输入新密码（至少8个字符，包含字母和数字）"
            />
          </div>
          
          <div className="space-y-3">
            <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              确认新密码
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-300 text-gray-800 focus:border-blue-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              placeholder="请再次输入新密码"
            />
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              className={`w-full py-3 rounded-lg transition-colors ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>修改中...</>
              ) : (
                '修改密码'
              )}
            </button>
          </div>
          
          <div className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} pt-2`}>
            <p>密码修改后，请使用新密码重新登录</p>
          </div>
        </form>
      </div>
    </main>
  )
}