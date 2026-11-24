import { useContext } from 'react';
import { PaymentModuleContext } from './PaymentModuleProvider';

export const usePaymentModule = () => {
  const context = useContext(PaymentModuleContext);

  if (!context) {
    throw new Error(
      'usePaymentModule must be used inside PaymentModuleProvider',
    );
  }

  return context;
};