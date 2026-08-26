import React from 'react';
import clsx from 'clsx';

export const DataTable = ({ columns = [], data = [], className, noDataMessage = 'No records found.' }) => {
  return (
    <div className={clsx('overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-sm', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                {noDataMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={row.id || rowIndex} className="hover:bg-gray-50">
                {columns.map((column, columnIndex) => (
                  <td key={`${row.id || rowIndex}-${columnIndex}`} className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                    {column.render ? column.render(row) : row[column.accessor] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};