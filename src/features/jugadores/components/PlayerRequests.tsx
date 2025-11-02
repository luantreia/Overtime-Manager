import React from 'react';
import { useAuth } from '../../../app/providers/AuthContext';
import type { SolicitudJugador } from '../../../types';

interface Props {
  solicitudes?: SolicitudJugador[];
  onCancelar?: (id: string) => void;
  onAceptar?: (id: string) => void;
  onRechazar?: (id: string) => void;
}

const PlayerRequests: React.FC<Props> = ({ solicitudes = [], onCancelar, onAceptar, onRechazar }) => {
  const { user } = useAuth();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Solicitudes</h3>
        <p className="text-sm text-slate-500">Solicitudes de unión/invitación relacionadas con este jugador.</p>
      </header>

      {solicitudes.length === 0 ? (
        <p className="text-sm text-slate-500">No hay solicitudes relacionadas.</p>
      ) : (
        <ul className="space-y-3">
          {solicitudes.map((s) => {
            const uid = user?.id;
            const isAdminGlobal = user?.rol === 'admin';
            const isSolicitante = s.solicitadoPor ? s.solicitadoPor === uid : false;
            const isJugadorAdmin = !!(s.jugador?.creadoPor === uid || s.jugador?.administradores?.includes(uid || ''));
            const isEquipoAdmin = !!(s.equipo?.creadoPor === uid || s.equipo?.administradores?.includes(uid || ''));

            const showCancel = (s.origen === 'jugador' && (isSolicitante || isJugadorAdmin || isAdminGlobal)) || (s.origen === 'equipo' && (isEquipoAdmin || isAdminGlobal));
            const showAcceptReject = (s.origen === 'jugador' && (isEquipoAdmin || isAdminGlobal)) || (s.origen === 'equipo' && (isJugadorAdmin || isAdminGlobal));

            return (
              <li key={s.id} className="flex items-start justify-between">
                <div className="text-sm">
                  <div className="font-medium text-slate-900">{s.jugador.nombre}</div>
                  <div className="text-xs text-slate-500">Origen: {s.origen ?? '—'}</div>
                  {s.equipo ? <div className="text-xs text-slate-500">Equipo: {s.equipo.nombre}</div> : null}
                  {s.fechaInicio ? <div className="text-xs text-slate-500">Desde: {new Date(s.fechaInicio).toLocaleDateString()}</div> : null}
                  {s.fechaFin ? <div className="text-xs text-slate-500">Hasta: {new Date(s.fechaFin).toLocaleDateString()}</div> : null}
                  {s.fechaSolicitud ? <div className="text-xs text-slate-400">Solicitada: {new Date(s.fechaSolicitud).toLocaleString()}</div> : null}
                </div>
                <div className="flex gap-2">
                  {showCancel ? (
                    <button onClick={() => onCancelar?.(s.id)} className="text-sm text-rose-600">
                      Cancelar
                    </button>
                  ) : null}

                  {showAcceptReject ? (
                    <>
                      <button onClick={() => onAceptar?.(s.id)} className="text-sm text-emerald-600">
                        Aceptar
                      </button>
                      <button onClick={() => onRechazar?.(s.id)} className="text-sm text-rose-600">
                        Rechazar
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default PlayerRequests;
