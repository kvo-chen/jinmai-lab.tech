import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'

export interface GradientHeroProps {
  title: string
  subtitle?: string
  badgeText?: string
  theme?: 'red' | 'indigo' | 'blue' | 'heritage'
  stats?: Array<{ label: string; value: string }>
  className?: string
  variant?: 'center' | 'split'
  showDecor?: boolean
  size?: 'sm' | 'md' | 'lg'
  pattern?: boolean
}

export default function GradientHero({ title, subtitle, badgeText, theme = 'red', stats = [], className, variant = 'center', showDecor = true, size = 'md', pattern = false }: GradientHeroProps) {
  const { isDark } = useTheme()
  // 中文注释：根据主题选择不同的渐变配色，满足多页面风格统一
  const gradient = useMemo(() => {
    switch (theme) {
      case 'indigo':
        return 'from-indigo-600 to-fuchsia-600'
      case 'blue':
        return 'from-blue-600 to-cyan-600'
      case 'heritage':
        // 中文注释：老字号联名主题采用中国红到金色的渐变，凸显传统质感
        return 'from-red-700 to-amber-500'
      default:
        return 'from-red-600 to-pink-600'
    }
  }, [theme])
  const paddings = size === 'lg' ? 'px-8 py-12' : size === 'sm' ? 'px-4 py-6' : 'px-6 py-10'
  const titleClass = size === 'lg' ? 'text-3xl md:text-4xl' : size === 'sm' ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'
  const subtitleClass = size === 'lg' ? 'mt-3 text-base' : size === 'sm' ? 'mt-2 text-sm' : 'mt-2 text-sm'
  return (
    <motion.section
      className={`relative overflow-hidden rounded-3xl mb-8 text-white bg-gradient-to-r ${gradient} ${className || ''} container mx-auto`}
      aria-label={title}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {pattern && (
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>
      )}
      {variant === 'center' ? (
        <div className={`container mx-auto ${paddings}`}>
          <div className="flex items-center justify-between">
            <h1 className={`${titleClass} font-bold tracking-tight`}>{title}</h1>
            {badgeText && (
              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-black/30 ring-1 ring-gray-600' : 'bg-white/20 ring-1 ring-white/50'} backdrop-blur`}>{badgeText}</span>
            )}
          </div>
          {subtitle && (
            <p className={`${isDark ? 'text-gray-200' : 'text-white/90'} ${subtitleClass}`}>{subtitle}</p>
          )}
          {stats.length > 0 && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s, idx) => (
                <div
                  key={idx}
                  className={`${isDark ? 'bg-black/20 ring-1 ring-gray-700' : 'bg-white/15 ring-1 ring-white/40'} rounded-xl px-4 py-3 backdrop-blur`}
                >
                  <div className="text-xs opacity-80">{s.label}</div>
                  <div className="text-base font-semibold">{s.value}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`container mx-auto ${paddings}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex items-center justify-between">
                <h1 className={`${titleClass} font-bold tracking-tight`}>{title}</h1>
                {badgeText && (
                  <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-black/30 ring-1 ring-gray-600' : 'bg-white/20 ring-1 ring-white/50'} backdrop-blur`}>{badgeText}</span>
                )}
              </div>
              {subtitle && (
                <p className={`${isDark ? 'text-gray-200' : 'text-white/90'} ${subtitleClass}`}>{subtitle}</p>
              )}
            </div>
            <div className="relative">
              {showDecor && (
                <div className="pointer-events-none absolute -top-8 -right-8 w-40 h-40 rounded-full blur-2xl opacity-30 bg-white"></div>
              )}
              {stats.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  {stats.map((s, idx) => (
                    <div
                      key={idx}
                      className={`${isDark ? 'bg-black/20 ring-1 ring-gray-700' : 'bg-white/15 ring-1 ring-white/40'} rounded-xl px-4 py-3 backdrop-blur`}
                    >
                      <div className="text-xs opacity-80">{s.label}</div>
                      <div className="text-base font-semibold">{s.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.section>
  )
}
