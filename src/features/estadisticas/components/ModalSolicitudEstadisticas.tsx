import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useSolicitudEstadisticas } from '../hooks/useSolicitudEstadisticas';

interface ModalSolicitudEstadisticasProps {
  isOpen: boolean;
  jugadorId: string;
  jugadorNombre?: string;
  onClose: () => void;
}

const ModalSolicitudEstadisticas: React.FC<ModalSolicitudEstadisticasProps> = ({
  isOpen,
  jugadorId,
  jugadorNombre,
  onClose,
}) => {
  const { solicitarRegistro, loading } = useSolicitudEstadisticas();
  const [ataques, setAtaques] = useState('');
  const [defensas, setDefensas] = useState('');
  const [faltas, setFaltas] = useState('');
  const [errores, setErrores] = useState('');
  const [puntosDeOro, setPuntosDeOro] = useState('');
  const [minutosJugados, setMinutosJugados] = useState('');
  const [rol, setRol] = useState<'jugador' | 'shagger'>('jugador');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const success = await solicitarRegistro({
      jugadorId,
      ataques: parseInt(ataques) || 0,
      defensas: parseInt(defensas) || 0,
      faltas: parseInt(faltas) || 0,
      errores: parseInt(errores) || 0,
      puntosDeOro: parseInt(puntosDeOro) || 0,
      minutosJugados: parseInt(minutosJugados) || 0,
      rol,
    });

    if (success) {
      setAtaques('');
      setDefensas('');
      setFaltas('');
      setErrores('');
      setPuntosDeOro('');
      setMinutosJugados('');
      setRol('jugador');
      onClose();
    }
  };

  const handleRolChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setRol(e.target.value as 'jugador' | 'shagger');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Registrar estadísticas</h2>
            <p className="text-sm text-slate-500">
              {jugadorNombre && `Jugador: ${jugadorNombre}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
          >
            Cerrar
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">Ataques</label>
              <input
                type="number"
                value={ataques}
                onChange={(e) => setAtaques(e.target.value)}
                placeholder="0"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Defensas</label>
              <input
                type="number"
                value={defensas}
                onChange={(e) => setDefensas(e.target.value)}
                placeholder="0"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Faltas</label>
              <input
                type="number"
                value={faltas}
                onChange={(e) => setFaltas(e.target.value)}
                placeholder="0"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Errores</label>
              <input
                type="number"
                value={errores}
                onChange={(e) => setErrores(e.target.value)}
                placeholder="0"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Puntos de oro</label>
              <input
                type="number"
                value={puntosDeOro}
                onChange={(e) => setPuntosDeOro(e.target.value)}
                placeholder="0"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Minutos jugados</label>
              <input
                type="number"
                value={minutosJugados}
                onChange={(e) => setMinutosJugados(e.target.value)}
                placeholder="0"
                min="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Rol</label>
            <select
              value={rol}
              onChange={handleRolChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="jugador">Jugador</option>
              <option value="shagger">Shagger</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {loading ? 'Enviando...' : 'Solicitar registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalSolicitudEstadisticas;
