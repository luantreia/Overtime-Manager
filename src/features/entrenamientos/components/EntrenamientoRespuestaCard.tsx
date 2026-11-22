import { useState } from 'react';
import { CheckIcon, XMarkIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import {
  admiteRespuesta,
  responderEntrenamiento,
  type MiEntrenamiento,
} from '../services/entrenamientoService';
import type { AsistenciaEntrenamientoRespuesta } from '../../../shared/types/modelos.generado';

const TIPO_LABEL: Record<string, string> = {
  general: 'Entrenamiento',
  fisico: 'Físico',
  tactico: 'Táctico',
  tecnico: 'Técnico',
  amistoso_interno: 'Amistoso interno',
  otro: 'Entrenamiento',
};

const ASISTENCIA_LABEL: Record<string, { texto: string; clase: string }> = {
  presente: { texto: 'Presente', clase: 'bg-emerald-100 text-emerald-800' },
  tarde: { texto: 'Llegaste tarde', clase: 'bg-amber-100 text-amber-800' },
  ausente: { texto: 'Ausente', clase: 'bg-red-100 text-red-800' },
  justificado: { texto: 'Justificado', clase: 'bg-slate-100 text-slate-700' },
};

const fechaLarga = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

interface Props {
  entrenamiento: MiEntrenamiento;
  onCambio?: (id: string, respuesta: AsistenciaEntrenamientoRespuesta) => void;
}

/**
 * Una sesión con la pregunta que importa: "¿vas?". Los botones son grandes a propósito (se
 * usa desde el celular, a las apuradas). La respuesta se aplica al toque y se revierte con
 * aviso si el servidor la rechaza: es reversible y no pasa por aprobación, así que esperar
 * el round-trip sólo agregaría fricción.
 */
const EntrenamientoRespuestaCard = ({ entrenamiento: e, onCambio }: Props) => {
  const { addToast } = useToast();
  const [respuesta, setRespuesta] = useState(e.respuesta);
  const [guardando, setGuardando] = useState(false);
  const abierto = admiteRespuesta(e);

  const responder = async (nueva: AsistenciaEntrenamientoRespuesta) => {
    if (guardando || nueva === respuesta) return;
    const anterior = respuesta;
    setRespuesta(nueva);
    setGuardando(true);
    try {
      await responderEntrenamiento(e._id, nueva);
      onCambio?.(e._id, nueva);
    } catch (err: any) {
      setRespuesta(anterior);
      addToast({ type: 'error', message: err?.message || 'No pudimos guardar tu respuesta' });
    } finally {
      setGuardando(false);
    }
  };

  const asistencia = ASISTENCIA_LABEL[e.asistencia];
  const titulo = e.titulo || TIPO_LABEL[e.tipo ?? 'general'] || 'Entrenamiento';

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {e.equipo?.nombre ?? 'Tu equipo'}
          </p>
          <h3 className="mt-0.5 font-semibold text-slate-900">{titulo}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm capitalize text-slate-600">
            <ClockIcon className="h-4 w-4 shrink-0" aria-hidden />
            {fechaLarga(e.fecha)}
          </p>
          {e.lugar && (
            <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
              <MapPinIcon className="h-4 w-4 shrink-0" aria-hidden />
              {e.lugar}
            </p>
          )}
        </div>
        {e.estado === 'cancelado' && (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
            Cancelado
          </span>
        )}
        {e.estado === 'realizado' && asistencia && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${asistencia.clase}`}>
            {asistencia.texto}
          </span>
        )}
      </div>

      {abierto ? (
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="¿Vas a este entrenamiento?">
          <button
            type="button"
            onClick={() => responder('voy')}
            aria-pressed={respuesta === 'voy'}
            disabled={guardando}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
              respuesta === 'voy'
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-emerald-50'
            }`}
          >
            <CheckIcon className="h-5 w-5" aria-hidden /> Voy
          </button>
          <button
            type="button"
            onClick={() => responder('no_voy')}
            aria-pressed={respuesta === 'no_voy'}
            disabled={guardando}
            className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
              respuesta === 'no_voy'
                ? 'border-red-600 bg-red-600 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-red-50'
            }`}
          >
            <XMarkIcon className="h-5 w-5" aria-hidden /> No voy
          </button>
        </div>
      ) : (
        respuesta !== 'sin_respuesta' && (
          <p className="mt-3 text-sm text-slate-500">
            Respondiste: <strong>{respuesta === 'voy' ? 'Voy' : 'No voy'}</strong>
          </p>
        )
      )}
    </article>
  );
};

export default EntrenamientoRespuestaCard;
