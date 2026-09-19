import { useMemo } from 'react';
import { useChartStore } from '../store/chartStore';
import { calcYarnUsage } from '../utils/yarnCalc';
import { findDuplicateYarnCodes, normalizeYarnCode } from '../utils/palette';

export default function LegendPanel() {
  const chart = useChartStore((s) => s.getCurrentChart());
  const usage = useMemo(() => (chart ? calcYarnUsage(chart) : []), [chart]);
  const duplicateCodes = useMemo(
    () => (chart ? findDuplicateYarnCodes(chart.palette) : new Set<string>()),
    [chart]
  );

  if (!chart) return null;

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #e0dcd5' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>图例与用量</h3>
      {duplicateCodes.size > 0 && (
        <div
          style={{
            fontSize: 11,
            color: '#c0392b',
            background: '#fdedec',
            border: '1px solid #f5b7b1',
            borderRadius: 4,
            padding: '4px 6px',
            marginBottom: 8,
          }}
        >
          ⚠ 线号 {[...duplicateCodes].join('、')} 被多个颜色使用
        </div>
      )}
      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #e0dcd5' }}>
            <th style={{ textAlign: 'left', padding: '2px 4px' }}>色</th>
            <th style={{ textAlign: 'left', padding: '2px 4px' }}>名称</th>
            <th style={{ textAlign: 'left', padding: '2px 4px' }}>线号</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>格数</th>
            <th style={{ textAlign: 'right', padding: '2px 4px' }}>%</th>
          </tr>
        </thead>
        <tbody>
          {usage.map((u) => {
            const code = normalizeYarnCode(u.yarnCode);
            const isDuplicate = code !== '' && duplicateCodes.has(code);
            return (
              <LegendRows key={u.paletteId} u={u} code={code} isDuplicate={isDuplicate} />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function LegendRows({
  u,
  code,
  isDuplicate,
}: {
  u: ReturnType<typeof calcYarnUsage>[number];
  code: string;
  isDuplicate: boolean;
}) {
  return (
    <>
      <tr style={{ borderBottom: 'none' }}>
        <td style={{ padding: '2px 4px' }}>
          <div style={{ width: 14, height: 14, background: u.hex, border: '1px solid #ddd', borderRadius: 2 }} />
        </td>
        <td style={{ padding: '2px 4px' }}>{u.colorName}</td>
        <td style={{ padding: '2px 4px' }}>
          {code ? (
            <span>
              {u.yarnCode!.trim()}
              {isDuplicate && (
                <span style={{ color: '#c0392b' }} title="线号与其他颜色重复"> ⚠</span>
              )}
            </span>
          ) : (
            <span
              style={{
                color: '#e67e22',
                background: '#fdf2e9',
                border: '1px solid #f5cba7',
                borderRadius: 3,
                padding: '0 3px',
                fontSize: 10,
                whiteSpace: 'nowrap',
              }}
            >
              缺线号
            </span>
          )}
        </td>
        <td style={{ textAlign: 'right', padding: '2px 4px' }}>{u.cells}</td>
        <td style={{ textAlign: 'right', padding: '2px 4px' }}>{u.percentage}%</td>
      </tr>
      <tr style={{ borderBottom: '1px solid #f0eeea' }}>
        <td colSpan={5} style={{ padding: '0 4px 4px', fontSize: 10, color: '#777' }}>
          缸号 {u.dyeLot?.trim() || '—'} · 品牌 {u.brand?.trim() || '—'} · 剩 {u.skeinsOnHand ?? 0} 团
        </td>
      </tr>
    </>
  );
}
