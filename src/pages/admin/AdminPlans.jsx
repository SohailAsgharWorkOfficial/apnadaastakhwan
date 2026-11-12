import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Package, Plus, Pencil, Trash2, X, Power, Users } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { GROUP_ORDER_DEFAULTS } from '../../utils/constants';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const emptyPlan = {
  title: '',
  durationType: 'monthly',
  mealTime: 'dinner',
  pricePKR: 0,
  totalMeals: 24,
  features: [],
  isPopular: false,
  isActive: true,
};

export default function AdminPlans() {
  const [plans, setPlans] = useState(null);
  const [addons, setAddons] = useState([]);
  const [groupCfg, setGroupCfg] = useState(GROUP_ORDER_DEFAULTS);
  const [editing, setEditing] = useState(null); // plan id or 'new'
  const [form, setForm] = useState(emptyPlan);
  const [featuresText, setFeaturesText] = useState('');
  const [addonForm, setAddonForm] = useState({ name: '', pricePKR: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'plans'), (snap) => {
      setPlans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    const unsubA = onSnapshot(doc(db, 'config', 'addons'), (s) => {
      if (s.exists()) setAddons(s.data().items || []);
    });
    const unsubG = onSnapshot(doc(db, 'config', 'groupOrder'), (s) => {
      if (s.exists()) setGroupCfg({ ...GROUP_ORDER_DEFAULTS, ...s.data() });
    });
    return () => {
      unsub();
      unsubA();
      unsubG();
    };
  }, []);

  if (!plans) return <Loader />;

  const openEditor = (plan) => {
    setForm(plan ? { ...plan } : { ...emptyPlan });
    setFeaturesText((plan?.features || []).join('\n'));
    setEditing(plan?.id || 'new');
  };

  const savePlan = async () => {
    if (!form.title || !form.pricePKR) {
      toast.error('Title & price required');
      return;
    }
    setSaving(true);
    try {
      const id = editing === 'new' ? form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) + '-' + form.durationType : editing;
      await setDoc(doc(db, 'plans', id), {
        ...form,
        features: featuresText.split('\n').map((f) => f.trim()).filter(Boolean),
      });
      toast.success('Plan saved');
      setEditing(null);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (plan) => {
    await setDoc(doc(db, 'plans', plan.id), { isActive: !plan.isActive }, { merge: true });
    toast.success(plan.isActive ? 'Plan disabled' : 'Plan enabled');
  };

  const removePlan = async (plan) => {
    if (!confirm(`Delete "${plan.title}"?`)) return;
    await deleteDoc(doc(db, 'plans', plan.id));
    toast.success('Plan deleted');
  };

  const saveAddons = async (items) => {
    await setDoc(doc(db, 'config', 'addons'), { items }, { merge: true });
  };

  const addAddon = async (e) => {
    e.preventDefault();
    if (!addonForm.name || !addonForm.pricePKR) return;
    const item = {
      id: addonForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: addonForm.name,
      pricePKR: Number(addonForm.pricePKR),
    };
    await saveAddons([...addons, item]);
    setAddonForm({ name: '', pricePKR: '' });
    toast.success('Add-on added');
  };

  const removeAddon = async (id) => {
    await saveAddons(addons.filter((a) => a.id !== id));
    toast.success('Add-on removed');
  };

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package size={22} className="text-brand-red" /> Plans & Pricing
          </h1>
          <p className="text-gray-500 text-sm">Manage tiffin packages shown to customers (PKR)</p>
        </div>
        <button onClick={() => openEditor(null)} className="btn-primary">
          <Plus size={16} /> New Plan
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className={`card !p-5 ${!p.isActive ? 'opacity-60' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="badge bg-brand-green/10 text-brand-green capitalize">
                  {p.durationType === 'daily' ? 'Daily Tiffin' : p.durationType === 'weekly' ? 'Weekly Trial' : 'Monthly'}
                </span>
                <span className="badge bg-brand-mustard/20 text-brand-wood capitalize">🌙 Dinner</span>
                {p.isPopular && <span className="badge bg-brand-red/10 text-brand-red">Popular</span>}
              </div>
              <span className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {p.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <h3 className="font-display font-bold">{p.title}</h3>
            <p className="font-display text-2xl font-extrabold text-brand-red my-1">
              PKR {Number(p.pricePKR).toLocaleString()}
            </p>
            <ul className="text-xs text-gray-500 space-y-1 my-3 min-h-[40px]">
              {(p.features || []).slice(0, 3).map((f, i) => <li key={i}>• {f}</li>)}
            </ul>
            <div className="flex gap-2 mt-2">
              <button onClick={() => openEditor(p)} className="btn-outline flex-1 !py-2 text-xs">
                <Pencil size={13} /> Edit
              </button>
              <button onClick={() => toggleActive(p)} className="btn-secondary !py-2 !px-3 text-xs" title="Enable/Disable">
                <Power size={13} />
              </button>
              <button onClick={() => removePlan(p)} className="bg-red-100 text-red-600 hover:bg-red-200 rounded-xl px-3 py-2 transition" title="Delete">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Group order config */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Users size={20} className="text-brand-red" /> Group / Hostel Bulk Discount
        </h2>
        <div className="card !p-5 max-w-2xl">
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="label">Bulk Discount Enabled</label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-red-700"
                  checked={groupCfg.enabled}
                  onChange={(e) => setGroupCfg({ ...groupCfg, enabled: e.target.checked })}
                />
                {groupCfg.enabled ? 'Enabled' : 'Disabled'}
              </label>
            </div>
            <div>
              <label className="label">Min Packs</label>
              <input
                type="number"
                className="input"
                value={groupCfg.minPacks}
                onChange={(e) => setGroupCfg({ ...groupCfg, minPacks: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Discount %</label>
              <input
                type="number"
                className="input"
                value={groupCfg.discountPercent}
                onChange={(e) => setGroupCfg({ ...groupCfg, discountPercent: Number(e.target.value) })}
              />
            </div>
          </div>
          <button
            onClick={async () => {
              await setDoc(doc(db, 'config', 'groupOrder'), groupCfg, { merge: true });
              toast.success('Group order settings saved');
            }}
            className="btn-primary mt-4"
          >
            Save Group Settings
          </button>
        </div>
      </div>

      {/* Add-ons manager */}
      <div className="mt-10">
        <h2 className="font-display text-xl font-bold mb-4">Add-ons Manager</h2>
        <div className="card !p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {addons.map((a) => (
              <span key={a.id} className="badge bg-brand-cream border border-brand-creamdark text-brand-charcoal flex items-center gap-2 !py-1.5">
                {a.name} — PKR {a.pricePKR}
                <button onClick={() => removeAddon(a.id)} className="text-red-400 hover:text-red-600">
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={addAddon} className="flex gap-2 flex-wrap">
            <input className="input max-w-[200px]" placeholder="Add-on name" value={addonForm.name} onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })} />
            <input className="input max-w-[140px]" type="number" placeholder="Price PKR" value={addonForm.pricePKR} onChange={(e) => setAddonForm({ ...addonForm, pricePKR: e.target.value })} />
            <button className="btn-secondary !py-2 text-sm">
              <Plus size={14} /> Add
            </button>
          </form>
        </div>
      </div>

      {/* Plan editor modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-lg">{editing === 'new' ? 'New Plan' : 'Edit Plan'}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="label">Plan Title</label>
                <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} disabled={editing !== 'new'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Duration</label>
                  <select className="input" value={form.durationType} onChange={(e) => setForm({ ...form, durationType: e.target.value })}>
                    <option value="daily">Daily (1 dinner)</option>
                    <option value="weekly">Weekly Trial (6 dinners)</option>
                    <option value="monthly">Monthly (24 dinners)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Meals</label>
                  <select className="input" value={form.mealTime} onChange={(e) => setForm({ ...form, mealTime: e.target.value })} disabled>
                    <option value="dinner">Dinner (Mon–Sat)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Price (PKR)</label>
                  <input type="number" className="input" value={form.pricePKR} onChange={(e) => setForm({ ...form, pricePKR: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">Total Meals</label>
                  <input type="number" className="input" value={form.totalMeals || ''} onChange={(e) => setForm({ ...form, totalMeals: Number(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="label">Features (one per line)</label>
                <textarea className="input h-24" value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-red-700" checked={!!form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} />
                  Popular badge
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="accent-red-700" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  Active
                </label>
              </div>
              <button onClick={savePlan} className="btn-primary w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
