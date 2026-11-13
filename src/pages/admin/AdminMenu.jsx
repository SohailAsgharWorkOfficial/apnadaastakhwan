import { useEffect, useMemo, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { UtensilsCrossed, Upload, Save, ImageOff, Trash2 } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { DAYS, WEEKS } from '../../utils/constants';
import { uploadImage, removeFile, resolveImageUrl } from '../../utils/storage';
import { useCollection } from '../../hooks/useFirestore';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const emptyMeal = { title: '', description: '', imageUrl: '', available: true };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export default function AdminMenu() {
  const { data: menuDocs, loading, error, retry } = useCollection('rotationalMenu');

  const [week, setWeek] = useState(1);
  const [editing, setEditing] = useState(null); // day name
  const [form, setForm] = useState(emptyMeal);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [saving, setSaving] = useState(false);

  const menu = useMemo(() => {
    const map = {};
    menuDocs.forEach((d) => {
      map[d.week ?? parseInt(d.id.replace('week', ''))] = d;
    });
    return map;
  }, [menuDocs]);

  // Release the local preview URL when the editor closes.
  // NOTE: must stay above any early return below — hooks cannot be
  // conditional or the hook order changes between renders.
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const days = menu[week]?.days || {};
  const dish = (day) => days[day] || emptyMeal;

  const openEditor = (day) => {
    setForm({ ...emptyMeal, ...dish(day) });
    setEditing(day);
    setFile(null);
    setImageRemoved(false);
  };

  /**
   * Upload the chosen image and return its public URL.
   * Falls back to the existing image when no new file was picked.
   */
  const uploadImageForDay = async () => {
    const previous = form.imageUrl;

    if (!file) {
      // The admin explicitly removed the image.
      if (imageRemoved) {
        if (previous) removeFile(previous);
        return '';
      }
      return previous || '';
    }

    const { url } = await uploadImage(
      `menu/week${week}_${editing.toLowerCase()}_${Date.now()}`,
      file
    );

    // Remove the previous file so the bucket doesn't fill up with orphans.
    if (previous) {
      removeFile(previous);
    }

    return url;
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Dish title is required');
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await uploadImageForDay();
      const docId = `week${week}`;
      // `menu[week]` carries a local `id` helper — never persist it.
      const { id: _ignored, ...existing } = menu[week] || {};
      const updated = {
        ...existing,
        week,
        days: { ...days, [editing]: { ...form, title: form.title.trim(), imageUrl } },
      };
      await setDoc(doc(db, 'rotationalMenu', docId), updated, { merge: true });
      toast.success(`Week ${week} — ${editing} updated`);
      setFile(null);
      setPreviewUrl(null);
      setEditing(null);
    } catch (err) {
      console.error(err);
      const msg = err?.message || 'Save failed';
      toast.error(
        msg.includes('bucket not found')
          ? 'Storage is not set up yet — see the notice above.'
          : `Save failed: ${msg}`
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (day) => {
    const d = dish(day);
    if (!d.title) {
      toast.error('Fill this slot first');
      return;
    }
    const docId = `week${week}`;
    await setDoc(
      doc(db, 'rotationalMenu', docId),
      { week, days: { ...days, [day]: { ...d, available: d.available === false } } },
      { merge: true }
    );
    toast.success(`${day} ${d.available === false ? 'enabled' : 'disabled'}`);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!f.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      e.target.value = '';
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error('Image is larger than 5 MB.');
      e.target.value = '';
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setFile(f);
    setImageRemoved(false);
    setPreviewUrl((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 text-gray-900">
        <UtensilsCrossed size={22} className="text-brand-red-ink" aria-hidden="true" /> 4-Week
        Rotational Menu Editor
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Monday–Saturday dinners, Sunday off. Customers see updates live on Home &amp; Menu pages.
      </p>

      {loading && <Loader label="Loading menu…" />}

      {error && (
        <ErrorState
          title="Menu could not be loaded"
          message={error.message}
          onRetry={retry}
          className="mb-6"
        />
      )}

      {!loading && !error && (
        <>
          <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Select week to edit">
            {WEEKS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeek(w)}
                aria-pressed={week === w}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
                  focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream
                  ${
                    week === w
                      ? 'bg-brand-red text-white shadow-md'
                      : 'bg-brand-surface text-gray-700 border border-gray-200 hover:bg-brand-red-ink/10'
                  }`}
              >
                Week {w}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {DAYS.map((day) => (
              <div key={day} className="card !p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h2 className="font-display font-bold text-lg text-gray-900">{day}</h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAvailable(day)}
                      aria-pressed={dish(day).available === false}
                      className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition duration-200 ${
                        dish(day).available === false
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {dish(day).available === false ? 'Off' : 'On'}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditor(day)}
                      className="btn-primary !px-3 !py-1.5 text-xs"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 items-start bg-brand-creamdark/40 rounded-xl p-3 border border-gray-200">
                  <div className="w-14 h-14 rounded-lg bg-brand-creamdark overflow-hidden shrink-0">
                    {dish(day).imageUrl && resolveImageUrl(dish(day).imageUrl) ? (
                      <img
                        src={resolveImageUrl(dish(day).imageUrl)}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-wood/50">
                        <ImageOff size={22} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-800">
                      {dish(day).title || 'Not set'}
                    </p>
                    <p className="text-xs text-gray-500">{dish(day).description || ''}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="card !p-4 bg-brand-creamdark/40 border-dashed border-brand-wood/40">
              <h2 className="font-display font-bold text-lg text-brand-wood">Sunday</h2>
              <p className="text-sm text-gray-500">
                Off / Special — no dinner box delivered. Customers can order specials via
                WhatsApp.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Editor */}
      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Week ${week} — ${editing}` : ''}
      >
        <div className="space-y-3">
          <div>
            <label className="label" htmlFor="dish-title">
              Dish Title
            </label>
            <input
              id="dish-title"
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="label" htmlFor="dish-description">
              Description (sides, raita, salad…)
            </label>
            <textarea
              id="dish-description"
              className="input h-20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label className="label" htmlFor="dish-image">
              Dish Image
            </label>

            {/* Preview: the newly picked file, otherwise the saved image */}
            {(file || (form.imageUrl && resolveImageUrl(form.imageUrl))) && (
              <div className="flex items-start gap-3 mb-2">
                <img
                  src={file ? previewUrl : resolveImageUrl(form.imageUrl)}
                  alt=""
                  className="h-24 w-24 rounded-lg object-cover border border-gray-200 bg-gray-100 shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="text-xs text-gray-500 min-w-0">
                  {file ? (
                    <>
                      <p className="font-semibold text-gray-700 truncate">{file.name}</p>
                      <p>{(file.size / 1024).toFixed(0)} KB · ready to upload</p>
                      <button
                        type="button"
                        onClick={() => {
                          setFile(null);
                          setPreviewUrl(null);
                          setImageRemoved(false);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-brand-red-ink font-semibold hover:underline"
                      >
                        <Trash2 size={12} aria-hidden="true" /> Remove selection
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-700">Image saved</p>
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, imageUrl: '' });
                          setImageRemoved(true);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1 text-brand-red-ink font-semibold hover:underline"
                      >
                        <Trash2 size={12} aria-hidden="true" /> Remove image
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            <label
              htmlFor="dish-image"
              className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-brand-red-ink transition duration-200 text-sm text-gray-500"
            >
              <Upload size={16} aria-hidden="true" />
              {file ? file.name : 'Upload new image'}
            </label>
            <input
              id="dish-image"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFile}
            />
            <p className="hint">JPG or PNG, up to 5 MB. A square image looks best.</p>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#9E2A3A]"
              checked={form.available !== false}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
            />
            Available for customers
          </label>

          <button type="button" onClick={save} className="btn-primary w-full" disabled={saving}>
            <Save size={16} aria-hidden="true" /> {saving ? 'Saving…' : 'Save Dish'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
