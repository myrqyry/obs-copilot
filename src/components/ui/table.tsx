import React from 'react';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ children, className }) => (
  <table className={className}>{children}</table>
);

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className }) => (
  <thead className={className}>{children}</thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ children, className }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ children, className }) => (
  <tr className={className}>{children}</tr>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ children, className }) => (
  <td className={className}>{children}</td>
);

export const TableHeader: React.FC<React.ThHTMLAttributes<HTMLTableHeaderCellElement>> = ({ children, className }) => (
  <th className={className}>{children}</th>
);

export default Table;
