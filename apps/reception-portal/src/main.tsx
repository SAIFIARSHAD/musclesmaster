import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { http } from './api/axiosInstance';

import { PaymentModuleProvider } from '@repo/payment-module';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PaymentModuleProvider http={http}>
      <App />
    </PaymentModuleProvider>
  </React.StrictMode>,
);