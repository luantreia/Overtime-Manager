import { useEffect, useMemo, useState } from 'react';
import EntrenamientoRespuestaCard from '../components/EntrenamientoRespuestaCard';
import { getMisEntrenamientos, type MiEntrenamiento } from '../services/entrenamientoService';

const EntrenamientosPage = () => {
  const [items, setItems] = useState<MiEntrenamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMisEntrenamientos()
      .then(setItems)
      .catch((e) => setError(e?.message || 'No pudimos cargar tus entrenamientos'))
      .finally(() => setLoading(false));
  }, []);

  const { proximos, pasados } = useMemo(() => {
    const ahora = Date.now();
    const prox = items.filter((e) => new Date(e.fecha).getTime() >= ahora);
    const pas = items.filter((e) => new Date(e.fecha).getTime() < ahora).reverse();
    return { proximos: prox, pasados: pas };
  }, [items]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Entrenamientos</h1>
        <p className="text-sm text-slate-500">Avisale a tu DT si vas, y mirá cómo te marcaron la asistencia.</p>
      </header>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200" />
          ))}
        </div>
      ) : error ? (
        <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Próximos</h2>
            {proximos.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
                Tu equipo no tiene entrenamientos programados.
              </div>
            ) : (
              proximos.map((e) => <EntrenamientoRespuestaCard key={e._id} entrenamiento={e} />)
            )}
          </section>

          {pasados.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Últimos 30 días</h2>
              {pasados.map((e) => (
                <EntrenamientoRespuestaCard key={e._id} entrenamiento={e} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default EntrenamientosPage;
