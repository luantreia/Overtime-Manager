import { authFetch } from '../../../shared/utils/authFetch';
import { isValidObjectId, InvalidObjectIdError } from '../../../shared/utils/validateObjectId';
import type { EquipoCompetencia, SolicitudCompetencia } from '../../../types';

type EquipoCompetenciaQuery = {
  equipoId: string;
};

type InscripcionPayload = {
  equipoId: string;
  competenciaId: string;
  mensaje?: string;
};

export const getParticipaciones = ({ equipoId }: EquipoCompetenciaQuery) =>
  (isValidObjectId(equipoId)
    ? authFetch<EquipoCompetencia[]>(`/equipos-competencia?equipo=${equipoId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));

export const solicitarInscripcion = (payload: InscripcionPayload) =>
  (!isValidObjectId(payload.equipoId) || !isValidObjectId(payload.competenciaId)
    ? Promise.reject(new InvalidObjectIdError('ID inválido (cliente)'))
    : authFetch<SolicitudCompetencia>('/equipos-competencia', {
        method: 'POST',
        body: payload,
      }));
