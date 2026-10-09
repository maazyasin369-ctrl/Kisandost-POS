'use client'

import { Banknote, BarChart3, Calendar, Clock, Landmark, TrendingUp, Users } from 'lucide-react'
import { StatCard } from '@/components/admin/StatCard'

const icons = {
  trend: TrendingUp,
  users: Users,
  clock: Clock,
  cash: Banknote,
  udhaar: Landmark,
  calendar: Calendar,
  chart: BarChart3,
}

export function ShopStats({
  items,
}: {
  items: {
    label: string
    value: string
    hint: string
    spark: number[]
    tone?: 'primary' | 'accent'
    icon: keyof typeof icons
  }[]
}) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${items.length > 3 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
      {items.map((item) => (
        <StatCard
          key={item.label}
          icon={icons[item.icon]}
          tone={item.tone}
          label={item.label}
          value={item.value}
          hint={item.hint}
          spark={item.spark.length ? item.spark : [0, 0]}
        />
      ))}
    </div>
  )
}
