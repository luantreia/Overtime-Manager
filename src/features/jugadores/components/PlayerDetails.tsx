import React, { useState } from 'react';
import type { Jugador } from '../../../types';
import { Input, Select } from '../../../shared/components/ui';

const GENERO_OPCIONES = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
];

interface Props {
  jugador: Jugador;
  onSave?: (data: Partial<Jugador>) => Promise<void>;
}

const PlayerDetails: React.FC<Props> = ({ jugador, onSave }) => {
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    nombre: jugador.nombre ?? '',
    alias: jugador.alias ?? '',
    fechaNacimiento: jugador.fechaNacimiento ?? '',
    genero: jugador.genero ?? 'otro',
    foto: jugador.foto ?? '',
    nacionalidad: jugador.nacionalidad ?? '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement & HTMLSelectElement;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    setLoading(true);
    try {
      await onSave({
        nombre: form.nombre || undefined,
        alias: form.alias || undefined,
        fechaNacimiento: form.fechaNacimiento || undefined,
        genero: form.genero || undefined,
        foto: form.foto || undefined,
        nacionalidad: form.nacionalidad || undefined,
      });
      setEdit(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Perfil</h3>
        <div>
          {!edit ? (
            <button className="text-sm text-slate-600" onClick={() => setEdit(true)} type="button">
              Editar
            </button>
          ) : null}
        </div>
      </header>

      {!edit ? (
        <div className="space-y-2 text-sm text-slate-700">
          <div>
            <strong>Nombre:</strong> {jugador.nombre}
          </div>
          <div>
            <strong>Alias:</strong> {jugador.alias ?? '—'}
          </div>
          <div>
            <strong>Fecha de nacimiento:</strong> {jugador.fechaNacimiento ?? '—'}
          </div>
          <div>
            <strong>Género:</strong> {jugador.genero ?? '—'}
          </div>
          <div>
            <strong>Nacionalidad:</strong> {jugador.nacionalidad ?? '—'}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input id="nombre" label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
          <Input id="alias" label="Alias" name="alias" value={form.alias} onChange={handleChange} />
          <Input id="fechaNacimiento" label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={form.fechaNacimiento} onChange={handleChange} />
          <label className="block text-sm font-medium text-slate-700">Género</label>
          <Select id="genero" name="genero" value={form.genero} onChange={handleChange} options={GENERO_OPCIONES} />
          <Input id="nacionalidad" label="Nacionalidad" name="nacionalidad" value={form.nacionalidad} onChange={handleChange} />
          <Input id="foto" label="URL de foto" name="foto" value={form.foto} onChange={handleChange} />
          <div className="flex justify-end gap-3">
            <button type="button" className="rounded-lg border px-3 py-1 text-sm" onClick={() => setEdit(false)}>
              Cancelar
            </button>
            <button disabled={loading} type="submit" className="rounded-lg bg-brand-600 px-3 py-1 text-sm text-white">
              Guardar
            </button>
          </div>
        </form>
      )}
    </section>
  );
};

export default PlayerDetails;
