'use client'

import { useEffect, useMemo, useState } from 'react'

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number]

export function usePagination<T>(items: T[], initialPageSize: number = 10) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)

  // Reset when page size changes; clamp when filters shrink the result set
  useEffect(() => {
    setPage(1)
  }, [pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    setPage(1)
  }, [totalItems])

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return items.slice(start, start + pageSize)
  }, [items, page, pageSize])

  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return {
    page,
    setPage,
    pageSize,
    setPageSize: (size: number) => setPageSize(size),
    totalItems,
    totalPages,
    pageItems,
    from,
    to,
    canPrev: page > 1,
    canNext: page < totalPages,
  }
}
