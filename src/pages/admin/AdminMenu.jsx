import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import { UtensilsCrossed, Upload, X, Save } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { DAYS, WEEKS } from '../../utils/constants';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const emptyMeal = { title: '', description: '', imageUrl: '', available: true };

export default function AdminMenu() {
  const [menu, setMenu] = useState(null);
  const [week, setWeek] = useState(1);
  const [editing, setEditing] = useState(null); // day name
  const [form, setForm] = useState(emptyMeal);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'rotationalMenu'), (snap) => {
      const map = {};
      snap.docs.forEach((d) => {
        map[d.data().week ?? parseInt(d.id.replace('week', ''))] = { id: d.id, ...d.data() };
      });
      setMenu(map);
    });
    return unsub;
  }, []);

  if (!menu) return <Loader />;

  const days = menu[week]?.days || {};
  const dish = (day) => days[day] || emptyMeal;

  const openEditor = (day) => {
    setForm({ ...emptyMeal, ...dish(day) });
    setEditing(day);
    setFile(null);
  };

  const uploadImage = async () => {
    if (!file) return form.imageUrl;
    const storage = getStorage();
    const path = `menu/week${week}_${editing.toLowerCase()}_${Date.now()}`;
    await uploadBytes(ref(storage, path), file);
    return path;
  };

  const save = async () => {
    setSaving(true);
    try {
      const imageUrl = await uploadImage();
      const docId = `week${week}`;
      const updated = {
        ...menu[week],
        week,
        days: { ...days, [editing]: { ...form, imageUrl } },
      };
      await setDoc(doc(db, 'rotationalMenu', docId), updated, { merge: true });
      toast.success(`Week ${week} — ${editing} updated`);
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <UtensilsCrossed size={22} className="text-brand-red" /> 4-Week Rotational Menu Editor
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Monday–Saturday dinners, Sunday off. Customers see updates live on Home & Menu pages.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {WEEKS.map((w) => (
          <button
            key={w}
            onClick={() => setWeek(w)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${
              week === w
                ? 'bg-brand-red text-white shadow-md'
                : 'bg-white text-brand-charcoal border border-gray-200 hover:bg-brand-red/10'
            }`}
          >
            Week {w}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {DAYS.map((day) => (
          <div key={day} className="card !p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-bold text-lg">{day}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleAvailable(day)}
                  className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition ${
                    dish(day).available === false
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {dish(day).available === false ? 'Off' : 'On'}
                </button>
                <button onClick={() => openEditor(day)} className="btn-primary !px-3 !py-1.5 text-xs">
                  Edit
                </button>
              </div>
            </div>
            <div className="flex gap-3 items-start bg-brand-cream rounded-xl p-3 border border-brand-creamdark">
              <div className="w-14 h-14 rounded-lg bg-brand-creamdark overflow-hidden shrink-0">
                {dish(day).imageUrl ? (
                  <img src={dish(day).imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">🍛</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{dish(day).title || 'Not set'}</p>
                <p className="text-xs text-gray-500">{dish(day).description || ''}</p>
              </div>
            </div>
          </div>
        ))}
        <div className="card !p-4 bg-brand-creamdark/50 border border-dashed border-brand-wood/40">
          <h3 className="font-display font-bold text-lg text-brand-wood">Sunday</h3>
          <p className="text-sm text-gray-500">Off / Special — no dinner box delivered. Customers can order specials via WhatsApp.</p>
        </div>
      </div>

      {/* Editor Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg">
                Week {week} — {editing}
              </h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Dish Title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Description (sides, raita, salad...)</label>
                <textarea className="input h-20" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label">Dish Image</label>
                {form.imageUrl && !file && (
                  <img src={form.imageUrl} alt="" className="h-24 rounded-lg mb-2 object-cover" />
                )}
                <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-brand-red transition text-sm text-gray-500">
                  <Upload size={16} /> {file ? file.name : 'Upload new image'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    className="accent-red-700"
                    checked={form.available !== false}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  />
                  Available for customers
                </label>
              </div>
              <button onClick={save} className="btn-primary w-full" disabled={saving}>
                <Save size={16} /> {saving ? 'Saving...' : 'Save Dish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
