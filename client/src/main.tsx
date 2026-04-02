import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1208',
            color: '#fdf6ec',
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.85rem',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#4a7c59', secondary: '#fdf6ec' } },
          error:   { iconTheme: { primary: '#c2552a', secondary: '#fdf6ec' } },
        }}
      />
    </QueryClientProvider>
  </React.StrictMode>,
);
