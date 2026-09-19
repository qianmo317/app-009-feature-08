import type { Palette } from '../types';

/** 线号比较时统一口径：去首尾空格、忽略大小写 */
export function normalizeYarnCode(code?: string): string {
  return (code ?? '').trim().toLowerCase();
}

/** 找出被两个及以上颜色使用的线号（空线号不参与） */
export function findDuplicateYarnCodes(palette: Palette[]): Set<string> {
  const counts = new Map<string, number>();
  for (const p of palette) {
    const code = normalizeYarnCode(p.yarnCode);
    if (code) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  const dupes = new Set<string>();
  for (const [code, n] of counts) {
    if (n > 1) dupes.add(code);
  }
  return dupes;
}
