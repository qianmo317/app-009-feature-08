import { useState } from 'react';
import { useChartStore } from '../store/chartStore';
import type { Palette } from '../types';
import { normalizeYarnCode, isYarnCodeDuplicate, countMissingYarnCodes } from '../utils/palette';

const inputStyle: React.CSSProperties = {
  width: '100%',
  fontSize: 11,
  padding: '3px 6px',
  border: '1px solid #ddd',
  borderRadius: 4,
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#666',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

export default function PalettePanel() {
  const chart = useChartStore((s) => s.getCurrentChart());
  const updateChart = useChartStore((s) => s.updateChart);
  const selectedColorIndex = useChartStore((s) => s.selectedColorIndex);
  const setSelectedColorIndex = useChartStore((s) => s.setSelectedColorIndex);
  const [newColor, setNewColor] = useState('#3498db');
  const [newName, setNewName] = useState('');

  if (!chart) return null;

  // 删除/图片导入后调色板可能变短，把选中下标夹回有效范围
  const selectedIndex = Math.min(selectedColorIndex, chart.palette.length - 1);
  const selected = chart.palette[selectedIndex];
  const missingCount = countMissingYarnCodes(chart.palette);

  const addColor = () => {
    const name = newName.trim() || `颜色 ${chart.palette.length + 1}`;
    updateChart(chart.id, (c) => ({
      ...c,
      palette: [...c.palette, { id: Math.random().toString(36).slice(2), name, hex: newColor }],
    }));
    setNewName('');
  };

  /** 局部更新选中颜色（线号等字段直接挂在颜色对象上，随颜色一起增删） */
  const patchSelected = (patch: Partial<Palette>) => {
    updateChart(chart.id, (c) => ({
      ...c,
      palette: c.palette.map((p, i) => (i === selectedIndex ? { ...p, ...patch } : p)),
    }));
  };

  const removeColor = (index: number) => {
    if (chart.palette.length <= 1) return;
    updateChart(chart.id, (c) => {
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

  return (
    <div style={{ padding: 12, borderBottom: '1px solid #e0dcd5' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>
        调色板
        {missingCount > 0 && (
          <span style={{ marginLeft: 6, fontSize: 10, color: '#c0392b', fontWeight: 400 }}>
            {missingCount} 个颜色缺线号
          </span>
        )}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto' }}>
        {chart.palette.map((p, i) => {
          const missing = !normalizeYarnCode(p.yarnCode);
          const duplicated = isYarnCodeDuplicate(chart.palette, i);
          return (
            <div
              key={p.id}
              onClick={() => setSelectedColorIndex(i)}
              title={missing ? '未填写线号' : duplicated ? '该线号也填给了另一个颜色' : p.yarnCode}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 6px',
                borderRadius: 4,
                border: selectedIndex === i ? '2px solid #3498db' : '1px solid transparent',
                background: selectedIndex === i ? '#eef6fc' : '#fff',
                cursor: 'pointer',
              }}
            >
              <div style={{ width: 20, height: 20, borderRadius: 4, background: p.hex, border: '1px solid #ddd', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {i + 1}. {p.name}
                {p.yarnCode?.trim() ? (
                  <span style={{ color: duplicated ? '#d35400' : '#888', marginLeft: 4 }}>
                    [{p.yarnCode.trim()}]
                  </span>
                ) : (
                  <span style={{ color: '#c0392b', marginLeft: 4, fontSize: 10 }}>缺线号</span>
                )}
                {duplicated && <span style={{ color: '#d35400', marginLeft: 4, fontSize: 10 }}>⚠重复</span>}
              </span>
              <button onClick={(e) => { e.stopPropagation(); moveColor(i, -1); }} style={{ fontSize: 10, padding: '0 4px' }}>↑</button>
              <button onClick={(e) => { e.stopPropagation(); moveColor(i, 1); }} style={{ fontSize: 10, padding: '0 4px' }}>↓</button>
              <button onClick={(e) => { e.stopPropagation(); removeColor(i); }} style={{ fontSize: 10, padding: '0 4px', color: '#c0392b' }}>×</button>
            </div>
          );
        })}
      </div>

      {selected && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            border: '1px solid #e0dcd5',
            borderRadius: 4,
            background: '#faf8f5',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 2, background: selected.hex, border: '1px solid #ddd' }} />
            编辑 #{selectedIndex + 1}
          </div>
          <label style={labelStyle}>
            颜色名称
            <input style={inputStyle} value={selected.name} onChange={(e) => patchSelected({ name: e.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              线号{!normalizeYarnCode(selected.yarnCode) && <span style={{ color: '#c0392b' }}>（必填）</span>}
              <input
                style={{ ...inputStyle, borderColor: isYarnCodeDuplicate(chart.palette, selectedIndex) ? '#d35400' : '#ddd' }}
                value={selected.yarnCode ?? ''}
                placeholder="如 310 / 826"
                onChange={(e) => patchSelected({ yarnCode: e.target.value })}
              />
            </label>
            <label style={{ ...labelStyle, flex: 1 }}>
              缸号
              <input
                style={inputStyle}
                value={selected.dyeLot ?? ''}
                placeholder="染色批号"
                onChange={(e) => patchSelected({ dyeLot: e.target.value })}
              />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <label style={{ ...labelStyle, flex: 1 }}>
              品牌
              <input
                style={inputStyle}
                value={selected.brand ?? ''}
                placeholder="如 DMC"
                onChange={(e) => patchSelected({ brand: e.target.value })}
              />
            </label>
            <label style={{ ...labelStyle, width: 70 }}>
              剩余团数
              <input
                style={inputStyle}
                type="number"
                min={0}
                step={1}
                value={selected.stockSkeins ?? ''}
                placeholder="0"
                onChange={(e) => {
                  const v = e.target.value;
                  patchSelected({ stockSkeins: v === '' ? undefined : Math.max(0, Number(v)) });
                }}
              />
            </label>
          </div>
          {isYarnCodeDuplicate(chart.palette, selectedIndex) && (
            <div style={{ fontSize: 10, color: '#d35400', background: '#fdf1e7', border: '1px solid #f0d9c0', borderRadius: 3, padding: '3px 6px' }}>
              ⚠ 线号「{selected.yarnCode?.trim()}」已填给另一个颜色，拿线时请核对颜色。
            </div>
          )}
        </div>
      )}

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
