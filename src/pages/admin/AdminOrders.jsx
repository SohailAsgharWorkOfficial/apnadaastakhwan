import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { Eye, ClipboardList, Phone, PauseCircle, Check } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { formatPKR, fmtDate, STATUS_STYLES } from '../../utils/constants';
import { fetchPrivateImage } from '../../utils/storage';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import toast from 'react-hot-toast';

const statusOptions = [
  'pending',
  'active',
  'out_for_delivery',
  'delivered',
  'paused',
  'completed',
  'cancelled',
];

export default function AdminOrders() {
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [viewProof, setViewProof] = useState(null); // { url, name }
  const [proofObjectUrl, setProofObjectUrl] = useState(null);
  const [proofError, setProofError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc')),
      (snap) => {
        setSubs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  // Private receipts need the Authorization header, so fetch them as blobs.
  useEffect(() => {
    if (!viewProof?.url) return undefined;

    let cancelled = false;
    let objectUrl = null;

    setProofObjectUrl(null);
    setProofError(null);

    fetchPrivateImage(viewProof.url)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrl = url;
        setProofObjectUrl(url);
      })
      .catch((err) => {
        if (!cancelled) setProofError(err.message || 'Could not load the receipt.');
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [viewProof?.url]);

  const update = async (id, data) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Order updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = filter === 'all' ? subs : subs.filter((s) => s.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2 text-gray-900">
        <ClipboardList size={22} className="text-brand-red-ink" aria-hidden="true" /> Orders &amp;
        Subscriptions
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Real-time list — update status &amp; verify payments
      </p>

      <div
        className="flex gap-2 flex-wrap mb-6 no-print"
        role="group"
        aria-label="Filter orders by status"
      >
        {['all', ...statusOptions].map((s) => {
          const selected = filter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              aria-pressed={selected}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink
                focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream
                ${
                  selected
                    ? 'bg-brand-red text-white'
                    : 'bg-brand-surface border border-gray-200 text-gray-600 hover:bg-brand-red-ink/10'
                }`}
            >
              {s.replace('_', ' ')}
              {s !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  ({subs.filter((x) => x.status === s).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Loader label="Loading orders…" />
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10 text-gray-500">No orders in this view.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s) => (
            <div key={s.id} className="card !p-5">
              <div className="grid lg:grid-cols-4 gap-4 items-start">
                {/* Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-display font-bold text-gray-900">{s.customerName}</h2>
                    <span className={`badge ${STATUS_STYLES[s.status]}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                    <span
                      className={`badge ${
                        s.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {s.paymentStatus}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">
                    <b>{s.planTitle}</b> • {s.mealTime} • {formatPKR(s.totalAmount)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 flex-wrap">
                    <Phone size={12} aria-hidden="true" />
                    <a
                      href={`tel:${s.phone}`}
                      className="hover:text-brand-red-ink transition duration-200"
                    >
                      {s.phone}
                    </a>
                    <span aria-hidden="true">•</span>
                    <span>
                      {s.address}, {s.area}
                    </span>
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>
                      {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                    </span>
                    <span aria-hidden="true">•</span>
                    <span>{s.paymentMethod.toUpperCase()}</span>
                    {(s.pausedDates?.length || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-orange-700">
                        <PauseCircle size={12} aria-hidden="true" />
                        Paused: {s.pausedDates.join(', ')}
                      </span>
                    )}
                  </p>

                  {s.addons?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add-ons: {s.addons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </div>

                {/* Status update */}
                <div>
                  <label className="label !text-xs" htmlFor={`status-${s.id}`}>
                    Subscription Status
                  </label>
                  <select
                    id={`status-${s.id}`}
                    className="input !py-2 text-sm"
                    value={s.status}
                    onChange={(e) => update(s.id, { status: e.target.value })}
                  >
                    {statusOptions.map((st) => (
                      <option key={st} value={st}>
                        {st.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment */}
                <div className="space-y-2">
                  <span className="label !text-xs">Payment</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        update(s.id, { paymentStatus: s.paymentStatus === 'paid' ? 'unpaid' : 'paid' })
                      }
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition duration-200 ${
                        s.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {s.paymentStatus === 'paid' && <Check size={13} aria-hidden="true" />}
                      {s.paymentStatus === 'paid' ? 'Paid' : 'Mark Paid'}
                    </button>
                    {s.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() => setViewProof({ url: s.paymentProofUrl, name: s.customerName })}
                        className="btn-secondary !px-3 !py-2 text-xs"
                        aria-label={`View receipt from ${s.customerName}`}
                        title="View receipt"
                      >
                        <Eye size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment proof — private files need an auth header, so they are
          fetched as a blob rather than loaded straight into <img src>. */}
      <Modal
        open={Boolean(viewProof)}
        onClose={() => {
          if (proofObjectUrl) URL.revokeObjectURL(proofObjectUrl);
          setProofObjectUrl(null);
          setViewProof(null);
        }}
        title={viewProof ? `Payment Receipt — ${viewProof.name}` : ''}
        maxWidth="max-w-lg"
      >
        {proofError ? (
          <div role="alert" className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200">
            {proofError}
          </div>
        ) : proofObjectUrl ? (
          <img
            src={proofObjectUrl}
            alt="Payment proof"
            className="w-full rounded-xl border border-gray-200"
          />
        ) : (
          <div className="flex items-center justify-center py-10">
            <Loader label="Loading receipt…" />
          </div>
        )}
      </Modal>
    </div>
  );
}
