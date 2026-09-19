import { useMemo } from 'react';
import { useChartStore } from '../store/chartStore';
import { calcYarnUsage } from '../utils/yarnCalc';
import { normalizeYarnCode, getDuplicateYarnCodes, countMissingYarnCodes } from '../utils/palette';

const cellStyle: React.CSSProperties = { padding: '2px 4px', whiteSpace: 'nowrap' };

export default function LegendPanel() {
  const chart = useChartStore((s) => s.getCurrentChart());
  const usage = useMemo(() => (chart ? calcYarnUsage(chart) : []), [chart]);
  const duplicateCodes = useMemo(() => (chart ? getDuplicateYarnCodes(chart.palette) : new Set<string>()), [chart]);
  const missingCount = useMemo(() => (chart ? countMissingYarnCodes(chart.palette) : 0), [chart]);

  if (!chart) return null;

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #e0dcd5' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>
        图例与用量
        {missingCount > 0 && (
          <span style={{ marginLeft: 6, fontSize: 10, color: '#c0392b', fontWeight: 400 }}>
            {missingCount} 项缺线号
          </span>
        )}
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ fontSize: 10, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e0dcd5' }}>
              <th style={cellStyle}>色</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>线号</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>名称</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>品牌</th>
              <th style={{ ...cellStyle, textAlign: 'left' }}>缸号</th>
              <th style={{ ...cellStyle, textAlign: 'right' }}>库存</th>
              <th style={{ ...cellStyle, textAlign: 'right' }}>格数</th>
              <th style={{ ...cellStyle, textAlign: 'right' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {usage.map((u) => {
              const missing = !normalizeYarnCode(u.yarnCode);
              const duplicated = duplicateCodes.has(normalizeYarnCode(u.yarnCode));
              return (
                <tr key={u.paletteId} style={{ borderBottom: '1px solid #f0eeea' }}>
                  <td style={cellStyle}>
                    <div style={{ width: 12, height: 12, background: u.hex, border: '1px solid #ddd', borderRadius: 2 }} />
                  </td>
                  <td
                    title={missing ? '未填写线号，拿线前请先在调色板补齐' : duplicated ? '该线号被多个颜色使用' : undefined}
                    style={{
                      ...cellStyle,
                      fontWeight: 600,
                      color: missing ? '#c0392b' : duplicated ? '#d35400' : '#333',
                    }}
                  >
                    {missing ? '缺线号' : u.yarnCode}
                    {duplicated && <span title="线号重复" style={{ marginLeft: 2 }}>⚠</span>}
                  </td>
                  <td style={cellStyle}>{u.colorName}</td>
                  <td style={{ ...cellStyle, color: '#666' }}>{u.brand || '—'}</td>
                  <td style={{ ...cellStyle, color: '#666' }}>{u.dyeLot || '—'}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{u.stockSkeins || 0}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{u.cells}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{u.percentage}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
