import type { CadPoint, EllipseEntity, SplineEntity } from './types';

export type EllipseSampleArgs = Pick<EllipseEntity, 'cx' | 'cy' | 'majorAxis' | 'ratio' | 'startParam' | 'endParam'>;

export type SplineSampleArgs = Pick<SplineEntity, 'controlPoints' | 'degree'> &
  Partial<Pick<SplineEntity, 'fitPoints' | 'knots' | 'weights'>>;

export function sampleEllipsePoints(args: EllipseSampleArgs): CadPoint[] {
  const center = { x: args.cx, y: args.cy };
  const majorAxis = args.majorAxis;
  const ratio = Number.isFinite(args.ratio) && args.ratio > 0 ? Math.min(args.ratio, 1) : 1;
  const startParameter = Number.isFinite(args.startParam) ? args.startParam : 0;
  const endParameter = Number.isFinite(args.endParam) ? args.endParam : Math.PI * 2;
  const majorLength = Math.hypot(majorAxis.x, majorAxis.y) || 1;
  const majorUnit = {
    x: majorAxis.x / majorLength,
    y: majorAxis.y / majorLength,
  };
  const minorAxis = {
    x: -majorUnit.y * majorLength * ratio,
    y: majorUnit.x * majorLength * ratio,
  };
  const sweep = normalizeSweep(startParameter, endParameter);
  const segments = Math.min(256, Math.max(24, Math.ceil((Math.abs(sweep) / (Math.PI * 2)) * 64)));

  return dedupeCurvePoints(
    Array.from({ length: segments + 1 }, (_, index) => {
      const parameter = startParameter + (sweep * index) / segments;
      return {
        x: center.x + Math.cos(parameter) * majorAxis.x + Math.sin(parameter) * minorAxis.x,
        y: center.y + Math.cos(parameter) * majorAxis.y + Math.sin(parameter) * minorAxis.y,
      };
    }),
  );
}

export function sampleSplinePoints(args: SplineSampleArgs): CadPoint[] {
  const nurbsPoints = splineNurbsPoints(args);
  if (nurbsPoints.length >= 2) return nurbsPoints;

  const fitPoints = finitePoints(args.fitPoints ?? []);
  const controlPoints = finitePoints(args.controlPoints);
  const sourcePoints = fitPoints.length >= 2 ? fitPoints : controlPoints;

  if (sourcePoints.length < 3) return sourcePoints;
  return catmullRomPoints(sourcePoints, 32);
}

export function dedupeCurvePoints(points: CadPoint[]): CadPoint[] {
  return finitePoints(points).filter((point, index, finite) => {
    const previous = finite[index - 1];
    return !previous || Math.hypot(point.x - previous.x, point.y - previous.y) > 0.001;
  });
}

export function curveBounds(points: CadPoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const finite = finitePoints(points);
  if (!finite.length) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return {
    minX: Math.min(...finite.map((point) => point.x)),
    minY: Math.min(...finite.map((point) => point.y)),
    maxX: Math.max(...finite.map((point) => point.x)),
    maxY: Math.max(...finite.map((point) => point.y)),
  };
}

function normalizeSweep(startParameter: number, endParameter: number): number {
  let sweep = endParameter - startParameter;
  if (sweep <= 0) sweep += Math.PI * 2;
  return sweep;
}

function splineNurbsPoints(args: SplineSampleArgs): CadPoint[] {
  const controlPoints = finitePoints(args.controlPoints);
  const degree = Number.isFinite(args.degree) ? Math.max(1, Math.floor(args.degree)) : Math.min(3, controlPoints.length - 1);
  const knots = (args.knots ?? []).filter(Number.isFinite);
  const weights = (args.weights ?? []).filter(Number.isFinite);
  const pointCount = controlPoints.length;

  if (
    pointCount < 2 ||
    degree < 1 ||
    knots.length < pointCount + degree + 1 ||
    !Number.isFinite(knots[degree]) ||
    !Number.isFinite(knots[pointCount])
  ) {
    return [];
  }

  const start = knots[degree];
  const end = knots[pointCount];
  if (start === end) return [];

  const samples = Math.max(96, Math.min(480, pointCount * 48));
  const result: CadPoint[] = [];

  for (let sample = 0; sample <= samples; sample += 1) {
    const u = start + ((end - start) * sample) / samples;
    const point = evaluateRationalBSpline(controlPoints, knots, weights, degree, u, sample === samples);
    if (point) result.push(point);
  }

  return dedupeCurvePoints(result);
}

function evaluateRationalBSpline(
  controlPoints: CadPoint[],
  knots: number[],
  weights: number[],
  degree: number,
  u: number,
  isLastSample: boolean,
): CadPoint | null {
  let weightedX = 0;
  let weightedY = 0;
  let denominator = 0;
  const lastControlIndex = controlPoints.length - 1;

  for (let index = 0; index < controlPoints.length; index += 1) {
    const basis =
      isLastSample && index === lastControlIndex ? 1 : bsplineBasis(index, degree, u, knots);
    if (basis === 0) continue;

    const weight = weights[index] ?? 1;
    const weightedBasis = basis * weight;
    weightedX += controlPoints[index].x * weightedBasis;
    weightedY += controlPoints[index].y * weightedBasis;
    denominator += weightedBasis;
  }

  if (!denominator) return null;
  return { x: weightedX / denominator, y: weightedY / denominator };
}

function bsplineBasis(index: number, degree: number, u: number, knots: number[]): number {
  if (degree === 0) {
    return knots[index] <= u && u < knots[index + 1] ? 1 : 0;
  }

  const leftDenominator = knots[index + degree] - knots[index];
  const rightDenominator = knots[index + degree + 1] - knots[index + 1];
  const left =
    leftDenominator === 0
      ? 0
      : ((u - knots[index]) / leftDenominator) * bsplineBasis(index, degree - 1, u, knots);
  const right =
    rightDenominator === 0
      ? 0
      : ((knots[index + degree + 1] - u) / rightDenominator) *
        bsplineBasis(index + 1, degree - 1, u, knots);

  return left + right;
}

function catmullRomPoints(points: CadPoint[], segmentsPerSpan: number): CadPoint[] {
  const result: CadPoint[] = [points[0]];

  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[Math.max(0, index - 1)];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[Math.min(points.length - 1, index + 2)];
    const spanLength = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const segments = Math.max(8, Math.min(32, Math.ceil(spanLength / 8), segmentsPerSpan));

    for (let step = 1; step <= segments; step += 1) {
      const t = step / segments;
      result.push({
        x: catmullRomValue(p0.x, p1.x, p2.x, p3.x, t),
        y: catmullRomValue(p0.y, p1.y, p2.y, p3.y, t),
      });
    }
  }

  return dedupeCurvePoints(result);
}

function catmullRomValue(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function finitePoints(points: CadPoint[]): CadPoint[] {
  return points.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}
