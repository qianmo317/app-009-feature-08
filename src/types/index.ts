export type Palette = {
  id: string;
  name: string;
  hex: string;
  /** 线号（色号），如 DMC 310 */
  yarnCode?: string;
  /** 缸号（染色批号） */
  dyeLot?: string;
  /** 毛线品牌 */
  brand?: string;
  /** 手头剩余团数 */
  stockSkeins?: number;
};

export type Chart = {
  id: string;
  title: string;
  cols: number;
  rows: number;
  palette: Palette[];
  cells: Uint16Array;
  gauge: { stsPer10cm: number; rowsPer10cm: number };
  yarn: { gramsPerSkein: number; metersPerSkein: number };
};

export type Tool =
  | 'pencil'
  | 'bucket'
  | 'line'
  | 'rect'
  | 'mirror'
  | 'picker'
  | 'select'
  | 'copy'
  | 'paste';

export type Point = { x: number; y: number };

export type Rect = { x: number; y: number; w: number; h: number };

export type YarnUsage = {
  paletteId: string;
  colorName: string;
  hex: string;
  yarnCode: string;
  dyeLot: string;
  brand: string;
  stockSkeins: number;
  cells: number;
  percentage: number;
  meters: number;
  skeins: number;
};
