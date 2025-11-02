import React from 'react';
import type { EstadisticaJugador } from '../../../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface Props {
  estadisticas?: EstadisticaJugador[];
}

const PlayerStats: React.FC<Props> = ({ estadisticas = [] }) => {
  // Simple placeholder chart using recharts; data shape must be adapted by backend
  const chartData = estadisticas.map((s, idx) => ({ name: `P${idx + 1}`, puntos: Math.round(s.puntosPromedio) }));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4">
        <h3 className="text-lg font-semibold">Estadísticas</h3>
        <p className="text-sm text-slate-500">Evolución y resumen de estadísticas del jugador.</p>
      </header>

      {chartData.length === 0 ? (
        <p className="text-sm text-slate-500">No hay datos de estadísticas disponibles.</p>
      ) : (
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="puntos" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
};

export default PlayerStats;
