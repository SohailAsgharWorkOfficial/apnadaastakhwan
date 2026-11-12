import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { Eye, ClipboardList, ExternalLink } from 'lucide-react';
import { db } from '../../firebase/firebase';
import { formatPKR, fmtDate, STATUS_STYLES } from '../../utils/constants';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const statusOptions = ['pending', 'active', 'out_for_delivery', 'delivered', 'paused', 'completed', 'cancelled'];

export default function AdminOrders() {
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [viewProof, setViewProof] = useState(null); // { url, name }
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

  const update = async (id, data) => {
    try {
      await updateDoc(doc(db, 'subscriptions', id), { ...data, updatedAt: new Date().toISOString() });
      toast.success('Order updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const filtered = filter === 'all' ? subs : subs.filter((s) => s.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
        <ClipboardList size={22} className="text-brand-red" /> Orders & Subscriptions
      </h1>
      <p className="text-gray-500 text-sm mb-6">Real-time list — update status & verify payments</p>

      <div className="flex gap-2 flex-wrap mb-6 no-print">
        {['all', ...statusOptions].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
              filter === s ? 'bg-brand-red text-white' : 'bg-white border border-gray-200 hover:bg-brand-red/10'
            }`}
          >
            {s.replace('_', ' ')}
            {s !== 'all' && (
              <span className="ml-1.5 opacity-60">
                ({subs.filter((x) => x.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
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
                    <h3 className="font-display font-bold">{s.customerName}</h3>
                    <span className={`badge ${STATUS_STYLES[s.status]}`}>{s.status.replace('_', ' ')}</span>
                    <span className={`badge ${s.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.paymentStatus}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <b>{s.planTitle}</b> • {s.mealTime} • {formatPKR(s.totalAmount)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📞 {s.phone} • {s.address}, {s.area}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {fmtDate(s.startDate)} → {fmtDate(s.endDate)} • {s.paymentMethod.toUpperCase()}
                    {(s.pausedDates?.length || 0) > 0 && ` • ⏸ Paused: ${s.pausedDates.join(', ')}`}
                  </p>
                  {s.addons?.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add-ons: {s.addons.map((a) => a.name).join(', ')}
                    </p>
                  )}
                </div>

                {/* Status update */}
                <div>
                  <label className="label !text-xs">Subscription Status</label>
                  <select
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
                  <label className="label !text-xs">Payment</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => update(s.id, { paymentStatus: s.paymentStatus === 'paid' ? 'unpaid' : 'paid' })}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg transition ${
                        s.paymentStatus === 'paid'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      }`}
                    >
                      {s.paymentStatus === 'paid' ? '✓ Paid' : 'Mark Paid'}
                    </button>
                    {s.paymentProofUrl && (
                      <button
                        onClick={() => setViewProof({ url: s.paymentProofUrl, name: s.customerName })}
                        className="btn-secondary !px-3 !py-2 text-xs"
                        title="View receipt"
                      >
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Payment proof modal */}
      {viewProof && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setViewProof(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold">Payment Receipt — {viewProof.name}</h3>
              <button onClick={() => setViewProof(null)} className="text-gray-400 hover:text-red-500 text-xl">✕</button>
            </div>
            <img
              src={viewProof.url}
              alt="Payment proof"
              className="w-full rounded-xl border"
              onError={(e) => {
                e.currentTarget.replaceWith(
                  Object.assign(document.createElement('a'), {
                    href: viewProof.url,
                    target: '_blank',
                    innerText: 'Open receipt in new tab',
                    className: 'text-brand-red underline',
                  })
                );
              }}
            />
            <a
              href={viewProof.url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline w-full mt-4 text-sm"
            >
              <ExternalLink size={14} /> Open Original
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
