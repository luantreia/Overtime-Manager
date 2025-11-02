import { useEffect, useState } from 'react';
import EquipoCard from '../../../shared/components/EquipoCard/EquipoCard';
import { useJugador } from '../../../app/providers/JugadorContext';
import { getEquiposDelJugador } from '../../jugadores/services/jugadorEquipoService';
import type { Equipo } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';

const EquipoPage = () => {
  const { addToast } = useToast();
  const { jugadorSeleccionado } = useJugador();
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const jugadorId = jugadorSeleccionado?.id;
    if (!jugadorId) {
      setEquipos([]);
      return;
    }

    const fetchEquipos = async () => {
      try {
        setLoading(true);
        const lista = await getEquiposDelJugador(jugadorId);
        if (isCancelled) return;
        setEquipos(lista);
      } catch (err) {
        console.error(err);
        if (!isCancelled) {
          addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar los equipos del jugador.' });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchEquipos();
    return () => {
      isCancelled = true;
    };
  }, [jugadorSeleccionado?.id, addToast]);

  if (!jugadorSeleccionado) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">No hay jugador seleccionado</h1>
        <p className="mt-2 text-sm text-slate-500">Elegí un jugador desde el selector superior para ver sus equipos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Equipos del jugador</h1>
        <p className="mt-1 text-sm text-slate-500">Lista de equipos y contratos asociados al jugador seleccionado.</p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando equipos…</p>
      ) : equipos.length ? (
        <div className="grid gap-6 md:grid-cols-2">
          {equipos.map((eq) => (
            <EquipoCard key={eq.id} equipo={eq} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
          No se encontraron equipos asociados a este jugador.
        </div>
      )}
    </div>
  );
};

export default EquipoPage;
