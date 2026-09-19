import type { Chart } from '../types';
import { calcYarnUsage } from './yarnCalc';
import { findDuplicateYarnCodes, normalizeYarnCode } from './palette';

export function drawChartToCanvas(
  chart: Chart,
  canvas: HTMLCanvasElement,
  options?: { showGrid?: boolean; cellSize?: number; startRow?: number; endRow?: number }
) {
  const { cols, rows, palette, cells } = chart;
  const cellSize = options?.cellSize ?? 20;
  const showGrid = options?.showGrid ?? true;
  const startRow = options?.startRow ?? 0;
  const endRow = options?.endRow ?? rows;
  const visibleRows = endRow - startRow;

  canvas.width = cols * cellSize;
  canvas.height = visibleRows * cellSize;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Cells
  for (let r = startRow; r < endRow; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = cells[r * cols + c];
      const color = palette[idx]?.hex ?? '#ffffff';
      ctx.fillStyle = color;
      ctx.fillRect(c * cellSize, (r - startRow) * cellSize, cellSize, cellSize);
    }
  }

  // Grid
  if (showGrid) {
    ctx.strokeStyle = '#e0dcd5';
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= visibleRows; r++) {
      const y = r * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c++) {
      const x = c * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Bold lines every 10
    ctx.strokeStyle = '#c0bab0';
    ctx.lineWidth = 1;
    for (let r = 0; r <= visibleRows; r += 10) {
      const y = r * cellSize;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    for (let c = 0; c <= cols; c += 10) {
      const x = c * cellSize;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
  }
}

export function exportChartPNG(chart: Chart, scale = 8): Promise<Blob> {
  const cellSize = 20 * scale;
  const chartCanvas = document.createElement('canvas');
  drawChartToCanvas(chart, chartCanvas, { showGrid: true, cellSize });

  // 图例区域：色块 + 名称 + 线号/缸号/品牌/剩团 + 格数占比，随线号修改实时变化
  const usage = calcYarnUsage(chart);
  const duplicateCodes = findDuplicateYarnCodes(chart.palette);

  const chartWidth = chartCanvas.width;
  const fontSize = Math.max(16, Math.min(Math.round(cellSize * 0.75), Math.floor(chartWidth / 38)));
  const pad = Math.round(fontSize * 0.8);
  const rowHeight = Math.round(fontSize * 1.9);
  const headerHeight = Math.round(fontSize * 2.2);
  const legendHeight = headerHeight + usage.length * rowHeight + pad;

  const canvas = document.createElement('canvas');
  canvas.width = chartWidth;
  canvas.height = chartCanvas.height + legendHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#faf8f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(chartCanvas, 0, 0);

  const top = chartCanvas.height;
  ctx.textBaseline = 'middle';

  // 标题行
  ctx.fillStyle = '#333';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(`${chart.title} · 图例`, pad, top + headerHeight / 2);

  // 图例行
  ctx.font = `${fontSize}px sans-serif`;
  usage.forEach((u, i) => {
    const y = top + headerHeight + i * rowHeight + rowHeight / 2;
    const swatch = Math.round(fontSize * 1.1);
    let x = pad;

    ctx.fillStyle = u.hex;
    ctx.fillRect(x, y - swatch / 2, swatch, swatch);
    ctx.strokeStyle = '#999';
    ctx.lineWidth = Math.max(1, Math.round(fontSize / 16));
    ctx.strokeRect(x, y - swatch / 2, swatch, swatch);
    x += swatch + Math.round(fontSize * 0.5);

    const code = normalizeYarnCode(u.yarnCode);
    const segments: { text: string; color: string }[] = [
      { text: `${i + 1}. ${u.colorName}  `, color: '#333' },
      code
        ? { text: `线号 ${u.yarnCode!.trim()}${duplicateCodes.has(code) ? '（重复）' : ''}  `, color: duplicateCodes.has(code) ? '#c0392b' : '#333' }
        : { text: '缺线号  ', color: '#e67e22' },
      { text: `缸号 ${u.dyeLot?.trim() || '—'}  `, color: '#555' },
      { text: `品牌 ${u.brand?.trim() || '—'}  `, color: '#555' },
      { text: `剩 ${u.skeinsOnHand ?? 0} 团  `, color: '#555' },
      { text: `${u.cells} 格 · ${u.percentage}%`, color: '#555' },
    ];
    for (const seg of segments) {
      ctx.fillStyle = seg.color;
      ctx.fillText(seg.text, x, y);
      x += ctx.measureText(seg.text).width;
    }
  });

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
