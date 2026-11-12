import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { MapPin } from 'lucide-react';
import { db } from '../firebase/firebase';
import PlanCard from '../components/PlanCard';
import Loader from '../components/Loader';
import { COVERAGE } from '../utils/constants';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'plans'), (snap) => {
      setPlans(snap.docs.filter((d) => d.data().isActive).map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubA = onSnapshot(doc(db, 'config', 'addons'), (snap) => {
      if (snap.exists()) setAddons(snap.data().items || []);
    });
    return () => {
      unsub();
      unsubA();
    };
  }, []);

  const sorted = [...plans].sort((a, b) => b.isPopular - a.isPopular || a.pricePKR - b.pricePKR);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold">
          Dinner <span className="text-brand-red">Packages & Pricing</span>
        </h1>
        <p className="text-gray-500 mt-2">
          6-day dinner cycle (Monday–Saturday, Sunday off) • Skip or pause anytime before 10 PM
        </p>
        <div className="inline-flex items-center gap-2 badge bg-brand-green text-white px-4 py-2 mt-4">
          <MapPin size={14} /> Delivery coverage: {COVERAGE.hub} — {COVERAGE.detail}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-10">
          {sorted.map((p) => (
            <PlanCard key={p.id} plan={p} />
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto mt-12 card bg-brand-green/5 border border-brand-green/20">
        <h3 className="font-display font-bold mb-2 text-center">👨‍👩‍👧 Group / Hostel Orders</h3>
        <p className="text-sm text-gray-600 text-center">
          Ordering for 3+ people at the same address? Select <b>Group Order</b> at checkout and get
          an automatic bulk discount (set by the ApnaDastakhwan team).
        </p>
      </div>

      {addons.length > 0 && (
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-center">Available Add-ons</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {addons.map((a) => (
              <div key={a.id} className="card !p-4 flex justify-between items-center !rounded-xl">
                <span className="font-medium text-sm">{a.name}</span>
                <span className="font-bold text-brand-red text-sm">Rs. {a.pricePKR}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
