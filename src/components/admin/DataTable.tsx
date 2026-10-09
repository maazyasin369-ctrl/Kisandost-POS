'use client'



import React, { useMemo, useState } from 'react'

import Link from 'next/link'

import { usePagination } from '@/hooks/usePagination'

import Pagination from '@/components/ui/Pagination'



export type Column<T> = {

  key: string

  header: string

  sortable?: boolean

  align?: 'left' | 'right'

  render: (row: T) => React.ReactNode

  sortValue?: (row: T) => string | number

}



export function DataTable<T extends { id: string }>({

  rows,

  columns,

  pageSize = 10,

  emptyLabel = 'No rows',

  rowAction,

}: {

  rows: T[]

  columns: Column<T>[]

  pageSize?: number

  emptyLabel?: string

  rowAction?: (row: T) => { href: string; label: string }

}) {

  const [sortKey, setSortKey] = useState<string | null>(null)

  const [dir, setDir] = useState<'asc' | 'desc'>('asc')



  const sorted = useMemo(() => {

    if (!sortKey) return rows

    const col = columns.find((c) => c.key === sortKey)

    if (!col?.sortValue) return rows

    const copy = [...rows]

    copy.sort((a, b) => {

      const av = col.sortValue!(a)

      const bv = col.sortValue!(b)

      if (av < bv) return dir === 'asc' ? -1 : 1

      if (av > bv) return dir === 'asc' ? 1 : -1

      return 0

    })

    return copy

  }, [rows, sortKey, dir, columns])



  const pagination = usePagination(sorted, pageSize)



  if (rows.length === 0) {

    return <p className="px-4 py-10 text-center text-sm text-muted-foreground">{emptyLabel}</p>

  }



  return (

    <div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-[720px] text-left text-sm">

          <thead>

            <tr className="border-b border-border bg-[var(--kd-background)] text-xs text-muted-foreground">

              {columns.map((col) => (

                <th key={col.key} className={`px-4 py-3 font-medium ${col.align === 'right' ? 'text-right' : ''}`}>

                  {col.sortable ? (

                    <button

                      type="button"

                      className="hover:text-foreground"

                      onClick={() => {

                        if (sortKey === col.key) setDir(dir === 'asc' ? 'desc' : 'asc')

                        else {

                          setSortKey(col.key)

                          setDir('asc')

                        }

                      }}

                    >

                      {col.header}

                      {sortKey === col.key ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}

                    </button>

                  ) : (

                    col.header

                  )}

                </th>

              ))}

              {rowAction && <th className="px-4 py-3 text-right font-medium">Action</th>}

            </tr>

          </thead>

          <tbody>

            {pagination.pageItems.map((row) => (

              <tr key={row.id} className="border-b border-border last:border-0 transition-colors hover:bg-[var(--kd-accent-soft)]">

                {columns.map((col) => (

                  <td key={col.key} className={`px-4 py-3 text-foreground ${col.align === 'right' ? 'text-right tabular-nums' : ''}`}>

                    {col.render(row)}

                  </td>

                ))}

                {rowAction && (

                  <td className="px-4 py-3 text-right">

                    <Link

                      href={rowAction(row).href}

                      className="text-sm font-medium text-accent hover:underline"

                    >

                      {rowAction(row).label}

                    </Link>

                  </td>

                )}

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <Pagination

        page={pagination.page}

        totalPages={pagination.totalPages}

        totalItems={pagination.totalItems}

        from={pagination.from}

        to={pagination.to}

        pageSize={pagination.pageSize}

        onPageChange={pagination.setPage}

        onPageSizeChange={pagination.setPageSize}

      />

    </div>

  )

}

