import { authFetch } from '../../../shared/utils/authFetch';
import { isValidObjectId, InvalidObjectIdError } from '../../../shared/utils/validateObjectId';
import type { TemporadaJugador } from '../../../types';

export const getTemporadasDelJugador = (jugadorId: string) =>
  (isValidObjectId(jugadorId)
    ? authFetch<TemporadaJugador[]>(`/jugador-temporada/temporadas-jugador?jugador=${jugadorId}`)
    : Promise.reject(new InvalidObjectIdError('ID inválido (cliente)')));
