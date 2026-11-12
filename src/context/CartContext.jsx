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

  const cartTotal = useMemo(
    () =>
      (plan?.pricePKR || 0) +
      addons.reduce((sum, a) => sum + (a.pricePKR || 0), 0),
    [plan, addons]
  );

  return (
    <CartContext.Provider
      value={{ plan, addons, selectPlan, toggleAddon, clearCart, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
