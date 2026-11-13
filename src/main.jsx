import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                background: 'rgb(var(--c-charcoal))',
                color: 'rgb(var(--c-ivory))',
                borderRadius: '12px',
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '10px 16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
              },
              success: { iconTheme: { primary: '#4F6D2A', secondary: '#FAF6F0' } },
              error: { iconTheme: { primary: '#9E2A3A', secondary: '#FAF6F0' } },
            }}
            aria-live="polite"
          />
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
