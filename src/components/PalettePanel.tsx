import { useMemo, useState } from 'react';
import { useChartStore } from '../store/chartStore';
import { findDuplicateYarnCodes, normalizeYarnCode } from '../utils/palette';
import type { Palette } from '../types';

export default function PalettePanel() {
  const chart = useChartStore((s) => s.getCurrentChart());
  const updateChart = useChartStore((s) => s.updateChart);
  const selectedColorIndex = useChartStore((s) => s.selectedColorIndex);
  const setSelectedColorIndex = useChartStore((s) => s.setSelectedColorIndex);
  const [newColor, setNewColor] = useState('#3498db');
  const [newName, setNewName] = useState('');

  const duplicateCodes = useMemo(
    () => (chart ? findDuplicateYarnCodes(chart.palette) : new Set<string>()),
    [chart]
  );

  if (!chart) return null;

  const addColor = () => {
    const name = newName.trim() || `颜色 ${chart.palette.length + 1}`;
    updateChart(chart.id, (c) => ({
      ...c,
      palette: [...c.palette, { id: Math.random().toString(36).slice(2), name, hex: newColor }],
    }));
    setNewName('');
  };

  const removeColor = (index: number) => {
    if (chart.palette.length <= 1) return;
    updateChart(chart.id, (c) => {
      // 线号等信息挂在颜色条目上，随条目一起删除，不会留给其他颜色
      const palette = c.palette.filter((_, i) => i !== index);
      const newCells = new Uint16Array(c.cells);
      for (let i = 0; i < newCells.length; i++) {
        if (newCells[i] === index) newCells[i] = 0;
        else if (newCells[i] > index) newCells[i]--;
      }
      return { ...c, palette, cells: newCells };
    });
    if (selectedColorIndex >= index && selectedColorIndex > 0) {
      setSelectedColorIndex(selectedColorIndex - 1);
    }
  };

  const moveColor = (index: number, dir: number) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= chart.palette.length) return;
    updateChart(chart.id, (c) => {
      const palette = [...c.palette];
      [palette[index], palette[newIndex]] = [palette[newIndex], palette[index]];
      const map = new Map(palette.map((p, i) => [p.id, i]));
      const newCells = new Uint16Array(c.cells.length);
      for (let i = 0; i < c.cells.length; i++) {
        const oldIdx = c.cells[i];
        const id = c.palette[oldIdx]?.id;
        newCells[i] = id ? (map.get(id) ?? 0) : 0;
      }
      return { ...c, palette, cells: newCells };
    });
    if (selectedColorIndex === index) setSelectedColorIndex(newIndex);
    else if (selectedColorIndex === newIndex) setSelectedColorIndex(index);
  };

  const updateEntry = (index: number, patch: Partial<Palette>) => {
    updateChart(chart.id, (c) => ({
      ...c,
      palette: c.palette.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    padding: '3px 6px',
    border: '1px solid #ddd',
    borderRadius: 4,
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: '#555',
  };

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #e0dcd5' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>调色板</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflow: 'auto' }}>
        {chart.palette.map((p, i) => {
          const code = normalizeYarnCode(p.yarnCode);
          const isDuplicate = code !== '' && duplicateCodes.has(code);
          const expanded = selectedColorIndex === i;
          return (
            <div
              key={p.id}
              style={{
                borderRadius: 4,
                border: expanded ? '2px solid #3498db' : '1px solid transparent',
                background: expanded ? '#eef6fc' : '#fff',
              }}
            >
              <div
                onClick={() => setSelectedColorIndex(i)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 6px', cursor: 'pointer' }}
              >
                <div style={{ width: 20, height: 20, borderRadius: 4, background: p.hex, border: '1px solid #ddd', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {i + 1}. {p.name}
                  {code && <span style={{ color: '#888', fontSize: 10 }}>（{p.yarnCode!.trim()}）</span>}
                </span>
                {!code && (
                  <span style={{ fontSize: 10, color: '#e67e22', flexShrink: 0 }}>缺线号</span>
                )}
                {isDuplicate && (
                  <span style={{ fontSize: 10, color: '#c0392b', flexShrink: 0 }} title="线号与其他颜色重复">⚠</span>
                )}
                <button onClick={(e) => { e.stopPropagation(); moveColor(i, -1); }} style={{ fontSize: 10, padding: '0 4px' }}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveColor(i, 1); }} style={{ fontSize: 10, padding: '0 4px' }}>↓</button>
                <button onClick={(e) => { e.stopPropagation(); removeColor(i); }} style={{ fontSize: 10, padding: '0 4px', color: '#c0392b' }}>×</button>
              </div>
              {expanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 8px 8px' }}>
                  <label style={labelStyle}>
                    <span style={{ width: 34, flexShrink: 0 }}>线号</span>
                    <input
                      type="text"
                      value={p.yarnCode ?? ''}
                      placeholder="如 A-101"
                      onChange={(e) => updateEntry(i, { yarnCode: e.target.value })}
                      style={{ ...inputStyle, borderColor: isDuplicate ? '#c0392b' : '#ddd' }}
                    />
                  </label>
                  {isDuplicate && (
                    <div style={{ fontSize: 10, color: '#c0392b' }}>
                      ⚠ 线号「{p.yarnCode!.trim()}」也被其他颜色使用，请确认是否不同线
                    </div>
                  )}
                  <label style={labelStyle}>
                    <span style={{ width: 34, flexShrink: 0 }}>缸号</span>
                    <input
                      type="text"
                      value={p.dyeLot ?? ''}
                      placeholder="如 L23"
                      onChange={(e) => updateEntry(i, { dyeLot: e.target.value })}
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    <span style={{ width: 34, flexShrink: 0 }}>品牌</span>
                    <input
                      type="text"
                      value={p.brand ?? ''}
                      placeholder="如 回归线"
                      onChange={(e) => updateEntry(i, { brand: e.target.value })}
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    <span style={{ width: 34, flexShrink: 0 }}>剩团</span>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={p.skeinsOnHand ?? ''}
                      placeholder="0"
                      onChange={(e) =>
                        updateEntry(i, {
                          skeinsOnHand: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
                        })
                      }
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 10, color: '#888', flexShrink: 0 }}>手头剩余</span>
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
        <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: 32, height: 28, padding: 0, border: 'none' }} />
        <input
          type="text"
          placeholder="颜色名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, fontSize: 12, padding: '4px 6px', border: '1px solid #ddd', borderRadius: 4 }}
        />
        <button onClick={addColor} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #3498db', background: '#3498db', color: '#fff', cursor: 'pointer' }}>
          添加
        </button>
      </div>
    </div>
  );
}
