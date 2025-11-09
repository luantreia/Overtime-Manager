import React from 'react';
import { Button } from '../../../shared/components/ui';

interface AdminItem {
  id: string;
  nombre?: string;
  email?: string;
}

interface SeccionAdministradoresJugadorProps {
  admins: AdminItem[];
  nuevoAdmin: string;
  onNuevoAdminChange: (value: string) => void;
  onAgregarAdmin: () => void;
  onQuitarAdmin: (id: string) => void;
  loadingAgregar?: boolean;
}

const SeccionAdministradoresJugador: React.FC<SeccionAdministradoresJugadorProps> = ({
  admins,
  nuevoAdmin,
  onNuevoAdminChange,
  onAgregarAdmin,
  onQuitarAdmin,
  loadingAgregar = false,
}) => {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Administradores</h3>
      {admins.length > 0 ? (
        <ul className="mb-4 max-h-40 overflow-auto border border-slate-300 rounded-md">
          {admins.map((a) => (
            <li key={a.id} className="flex justify-between items-center border-b border-slate-200 py-2 px-3 last:border-b-0">
              <div>
                <div className="text-sm font-medium">{a.nombre || a.id}</div>
                {a.email && <div className="text-xs text-slate-500">{a.email}</div>}
              </div>
              <Button variant="danger" size="sm" onClick={() => onQuitarAdmin(a.id)}>
                Quitar
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-4 text-sm text-slate-500">No hay administradores asignados.</p>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Email del nuevo admin"
          value={nuevoAdmin}
          onChange={(e) => onNuevoAdminChange(e.target.value)}
          className="flex-grow px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={onAgregarAdmin} loading={loadingAgregar} disabled={!nuevoAdmin.trim()}>
          Agregar
        </Button>
      </div>
    </section>
  );
};

export default SeccionAdministradoresJugador;
