import React, { useEffect, useState } from 'react';
import ModalBase from '../../../../shared/components/ModalBase/ModalBase';
import { obtenerOpcionesEquipos, getEquipo } from '../../../equipo/services/equipoService';
import { obtenerOpcionesEquiposParaJugador } from '../../services/jugadorEquipoService';
import type { EquipoOpcion } from '../../../equipo/services/equipoService';

type Props = {
  jugadorId: string;
  initialEquipoId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { jugadorId: string; equipoId: string; fechaInicio?: string; fechaFin?: string }) => Promise<void>;
};

const ModalSolicitarIngreso: React.FC<Props> = ({ jugadorId, initialEquipoId, isOpen, onClose, onSubmit }) => {
  const [query, setQuery] = useState('');
  const [opciones, setOpciones] = useState<EquipoOpcion[]>([]);
  const [selectedEquipo, setSelectedEquipo] = useState<string | undefined>(initialEquipoId);
  // removed role capture per request
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setOpciones([]);
    setSelectedEquipo(initialEquipoId);

    // preload options so the select shows something immediately
    void (async () => {
      try {
        // prefer jugador-scoped opciones if we have a jugadorId (more accurate availability)
        const opts = jugadorId ? await obtenerOpcionesEquiposParaJugador(jugadorId, '') : await obtenerOpcionesEquipos('', undefined);
        setOpciones(opts || []);
        setError(null);
      } catch (err) {
        setError('No se pudieron cargar las opciones de equipos');
      }
    })();

    // if there's an initial equipo id, fetch its data and ensure it's in opciones
    if (initialEquipoId) {
      void (async () => {
        try {
          const e = await getEquipo(initialEquipoId);
          setOpciones((prev) => {
            if (prev.find((p) => p.id === e.id)) return prev;
            return [{ id: e.id, nombre: e.nombre, escudo: e.logoUrl }, ...prev];
          });
        } catch (err) {
          // ignore
        }
      })();
    }
  }, [isOpen, initialEquipoId]);

  const buscar = async (term: string) => {
    setLoading(true);
    try {
      const opts = jugadorId ? await obtenerOpcionesEquiposParaJugador(jugadorId, term) : await obtenerOpcionesEquipos(term, undefined);
      setOpciones(opts || []);
      setError(null);
    } catch (err) {
      setOpciones([]);
      setError('No autorizado o error buscando equipos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handle = setTimeout(() => {
      void buscar(query.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [query, isOpen]);

  const handleSubmit = async () => {
    if (!selectedEquipo) return;
    setSubmitting(true);
    try {
      await onSubmit({ jugadorId, equipoId: selectedEquipo, fechaInicio: fechaInicio || undefined, fechaFin: fechaFin || undefined });
      onClose();
    } catch (err) {
      // onSubmit is expected to show toasts
      console.error('Error enviando solicitud', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Solicitar ingreso a equipo" size="md">
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Buscar equipo</label>
          <div className="mt-2 flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribí el nombre del equipo..."
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void buscar(query.trim())}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white"
            >
              Buscar
            </button>
          </div>
          <div className="mt-2">
            <select
              value={selectedEquipo ?? ''}
              onChange={(e) => setSelectedEquipo(e.target.value ?? undefined)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccioná un equipo…</option>
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </select>
            {loading && <div className="mt-1 text-xs text-slate-500">Buscando…</div>}
            {!loading && opciones.length === 0 && !error && <div className="mt-1 text-xs text-slate-500">No hay resultados</div>}
            {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Desde (opcional)</label>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Hasta (opcional)</label>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300" />
          </div>
        </div>

        {/* role capture removed per request */}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancelar</button>
          <button type="button" onClick={handleSubmit} disabled={!selectedEquipo || submitting} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            {submitting ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export default ModalSolicitarIngreso;
