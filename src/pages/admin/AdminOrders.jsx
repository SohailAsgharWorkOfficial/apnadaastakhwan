import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
} from 'firebase/firestore';
import {
  Eye,
  ClipboardList,
  Phone,
  PauseCircle,
  Check,
  Download,
  Inbox,
  Search,
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import { formatPKR, fmtDate, STATUS_STYLES } from '../../utils/constants';
import { fetchPrivateImage } from '../../utils/storage';
import Loader from '../../components/Loader';
import Modal from '../../components/Modal';
import {
  PageHeader,
  Panel,
  AdminTable,
  StatusPill,
  EmptyState,
} from '../../components/admin/AdminUI';
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

const FILTERS = ['all', ...statusOptions];

const statusTone = (status) =>
  status === 'active'
    ? 'green'
    : status === 'pending'
      ? 'amber'
      : status === 'cancelled'
        ? 'red'
        : status === 'out_for_delivery'
          ? 'blue'
          : 'slate';

export default function AdminOrders() {
  const [subs, setSubs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [viewProof, setViewProof] = useState(null);
  const [proofObjectUrl, setProofObjectUrl] = useState(null);
  const [proofError, setProofError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useSearchParams();

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

  // Private receipts need the Authorization header, so they are fetched as blobs.
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

  const filtered = subs
    .filter((s) => filter === 'all' || s.status === filter)
    .filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (s.customerName || '').toLowerCase().includes(q) ||
        (s.phone || '').includes(q) ||
        (s.area || '').toLowerCase().includes(q)
      );
    });

  const exportCsv = () => {
    const rows = [
      ['Name', 'Phone', 'Area', 'Address', 'Plan', 'Amount', 'Payment', 'Status', 'Start', 'End'],
      ...filtered.map((s) => [
        s.customerName,
        s.phone,
        s.area,
        s.address,
        s.planTitle,
        s.totalAmount,
        s.paymentStatus,
        s.status,
        s.startDate,
        s.endDate,
      ]),
    ];
    const csv = rows
      .map((r) =>
        r
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apnadastarkhwan-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Orders & Subscriptions"
        description="Update status, verify payments and keep the kitchen list accurate."
        actions={
          <>
            <button type="button" onClick={exportCsv} className="btn-outline !py-2 !px-3.5 text-sm">
              <Download size={16} aria-hidden="true" /> Export CSV
            </button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden="true"
          />
          <label className="sr-only" htmlFor="order-search">
            Search orders
          </label>
          <input
            id="order-search"
            type="search"
            className="input pl-10"
            placeholder="Search name, phone or area…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by status">
          {FILTERS.map((s) => {
            const selected = filter === s;
            const count =
              s === 'all' ? subs.length : subs.filter((x) => x.status === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                aria-pressed={selected}
                className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red-ink focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream
                  ${
                    selected
                      ? 'bg-brand-red text-white shadow-sm'
                      : 'bg-brand-surface border border-gray-200 text-gray-600 hover:border-brand-red-ink/40'
                  }`}
              >
                {s.replace('_', ' ')}
                <span className={selected ? 'text-white/70' : 'text-gray-400'}>
                  {' '}
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Panel>
        {loading ? (
          <Loader label="Loading orders…" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nothing here"
            message={
              subs.length === 0
                ? 'Orders will appear here the moment a customer subscribes.'
                : 'No orders match this filter. Try another status or clear the search.'
            }
          />
        ) : (
          <AdminTable head={['Customer', 'Plan', 'Contact', 'Amount', 'Payment', 'Status', 'Action']} minWidth="900px">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-brand-creamdark/40 transition-colors">
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-2.5">
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-brand-red-ink/10 text-brand-red-ink text-xs font-bold shrink-0">
                      {(s.customerName || '?').trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-gray-900 truncate">
                        {s.customerName}
                      </span>
                      <span className="block text-xs text-gray-500 truncate">
                        {s.address}, {s.area}
                      </span>
                    </span>
                  </span>
                </td>

                <td className="px-5 py-3.5">
                  <span className="block font-medium text-gray-800 whitespace-nowrap">
                    {s.planTitle}
                  </span>
                  <span className="block text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                  </span>
                  {(s.pausedDates?.length || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-orange-700 mt-1">
                      <PauseCircle size={11} aria-hidden="true" />
                      {s.pausedDates.length} paused
                    </span>
                  )}
                </td>

                <td className="px-5 py-3.5">
                  <a
                    href={`tel:${s.phone}`}
                    className="inline-flex items-center gap-1.5 text-sm text-brand-red-ink hover:underline whitespace-nowrap"
                  >
                    <Phone size={13} aria-hidden="true" />
                    {s.phone}
                  </a>
                </td>

                <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                  {formatPKR(s.totalAmount)}
                </td>

                <td className="px-5 py-3.5">
                  <StatusPill
                    tone={s.paymentStatus === 'paid' ? 'green' : 'amber'}
                  >
                    {s.paymentStatus}
                  </StatusPill>
                </td>

                <td className="px-5 py-3.5">
                  <StatusPill tone={statusTone(s.status)}>
                    {s.status.replace('_', ' ')}
                  </StatusPill>
                </td>

                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <select
                      className="input !py-1.5 !px-2.5 !text-xs !w-auto"
                      value={s.status}
                      onChange={(e) => update(s.id, { status: e.target.value })}
                      aria-label={`Change status for ${s.customerName}`}
                    >
                      {statusOptions.map((st) => (
                        <option key={st} value={st}>
                          {st.replace('_', ' ')}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        update(s.id, {
                          paymentStatus: s.paymentStatus === 'paid' ? 'unpaid' : 'paid',
                        })
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition duration-200 whitespace-nowrap ${
                        s.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      aria-label={`Mark payment for ${s.customerName} as ${
                        s.paymentStatus === 'paid' ? 'unpaid' : 'paid'
                      }`}
                    >
                      {s.paymentStatus === 'paid' && <Check size={13} aria-hidden="true" />}
                      {s.paymentStatus === 'paid' ? 'Paid' : 'Mark paid'}
                    </button>

                    {s.paymentProofUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setViewProof({ url: s.paymentProofUrl, name: s.customerName })
                        }
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-600 hover:border-brand-red-ink/40 hover:text-brand-red-ink transition"
                        aria-label={`View receipt from ${s.customerName}`}
                        title="View receipt"
                      >
                        <Eye size={15} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        )}
      </Panel>

      {/* Payment proof */}
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
          <div
            role="alert"
            className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-800 dark:text-red-200"
          >
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
