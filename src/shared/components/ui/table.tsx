import * as React from 'react'

export const Table = ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table className="min-w-full divide-y divide-gray-200" {...props}>
    {children}
  </table>
)

export const TableHeader = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="bg-muted/10" {...props}>{children}</thead>
)

export const TableBody = ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="bg-card divide-y divide-gray-200" {...props}>{children}</tbody>
)

export const TableRow = ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr {...props}>{children}</tr>
)

export const TableHead = ({ children, ...props }: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider" {...props}>{children}</th>
)

export const TableCell = ({ children, ...props }: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground" {...props}>{children}</td>
)

export default Table
