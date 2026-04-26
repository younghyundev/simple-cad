export type CadFileType = 'json' | 'dxf' | 'dwg' | 'svg';

export type CadConversionMode = 'client' | 'server' | 'mock';

export type CadPoint = {
  x: number;
  y: number;
};

export type CadLayer = {
  id: string;
  name: string;
  color: string;
  visible: boolean;
  locked: boolean;
};

export type CadEntityBase = {
  id: string;
  layerId: string;
  rotation: number;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle?: 'solid' | 'dashed';
  visible: boolean;
  locked: boolean;
};

export type LineEntity = CadEntityBase & {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type RectEntity = CadEntityBase & {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CircleEntity = CadEntityBase & {
  type: 'circle';
  cx: number;
  cy: number;
  radius: number;
};

export type ArcEntity = CadEntityBase & {
  type: 'arc';
  cx: number;
  cy: number;
  radius: number;
  startAngle: number;
  endAngle: number;
};

export type PolylineEntity = CadEntityBase & {
  type: 'polyline';
  points: CadPoint[];
};

export type EllipseEntity = CadEntityBase & {
  type: 'ellipse';
  cx: number;
  cy: number;
  majorAxis: CadPoint;
  ratio: number;
  startParam: number;
  endParam: number;
};

export type SplineEntity = CadEntityBase & {
  type: 'spline';
  degree: number;
  controlPoints: CadPoint[];
  fitPoints?: CadPoint[];
  knots?: number[];
  weights?: number[];
  closed?: boolean;
};

export type HatchEntity = CadEntityBase & {
  type: 'hatch';
  boundary: CadPoint[][];
  fillKind: 'solid' | 'pattern' | 'gradient' | 'unsupported';
  patternName?: string;
  patternScale?: number;
  patternAngle?: number;
};

export type TextEntity = CadEntityBase & {
  type: 'text';
  x: number;
  y: number;
  content: string;
  fontSize: number;
};

export type DimensionEntity = CadEntityBase & {
  type: 'dimension';
  startPoint: CadPoint;
  endPoint: CadPoint;
  label: string;
  labelMode?: 'auto' | 'manual';
  labelOffset?: number;
};

export type GroupEntity = CadEntityBase & {
  type: 'group';
  name?: string;
  children: CadEntity[];
};

export type CadEntity =
  | LineEntity
  | RectEntity
  | CircleEntity
  | ArcEntity
  | PolylineEntity
  | EllipseEntity
  | SplineEntity
  | HatchEntity
  | TextEntity
  | DimensionEntity
  | GroupEntity;

export type UnsupportedCadEntity = {
  sourceType: string;
  reason: string;
  raw?: unknown;
};

export type CadWarning = {
  code: string;
  message: string;
  entityId?: string;
  severity?: 'info' | 'warning' | 'error';
  category?: 'preserved' | 'approximated' | 'unsupported' | 'conversion' | 'mock';
  sourceType?: string;
  details?: Record<string, string | number | boolean | null>;
};

export type CadDocumentExtents = {
  min: CadPoint;
  max: CadPoint;
};

export type CadDrawingSpaceSummary = {
  model: number;
  paper: number;
};

export type CadDocumentMetadata = {
  dxfVersion?: string;
  insUnits?: string;
  measurement?: 'metric' | 'imperial' | 'unknown';
  extents?: CadDocumentExtents;
  spaces?: CadDrawingSpaceSummary;
};

export type CadDocument = {
  id: string;
  name: string;
  sourceFile?: {
    name: string;
    type: CadFileType;
    lastSavedAt?: string;
    fileHandleAvailable?: boolean;
    conversionMode?: CadConversionMode;
  };
  conversionMode?: CadConversionMode;
  units: 'mm' | 'cm' | 'm' | 'inch';
  metadata?: CadDocumentMetadata;
  layers: CadLayer[];
  entities: CadEntity[];
  unsupportedEntities?: UnsupportedCadEntity[];
  importWarnings?: CadWarning[];
};

export type Viewport = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export type ToolId =
  | 'select'
  | 'pan'
  | 'line'
  | 'rect'
  | 'circle'
  | 'polyline'
  | 'text'
  | 'dimension'
  | 'erase';
