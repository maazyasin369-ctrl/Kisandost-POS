'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getShopChrome } from '@/actions/auth'

export type ShopChrome = {
  ownerName: string
  role: string
  businessName: string
  license: string
  multiBranch: boolean
  branches: { id: string; name: string }[]
}

const ShopChromeContext = createContext<ShopChrome | null>(null)

export function ShopChromeProvider({ children }: { children: React.ReactNode }) {
  const [chrome, setChrome] = useState<ShopChrome | null>(null)

  useEffect(() => {
    let active = true
    getShopChrome().then((data) => {
      if (active && data) setChrome(data)
    })
    return () => {
      active = false
    }
  }, [])

  return <ShopChromeContext.Provider value={chrome}>{children}</ShopChromeContext.Provider>
}

export function useShopChrome() {
  return useContext(ShopChromeContext)
}
