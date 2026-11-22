import { useCallback, useEffect, useState } from 'react';
import { Button, Overlay } from 'overtime-kit';
import { useToast } from '../../../shared/components/Toast/ToastProvider';
import { formatDate } from '../../../shared/utils/formatDate';
import {
  CAMPOS,
  aportarAlEquipo,
  crearMiPlanilla,
  eliminarMiPlanilla,
  getMisNumeros,
  getPartidosDisponibles,
  guardarMisNumeros,
  mismosTotales,
  retirarAporte,
  type FilaMisNumeros,
  type PartidoRef,
  type Totales,
} from '../services/misNumerosService';

/**
 * "Mis números": tus partidos con las tres versiones que podés ver — lo oficial, lo que
 * cargó tu equipo sobre vos, y lo que cargaste vos — y la opción de ofrecerle tus números
 * al cuerpo técnico.
 *
 * Tus números son tuyos: no cambian nada oficial ni lo que ve nadie más. Sirven para
 * partidos donde nadie cargó estadísticas, y si los aportás, el cuerpo técnico decide si
 * los suma a la planilla del equipo.
 */

interface Props {
  jugadorId: string;
}

const INICIAL: Record<keyof Totales, string> = { throws: 'T', hits: 'H', outs: 'O', catches: 'C' };
const VACIO: Totales = { throws: 0, hits: 0, outs: 0, catches: 0 };

const nombrePartido = (p: PartidoRef): string =>
  `${p.equipoLocal?.nombre ?? 'Local'} vs ${p.equipoVisitante?.nombre ?? 'Visitante'}`;

const Celda = ({ v, distinto }: { v: Totales | null | undefined; distinto?: boolean }) => (
  <td className={`px-3 py-2 text-right text-xs tabular-nums ${distinto ? 'font-semibold text-amber-700' : 'text-slate-600'}`}>
    {v ? CAMPOS.map((c) => `${INICIAL[c]}${v[c]}`).join(' ') : '—'}
  </td>
);

const APORTE_LABEL = {
  pendiente: { texto: 'Esperando al DT', clase: 'bg-amber-100 text-amber-800' },
  aceptado: { texto: 'Aceptado por el DT', clase: 'bg-emerald-100 text-emerald-800' },
  descartado: { texto: 'Descartado por el DT', clase: 'bg-slate-100 text-slate-600' },
} as const;

const SeccionMisNumeros = ({ jugadorId }: Props) => {
  const { addToast } = useToast();
  const [filas, setFilas] = useState<FilaMisNumeros[]>([]);
  const [cargando, setCargando] = useState(false);
  const [editando, setEditando] = useState<{ planillaId: string; partido: PartidoRef; totales: Totales; notas: string } | null>(null);
  const [eligiendoPartido, setEligiendoPartido] = useState(false);
  const [disponibles, setDisponibles] = useState<Array<PartidoRef & { miEquipo: string }>>([]);
  const [ocupado, setOcupado] = useState(false);

  const error = useCallback(
    (e: unknown, fallback: string) =>
      addToast({ type: 'error', title: 'Error', message: e instanceof Error ? e.message : fallback }),
    [addToast],
  );

  const recargar = useCallback(async () => {
    setCargando(true);
    try {
      setFilas(await getMisNumeros(jugadorId));
    } catch (e) {
      error(e, 'No pudimos cargar tus números');
    } finally {
      setCargando(false);
    }
  }, [jugadorId, error]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const abrirElegirPartido = async () => {
    setEligiendoPartido(true);
    try {
      setDisponibles(await getPartidosDisponibles(jugadorId));
    } catch (e) {
      error(e, 'No pudimos cargar tus partidos');
    }
  };

  const empezarEn = async (partido: PartidoRef) => {
    setOcupado(true);
    try {
      const { planillaId } = await crearMiPlanilla(partido._id, jugadorId);
      setEligiendoPartido(false);
      setEditando({ planillaId, partido, totales: { ...VACIO }, notas: '' });
      void recargar();
    } catch (e) {
      error(e, 'No pudimos abrir tu planilla');
    } finally {
      setOcupado(false);
    }
  };

  const guardar = async () => {
    if (!editando) return;
    setOcupado(true);
    try {
      await guardarMisNumeros(editando.planillaId, { ...editando.totales, notas: editando.notas });
      addToast({ type: 'success', title: 'Guardado', message: 'Tus números quedaron guardados.' });
      setEditando(null);
      void recargar();
    } catch (e) {
      error(e, 'No pudimos guardar');
    } finally {
      setOcupado(false);
    }
  };

  const accion = async (fn: () => Promise<unknown>, ok: string) => {
    setOcupado(true);
    try {
      await fn();
      addToast({ type: 'success', title: 'Listo', message: ok });
      void recargar();
    } catch (e) {
      error(e, 'No se pudo completar la acción');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Mis números</h2>
          <p className="text-sm text-slate-500">
            Cargá tus propios números en partidos donde nadie los registró. Son tuyos: no cambian nada oficial.
            Si querés, ofrecéselos al cuerpo técnico de tu equipo.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => void abrirElegirPartido()}>
          Cargar un partido
        </Button>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-3 text-left">Fecha</th>
                <th className="px-3 py-3 text-left">Partido</th>
                <th className="px-3 py-3 text-right">Oficial</th>
                <th className="px-3 py-3 text-right">Planilla del equipo</th>
                <th className="px-3 py-3 text-right">Míos</th>
                <th className="px-3 py-3 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filas.map((f) => {
                const propia = f.propia;
                const ref = f.oficial ?? f.equipo?.totales ?? null;
                const aporte = propia?.aporte ?? null;
                return (
                  <tr key={f.partido._id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2 text-xs">{formatDate(f.partido.fecha)}</td>
                    <td className="px-3 py-2">{nombrePartido(f.partido)}</td>
                    <Celda v={f.oficial} />
                    <Celda v={f.equipo?.totales} distinto={!!f.oficial && !!f.equipo && !mismosTotales(f.oficial, f.equipo.totales)} />
                    <Celda v={propia?.totales} distinto={!!ref && !!propia && !mismosTotales(ref, propia.totales)} />
                    <td className="px-3 py-2 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {aporte && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${APORTE_LABEL[aporte.estado].clase}`}>
                            {APORTE_LABEL[aporte.estado].texto}
                          </span>
                        )}
                        {!propia ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                            disabled={ocupado}
                            onClick={() => void empezarEn(f.partido)}
                          >
                            Cargar los míos
                          </button>
                        ) : aporte?.estado === 'pendiente' ? (
                          <button
                            type="button"
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                            disabled={ocupado}
                            onClick={() => void accion(() => retirarAporte(propia.planillaId), 'Retiraste el aporte.')}
                          >
                            Retirar
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                              disabled={ocupado}
                              onClick={() => setEditando({ planillaId: propia.planillaId, partido: f.partido, totales: { ...propia.totales }, notas: propia.notas })}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                              disabled={ocupado}
                              title="El cuerpo técnico de tu equipo los ve y decide si los suma a la planilla del equipo"
                              onClick={() => void accion(() => aportarAlEquipo(propia.planillaId), 'Le ofreciste tus números al cuerpo técnico.')}
                            >
                              {aporte ? 'Aportar de nuevo' : 'Aportar al equipo'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!cargando && filas.length === 0 && (
          <p className="px-4 py-5 text-sm text-slate-500">
            Todavía no hay números tuyos en ningún partido. Empezá con «Cargar un partido».
          </p>
        )}
        {cargando && <p className="px-4 py-5 text-sm text-slate-500">Cargando…</p>}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        T / H / O / C = throws, hits, outs, catches. En ámbar, lo que no coincide con la versión oficial (o con la del
        equipo, si no hay oficial).
      </p>

      <Overlay
        isOpen={eligiendoPartido}
        onClose={() => setEligiendoPartido(false)}
        size="md"
        title="¿Qué partido querés cargar?"
        subtitle="Partidos de tus equipos, jugados, en los que todavía no cargaste nada."
      >
        {disponibles.length === 0 ? (
          <p className="text-sm text-slate-500">No hay partidos disponibles.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {disponibles.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void empezarEn(p)}
                  className="flex w-full items-center justify-between px-1 py-2.5 text-left text-sm hover:bg-slate-50"
                >
                  <span>{nombrePartido(p)}</span>
                  <span className="text-xs text-slate-400">{formatDate(p.fecha)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Overlay>

      <Overlay
        isOpen={!!editando}
        onClose={() => setEditando(null)}
        size="sm"
        title="Mis números"
        subtitle={editando ? `${nombrePartido(editando.partido)} · ${formatDate(editando.partido.fecha)}` : undefined}
        footer={
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={ocupado}
              onClick={() => {
                if (!editando) return;
                const id = editando.planillaId;
                setEditando(null);
                void accion(() => eliminarMiPlanilla(id), 'Borraste tu planilla de ese partido.');
              }}
            >
              Borrar
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditando(null)}>Cancelar</Button>
              <Button variant="primary" size="sm" loading={ocupado} onClick={() => void guardar()}>Guardar</Button>
            </div>
          </div>
        }
      >
        {editando && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {CAMPOS.map((c) => (
                <label key={c} className="text-sm capitalize text-slate-600">
                  {c}
                  <input
                    type="number"
                    min={0}
                    max={999}
                    inputMode="numeric"
                    className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-right tabular-nums"
                    value={editando.totales[c]}
                    onChange={(e) =>
                      setEditando({ ...editando, totales: { ...editando.totales, [c]: Math.max(0, Math.trunc(Number(e.target.value) || 0)) } })
                    }
                  />
                </label>
              ))}
            </div>
            <label className="block text-sm text-slate-600">
              Notas (si aportás tus números, también las ve el cuerpo técnico)
              <textarea
                rows={2}
                maxLength={1000}
                className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                value={editando.notas}
                onChange={(e) => setEditando({ ...editando, notas: e.target.value })}
              />
            </label>
            <p className="text-xs text-slate-500">Totales del partido entero. No cambia nada oficial.</p>
          </div>
        )}
      </Overlay>
    </section>
  );
};

export default SeccionMisNumeros;
