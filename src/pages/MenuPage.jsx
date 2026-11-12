import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import RotationalMenuTabs from '../components/RotationalMenuTabs';
import Loader from '../components/Loader';
import { WHATSAPP_LINK } from '../utils/constants';

export default function MenuPage() {
  const [addons, setAddons] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'addons'), (snap) => {
      if (snap.exists()) setAddons(snap.data().items || []);
    });
    return unsub;
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold">
          4-Week Rotational <span className="text-brand-red">Dinner Menu</span>
        </h1>
        <p className="text-gray-500 mt-2 max-w-xl mx-auto">
          24 homemade dishes rotating across Week 1-4, Monday to Saturday (Sunday off).
          Every dinner is the same for everyone that night — fresh, hygienic, made with love.
        </p>
      </div>

      <RotationalMenuTabs variant="cards" />

      {addons.length > 0 && (
        <div className="mt-14">
          <h2 className="text-2xl font-bold mb-4 text-center">Add-ons <span className="text-brand-green">& Extras</span></h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {addons.map((a) => (
              <div key={a.id} className="card !p-4 flex items-center justify-between">
                <p className="font-semibold text-sm">{a.name}</p>
                <p className="text-brand-red font-bold text-sm">Rs. {a.pricePKR}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            Add-ons can be attached to your subscription at checkout.
          </p>
        </div>
      )}

      <div className="text-center mt-12 flex flex-wrap gap-3 justify-center">
        <a href="/plans" className="btn-primary">Go to Meal Plans →</a>
        <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" className="btn-secondary">
          Order Today's Box on WhatsApp
        </a>
      </div>
    </div>
  );
}
