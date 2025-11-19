import React from 'react';
import type { Jugador, Equipo } from '../../../types';


interface Props {
  jugador: Jugador;
  equipos?: Equipo[];
  contratosPorEquipo?: Record<string, any>;
  onEditarContrato?: (equipoId: string) => void;
}

const PlayerTeams: React.FC<Props> = ({ jugador, equipos = [], contratosPorEquipo = {}, onEditarContrato }) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Equipos</h3>
        <p className="text-sm text-slate-500">Equipos en los que participa el jugador y contratos asociados.</p>
      </header>

      {equipos.length === 0 ? (
        <p className="text-sm text-slate-500">No hay equipos asociados a este jugador.</p>
      ) : (
        <ul className="space-y-2 text-sm text-slate-700">
          {equipos.map((eq) => {
            const contrato = contratosPorEquipo?.[eq.id];
            return (
              <li key={eq.id} className="flex items-center justify-between border-b border-slate-100 py-2">
                <div>
                  <div className="font-medium text-slate-900">{eq.nombre}</div>
                  {eq.descripcion ? <div className="text-xs text-slate-500">{eq.descripcion}</div> : null}
                  {contrato ? (
                    <div className="text-xs text-slate-500">Rol: {contrato.rol || 'jugador'}</div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  {contrato && onEditarContrato ? (
                    <button
                      type="button"
                      onClick={() => onEditarContrato(eq.id)}
                      className="text-xs rounded px-2 py-1 bg-brand-50 text-brand-600 border border-brand-100"
                    >
                      Editar contrato
                    </button>
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

export default PlayerTeams;
