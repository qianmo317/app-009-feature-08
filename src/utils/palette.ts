import type { Palette } from '../types';

/** 线号归一化：去空白，统一大写，方便查重 */
export function normalizeYarnCode(code: string | undefined | null): string {
  return (code ?? '').trim().toUpperCase();
}

/** 返回被重复填写的线号集合（归一化后） */
export function getDuplicateYarnCodes(palette: Palette[]): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const p of palette) {
    const code = normalizeYarnCode(p.yarnCode);
    if (!code) continue;
    if (seen.has(code)) duplicates.add(code);
    seen.add(code);
  }
  return duplicates;
}

/** 某个颜色的线号是否与其他颜色重复 */
export function isYarnCodeDuplicate(palette: Palette[], index: number): boolean {
  const code = normalizeYarnCode(palette[index]?.yarnCode);
  if (!code) return false;
  return palette.some((p, i) => i !== index && normalizeYarnCode(p.yarnCode) === code);
}

/** 还没填线号的颜色数量 */
export function countMissingYarnCodes(palette: Palette[]): number {
  return palette.filter((p) => !normalizeYarnCode(p.yarnCode)).length;
}
