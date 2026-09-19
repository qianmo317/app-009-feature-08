export type Palette = {
  id: string;
  name: string;
  hex: string;
  yarnCode?: string; // 线号
  dyeLot?: string; // 缸号
  brand?: string; // 品牌
  skeinsOnHand?: number; // 手头还剩几团
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
  yarnCode?: string;
  dyeLot?: string;
  brand?: string;
  skeinsOnHand?: number;
  cells: number;
  percentage: number;
  meters: number;
  skeins: number;
};
