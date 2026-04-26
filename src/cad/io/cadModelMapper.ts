import type { CadEntity, UnsupportedCadEntity } from '../types';

export type ExternalCadEntity = {
  sourceType: string;
  payload: unknown;
};

export function mapExternalEntity(entity: ExternalCadEntity): CadEntity | UnsupportedCadEntity {
  return {
    sourceType: entity.sourceType,
    reason: 'No mapper registered for this CAD entity type.',
    raw: entity.payload,
  };
}
