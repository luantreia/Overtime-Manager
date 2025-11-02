import { useEffect, useState } from 'react';
import CompetenciaCard from '../../../shared/components/CompetenciaCard';
import { useJugador } from '../../../app/providers/JugadorContext';
import { getParticipaciones, solicitarInscripcion } from '../services/equipoCompetenciaService';
import { getEquiposDelJugador } from '../../jugadores/services/jugadorEquipoService';
import type { EquipoCompetencia, Equipo } from '../../../types';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { Input, Textarea } from '../../../shared/components/ui';

const CompetenciasPage = () => {
  const { addToast } = useToast();
  const { jugadorSeleccionado } = useJugador();
  const [participaciones, setParticipaciones] = useState<EquipoCompetencia[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [loading, setLoading] = useState(false);
  const [inscripcionLoading, setInscripcionLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [competenciaId, setCompetenciaId] = useState('');
  

  useEffect(() => {
    const jugadorId = jugadorSeleccionado?.id;
    if (!jugadorId) {
      setParticipaciones([]);
      setEquipos([]);
      return;
    }

    let isCancelled = false;

    const fetch = async () => {
      try {
        setLoading(true);
        const equiposDelJugador = await getEquiposDelJugador(jugadorId);
        if (isCancelled) return;
        setEquipos(equiposDelJugador);

        // Obtener participaciones por cada equipo y unir
        const partes = await Promise.all(
          equiposDelJugador.map((eq) => getParticipaciones({ equipoId: eq.id }))
        );
        if (isCancelled) return;
        const merged = partes.flat();
        setParticipaciones(merged);
      } catch (error) {
        console.error(error);
        if (!isCancelled) {
          addToast({ type: 'error', title: 'Error', message: 'No pudimos cargar las competencias del jugador.' });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    void fetch();

    return () => {
      isCancelled = true;
    };
  }, [jugadorSeleccionado?.id]);

  const refresh = async () => {
    if (!jugadorSeleccionado) return;
    const equiposDelJugador = await getEquiposDelJugador(jugadorSeleccionado.id);
    setEquipos(equiposDelJugador);
    const partes = await Promise.all(equiposDelJugador.map((eq) => getParticipaciones({ equipoId: eq.id })));
    setParticipaciones(partes.flat());
  };

  const [selectedEquipoId, setSelectedEquipoId] = useState<string>('');

  const handleInscripcion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const equipoIdToUse = selectedEquipoId || equipos[0]?.id;
    if (!equipoIdToUse || !competenciaId) return;

    try {
      setInscripcionLoading(true);
      await solicitarInscripcion({
        equipoId: equipoIdToUse,
        competenciaId,
        mensaje: mensaje || undefined,
      });
      addToast({ type: 'success', title: 'Solicitud enviada', message: 'La inscripción fue enviada correctamente' });
      setCompetenciaId('');
      setMensaje('');
      await refresh();
    } catch (error) {
      console.error(error);
      addToast({ type: 'error', title: 'Error de inscripción', message: 'No pudimos enviar la solicitud' });
    } finally {
      setInscripcionLoading(false);
    }
  };

  if (!jugadorSeleccionado) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-6 py-12 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Seleccioná un jugador</h1>
        <p className="mt-2 text-sm text-slate-500">
          Elegí un jugador para ver las competencias de sus equipos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Competencias</h1>
        <p className="text-sm text-slate-500">
          Visualizá las participaciones actuales y enviá solicitudes de inscripción.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-slate-900">Solicitar inscripción</h2>
        <p className="mt-1 text-sm text-slate-500">Completá los datos de la competencia que deseás solicitar.</p>

        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleInscripcion}>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700">Equipo</label>
            <select
              value={selectedEquipoId}
              onChange={(e) => setSelectedEquipoId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-brand-500 focus:ring-brand-500"
            >
              <option value="">Seleccionar equipo (o se usará el primero)</option>
              {equipos.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1">
            <Input
              id="competenciaId"
              label="ID de competencia"
              value={competenciaId}
              onChange={(event) => setCompetenciaId((event.target as HTMLInputElement).value)}
              required
              placeholder="competencia_123"
            />
          </div>

          <div className="md:col-span-1">
            <Textarea
              id="mensaje"
              label="Mensaje opcional"
              value={mensaje}
              rows={3}
              onChange={(event) => setMensaje((event.target as HTMLTextAreaElement).value)}
              placeholder="Contanos por qué querés sumarte"
            />
          </div>

          <div className="md:col-span-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={inscripcionLoading}
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-400"
            >
              {inscripcionLoading ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando participaciones…</p>
      ) : (
        <section className="grid gap-4 md:grid-cols-2">
          {participaciones.map((participacion) => (
            <CompetenciaCard key={participacion.id} participacion={participacion} />
          ))}
          {participaciones.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              Aún no tenés participaciones registradas.
            </p>
          ) : null}
        </section>
      )}
    </div>
  );
};

export default CompetenciasPage;
