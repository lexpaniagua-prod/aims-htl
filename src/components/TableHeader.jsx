import { useState } from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import './TableHeader.css'

export default function TableHeader({ columns, sortKey, sortDir, onSort, filterSlot }) {
  return (
    <div className="table-header-wrap">
      {filterSlot && <div className="table-filter-slot">{filterSlot}</div>}
      <div className="table-head-row">
        {columns.map(col => (
          <div
            key={col.key}
            className={`th${col.sortable ? ' th--sortable' : ''}${sortKey === col.key ? ' th--active' : ''}`}
            style={{ width: col.width, flex: col.flex || 'none' }}
            onClick={() => col.sortable && onSort && onSort(col.key)}
          >
            <span>{col.label}</span>
            {col.sortable && (
              <span className="th-sort-icon">
                {sortKey === col.key
                  ? sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
                  : <ChevronsUpDown size={11} />
                }
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
