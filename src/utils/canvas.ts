import type { Chart } from '../types';
import { calcYarnUsage } from './yarnCalc';
import { normalizeYarnCode, getDuplicateYarnCodes, countMissingYarnCodes } from './palette';

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

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '…';
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (ctx.measureText(text.slice(0, mid) + ellipsis).width <= maxWidth) lo = mid;
    else hi = mid - 1;
  }
  return text.slice(0, lo) + ellipsis;
}

/**
 * 把图例表（线号 / 名称 / 品牌 / 缸号 / 库存 / 格数 / 占比）画到 ctx 中，
 * 缺线号红色标注、线号重复橙色标注。返回结束 y 坐标。
 */
export function drawLegendToContext(
  ctx: CanvasRenderingContext2D,
  chart: Chart,
  x: number,
  y: number,
  width: number,
  fontScale = 1
): number {
  const usage = calcYarnUsage(chart);
  const duplicateCodes = getDuplicateYarnCodes(chart.palette);
  const missingCount = countMissingYarnCodes(chart.palette);

  const pad = 12 * fontScale;
  const fontSize = 12 * fontScale;
  const smallFont = 10 * fontScale;
  const rowH = 20 * fontScale;
  const swatch = 14 * fontScale;
  const gap = 10 * fontScale;

  ctx.textBaseline = 'middle';

  // 标题
  ctx.fillStyle = '#333';
  ctx.font = `600 ${14 * fontScale}px sans-serif`;
  ctx.fillText('图例与用线', x, y + fontSize / 2);
  if (missingCount > 0) {
    ctx.fillStyle = '#c0392b';
    ctx.font = `${smallFont}px sans-serif`;
    ctx.fillText(`（${missingCount} 项缺线号）`, x + ctx.measureText('图例与用线').width + gap, y + fontSize / 2);
  }
  let cy = y + fontSize + pad;

  // 表头
  ctx.font = `600 ${smallFont}px sans-serif`;
  ctx.fillStyle = '#888';
  const colCode = 90 * fontScale;
  const colBrand = 80 * fontScale;
  const colLot = 70 * fontScale;
  const colStock = 44 * fontScale;
  const colCells = 56 * fontScale;
  const colPct = 48 * fontScale;
  const nameX = x + swatch + gap + colCode + gap;
  const brandX = nameX + 110 * fontScale;
  const lotX = brandX + colBrand + gap;
  const stockX = lotX + colLot + gap;
  const cellsX = stockX + colStock + gap;
  const pctX = cellsX + colCells + gap;

  ctx.fillText('色', x, cy);
  ctx.fillText('线号', x + swatch + gap, cy);
  ctx.fillText('名称', nameX, cy);
  ctx.fillText('品牌', brandX, cy);
  ctx.fillText('缸号', lotX, cy);
  ctx.textAlign = 'right';
  ctx.fillText('库存', stockX + colStock, cy);
  ctx.fillText('格数', cellsX + colCells, cy);
  ctx.fillText('%', pctX + colPct, cy);
  ctx.textAlign = 'left';
  cy += rowH * 0.8;

  ctx.strokeStyle = '#e0dcd5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, cy - rowH * 0.3);
  ctx.lineTo(Math.min(x + width, pctX + colPct), cy - rowH * 0.3);
  ctx.stroke();

  for (const u of usage) {
    const code = normalizeYarnCode(u.yarnCode);
    const missing = !code;
    const duplicated = duplicateCodes.has(code);

    // 色块
    ctx.fillStyle = u.hex;
    ctx.fillRect(x, cy - swatch / 2, swatch, swatch);
    ctx.strokeStyle = '#ddd';
    ctx.strokeRect(x + 0.5, cy - swatch / 2 + 0.5, swatch - 1, swatch - 1);

    // 线号（缺=红，重复=橙+⚠）
    ctx.font = `600 ${fontSize}px sans-serif`;
    if (missing) {
      ctx.fillStyle = '#c0392b';
      ctx.fillText('缺线号', x + swatch + gap, cy);
    } else {
      ctx.fillStyle = duplicated ? '#d35400' : '#333';
      ctx.fillText(fitText(ctx, u.yarnCode, colCode - (duplicated ? 16 : 0) * fontScale), x + swatch + gap, cy);
      if (duplicated) {
        ctx.fillText('⚠', x + swatch + gap + colCode - 14 * fontScale, cy);
      }
    }

    // 名称
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = '#333';
    ctx.fillText(fitText(ctx, u.colorName, 110 * fontScale), nameX, cy);

    // 品牌 / 缸号
    ctx.font = `${smallFont}px sans-serif`;
    ctx.fillStyle = '#666';
    ctx.fillText(fitText(ctx, u.brand || '—', colBrand), brandX, cy);
    ctx.fillText(fitText(ctx, u.dyeLot || '—', colLot), lotX, cy);

    // 库存 / 格数 / 占比
    ctx.textAlign = 'right';
    ctx.fillText(String(u.stockSkeins || 0), stockX + colStock, cy);
    ctx.fillStyle = '#333';
    ctx.fillText(String(u.cells), cellsX + colCells, cy);
    ctx.fillText(`${u.percentage}%`, pctX + colPct, cy);
    ctx.textAlign = 'left';

    cy += rowH;
  }

  return cy + pad;
}

export function exportChartPNG(chart: Chart, scale = 8): Promise<Blob> {
  const cell = scale; // 8x：每格 8px
  const chartW = chart.cols * cell;
  const chartH = chart.rows * cell;
  const margin = 2 * scale;
  const titleH = 5 * scale;
  const legendH =
    6 * scale + // 标题行
    2 * scale +
    chart.palette.length * 20 + 24; // 每行 20px（图例文字保持可读，不随 8x 放大）

  // drawLegendToContext(fontScale=1) 各列到画布左缘约需 572px
  const legendMinW = 572;
  const width = Math.max(chartW + margin * 2, legendMinW + margin * 2);
  const height = margin + titleH + chartH + legendH + margin;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 整图背景
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 标题与摘要
  ctx.fillStyle = '#333';
  ctx.font = `600 ${18}px sans-serif`;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(chart.title, margin, margin + 18);
  ctx.fillStyle = '#888';
  ctx.font = `11px sans-serif`;
  ctx.fillText(
    `${chart.cols}针 × ${chart.rows}行 | 密度 ${chart.gauge.stsPer10cm}针/${chart.gauge.rowsPer10cm}行 (10cm)`,
    margin,
    margin + 36
  );

  // 网格图解
  const gridCanvas = document.createElement('canvas');
  drawChartToCanvas(chart, gridCanvas, { showGrid: true, cellSize: cell });
  ctx.drawImage(gridCanvas, margin, margin + titleH);

  // 图例表（线号改动后直接读 chart.palette，导出与屏幕保持一致）
  drawLegendToContext(ctx, chart, margin, margin + titleH + chartH + scale, width - margin * 2);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
