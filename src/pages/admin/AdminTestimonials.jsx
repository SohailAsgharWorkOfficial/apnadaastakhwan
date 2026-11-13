import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { MessageSquareQuote, Plus, Trash2, Star, Eye, EyeOff, Pencil } from 'lucide-react';
import { db } from '../../firebase/firebase';
import Loader from '../../components/Loader';
import ErrorState from '../../components/ErrorState';
import toast from 'react-hot-toast';

const empty = { name: '', area: '', quote: '', rating: 5, isPublished: true };

export default function AdminTestimonials() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'testimonials'),
      (snap) => {
        setItems(
          snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      },
      (err) => {
        console.error(err);
        setError(err);
        setItems([]);
      }
    );
    return unsub;
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.quote.trim()) {
      toast.error('Name and review text are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        area: form.area.trim(),
        quote: form.quote.trim(),
        rating: Number(form.rating) || 5,
        isPublished: form.isPublished !== false,
      };

      if (editingId) {
        await updateDoc(doc(db, 'testimonials', editingId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
        toast.success('Review updated');
      } else {
        await addDoc(collection(db, 'testimonials'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        toast.success('Review added');
      }
      setForm(empty);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.message ? `Could not save: ${err.message}` : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete the review from ${item.name}?`)) return;
    try {
      await deleteDoc(doc(db, 'testimonials', item.id));
      toast.success('Review deleted');
      if (editingId === item.id) {
        setEditingId(null);
        setForm(empty);
      }
    } catch (err) {
      toast.error(err?.message || 'Could not delete');
    }
  };

  const togglePublished = async (item) => {
    try {
      await updateDoc(doc(db, 'testimonials', item.id), {
        isPublished: item.isPublished === false,
      });
    } catch (err) {
      toast.error(err?.message || 'Could not update');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      area: item.area || '',
      quote: item.quote || '',
      rating: item.rating || 5,
      isPublished: item.isPublished !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 text-gray-900">
        <MessageSquareQuote size={22} className="text-brand-red-ink" aria-hidden="true" />
        Customer Reviews
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Publish what customers actually told you — unpublish any review without
        deleting it.
      </p>

      {/* Editor */}
      <form onSubmit={save} className="card max-w-2xl mb-8">
        <h2 className="font-display font-bold text-lg mb-4 text-gray-900">
          {editingId ? 'Edit review' : 'Add a review'}
        </h2>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="t-name">
                Customer name <span className="text-brand-red-ink">*</span>
              </label>
              <input
                id="t-name"
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ayesha R."
              />
            </div>
            <div>
              <label className="label" htmlFor="t-area">
                Area / Company
              </label>
              <input
                id="t-area"
                className="input"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Gulshan-e-Iqbal, Karachi"
              />
            </div>
          </div>

          <div>
            <label className="label" htmlFor="t-quote">
              What they said <span className="text-brand-red-ink">*</span>
            </label>
            <textarea
              id="t-quote"
              className="input h-24"
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
              placeholder="Paste their message exactly as they sent it."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="label" htmlFor="t-rating">
                Rating
              </label>
              <select
                id="t-rating"
                className="input"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
              >
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} star{r > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2.5">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#9E2A3A]"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
              />
              Show on the website
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={saving}>
              <Plus size={16} aria-hidden="true" />
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add review'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setEditingId(null);
                  setForm(empty);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </form>

      {/* List */}
      {items === null ? (
        <Loader label="Loading reviews…" />
      ) : error ? (
        <ErrorState title="Reviews could not be loaded" message={error.message} />
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <MessageSquareQuote size={32} className="mx-auto text-gray-300" aria-hidden="true" />
          <p className="font-display font-bold text-gray-800 mt-3">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1.5">
            Add the first one above — customers see them on the home page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card !p-5 flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  {item.area && (
                    <span className="text-xs text-gray-500">· {item.area}</span>
                  )}
                  <span className="inline-flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={12}
                        aria-hidden="true"
                        className={
                          i <= (item.rating || 5)
                            ? 'text-brand-mustard fill-brand-mustard'
                            : 'text-gray-300'
                        }
                      />
                    ))}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1.5 text-pretty">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => togglePublished(item)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
                  aria-label={
                    item.isPublished === false ? 'Publish review' : 'Hide from website'
                  }
                  title={item.isPublished === false ? 'Publish' : 'Hide'}
                >
                  {item.isPublished === false ? (
                    <EyeOff size={16} aria-hidden="true" />
                  ) : (
                    <Eye size={16} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-brand-red-ink/10 hover:text-brand-red-ink transition"
                  aria-label={`Edit review from ${item.name}`}
                  title="Edit"
                >
                  <Pencil size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-lg text-gray-500 hover:bg-red-100 hover:text-red-700 transition"
                  aria-label={`Delete review from ${item.name}`}
                  title="Delete"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
