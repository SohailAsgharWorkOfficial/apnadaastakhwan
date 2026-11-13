import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [plan, setPlan] = useState(null);
  const [addons, setAddons] = useState([]);

  const selectPlan = (p) => setPlan(p);

  const toggleAddon = (addon) =>
    setAddons((prev) =>
      prev.some((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );

  const clearCart = () => {
    setPlan(null);
    setAddons([]);
  };

  /**
   * Rebuild the cart from a previous subscription so a customer can repeat an
   * order in one tap instead of filling the checkout form again.
   */
  const reorderFrom = (sub) => {
    if (!sub) return;
    const addonTotal = (sub.addons || []).reduce((s, a) => s + (a.pricePKR || 0), 0);
    const base =
      sub.planPricePKR != null
        ? sub.planPricePKR
        : Math.max(0, (sub.totalAmount || 0) - addonTotal);

    setPlan({
      id: sub.planId,
      title: sub.planTitle,
      durationType: sub.durationType,
      mealTime: sub.mealTime || 'dinner',
      pricePKR: base,
      totalMeals: sub.totalMeals,
      features: [],
      isActive: true,
      isPopular: false,
    });
    setAddons(sub.addons || []);
  };

  const cartTotal = useMemo(
    () =>
      (plan?.pricePKR || 0) +
      addons.reduce((sum, a) => sum + (a.pricePKR || 0), 0),
    [plan, addons]
  );

  return (
    <CartContext.Provider
      value={{
        plan,
        addons,
        selectPlan,
        toggleAddon,
        clearCart,
        reorderFrom,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
