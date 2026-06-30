import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, Loader2, Save, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

function imagesToText(images) {
  return Array.isArray(images) ? images.join('\n') : '';
}

function textToImages(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function ImageEditor({ title, hint, value, onChange }) {
  const images = textToImages(value);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-100">
            <ImageIcon className="h-5 w-5 text-amber-500" />
            {title}
          </h2>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-amber-400">
          {images.length}/12
        </span>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={7}
        placeholder="https://images.unsplash.com/photo-..."
        className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500"
      />
      <p className="mt-2 text-xs text-slate-500">Нэг мөрөнд нэг зурагны URL оруулна.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.length > 0 ? (
          images.slice(0, 12).map((image, index) => (
            <div key={`${image}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <img src={image} alt={`${title} ${index + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
                #{index + 1}
              </span>
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-xl border border-dashed border-slate-700 bg-slate-950 px-4 py-8 text-center text-sm text-slate-500">
            Preview зураг алга байна.
          </div>
        )}
      </div>
    </section>
  );
}

export default function GalleryManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [organization, setOrganization] = useState(null);
  const [exteriorImages, setExteriorImages] = useState('');
  const [interiorImages, setInteriorImages] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let mounted = true;

    api.getOwnerOrganization()
      .then((res) => {
        if (!mounted) return;
        const data = res.data;
        setOrganization(data);
        setExteriorImages(imagesToText(data.exteriorImages));
        setInteriorImages(imagesToText(data.interiorImages));
        setDescription(data.description || '');
        setPhone(data.phone || '');
      })
      .catch((err) => setError(err.message || 'Gallery мэдээлэл авахад алдаа гарлаа.'))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.updateOwnerOrganization({
        exteriorImages: textToImages(exteriorImages),
        interiorImages: textToImages(interiorImages),
        description,
        phone,
      });

      setOrganization(res.data);
      setSuccess('Lounge зураг болон мэдээлэл хадгалагдлаа.');
    } catch (err) {
      setError(err.message || 'Хадгалахад алдаа гарлаа.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-500">
            <Sparkles className="h-4 w-4" />
            Lounge gallery
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">Зураг, танилцуулга засах</h1>
          <p className="mt-2 text-sm text-slate-500">{organization?.name}</p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition-colors hover:bg-amber-400 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Хадгалах
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>}
      {success && <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">{success}</div>}

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <h2 className="mb-4 text-lg font-extrabold text-slate-100">Үндсэн мэдээлэл</h2>
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Танилцуулга</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-amber-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Утас</label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-amber-500"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <ImageEditor
          title="Exterior зураг"
          hint="Public detail дээр гадна орчин / нүүр зураг болж харагдана."
          value={exteriorImages}
          onChange={setExteriorImages}
        />
        <ImageEditor
          title="Interior зураг"
          hint="Дотор орчин, ширээ, ambience gallery-д харагдана."
          value={interiorImages}
          onChange={setInteriorImages}
        />
      </div>
    </form>
  );
}
