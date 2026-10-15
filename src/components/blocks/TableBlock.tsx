import React from 'react';
import type { TableBlock as TableBlockType, TableColumnDef, TableCell } from '../../types';
import InlineText from './InlineText';
import SymbolText from './SymbolText';
import { parseInline } from '../../lib/inline';

const TableBlock: React.FC<{ block: TableBlockType }> = ({ block }) => {
  // Normalize legacy string[] to TableColumnDef[]
  const columns: TableColumnDef[] = block.columns.map((col) =>
    typeof col === 'string' ? { label: col } : col
  );

  const renderCell = (cellData: TableCell | string, colIndex: number) => {
    // Normalize to TableCell
    const cell: TableCell = typeof cellData === 'string' ? { text: cellData } : cellData;
    
    // Auto-infer type if not explicitly set
    let cellType = cell.type;
    if (!cellType) {
      const label = columns[colIndex].label;
      const formatted = parseInline(cell.text).some(token => token.type !== 'text');
      if (!formatted && /^(?:name|symbol|member|parameter|property|method|class|function|identifier|field|option|source|file|path|signature|import)\b/i.test(label)) cellType = 'code';
      else if (/^type\b/i.test(label)) cellType = 'type';
      else cellType = 'text';
    }

    if (cellType === 'code') {
      return <code className="inline"><SymbolText text={cell.text} code /></code>;
    }
    if (cellType === 'type') {
      return <span className="type-cell"><InlineText text={cell.text} /></span>;
    }
    return <InlineText text={cell.text} />;
  };

  return (
    <div className="doc-table-scroll" role="region" aria-label="Documentation table" tabIndex={0}>
    <table className="api-table" style={{ minWidth: columns.length > 2 ? `${Math.max(540, columns.length * 160)}px` : '360px' }}>
      <colgroup>{columns.map((column, index) => <col key={index} style={column.width ? { width: column.width } : undefined} />)}</colgroup>
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} style={col.width ? { width: col.width } : undefined}>
              <InlineText text={col.label} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row, rowIdx) => (
          <tr key={rowIdx} id={row.id}>
            {row.cells.map((cell, colIdx) => (
              <td key={colIdx}>{renderCell(cell, colIdx)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
};

export default TableBlock;
