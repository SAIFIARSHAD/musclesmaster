import {
  createContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { AxiosInstance } from 'axios';
import { createPaymentService } from '../services/payment.service';
import { createRefundService } from '../services/refund.service';
import { createInvoiceService } from '../services/invoice.service';
import { createCollectionLookupService } from '../services/collection-lookup.service';

const PaymentModuleContext = createContext<PaymentModuleContextValue | null>(
  null,
);

export interface PaymentModuleContextValue {
  payments: ReturnType<typeof createPaymentService>;
  refunds: ReturnType<typeof createRefundService>;
  invoices: ReturnType<typeof createInvoiceService>;
  collectionLookup: ReturnType<typeof createCollectionLookupService>;
}

interface PaymentModuleProviderProps {
  http: AxiosInstance;
  children: ReactNode;
}

export const PaymentModuleProvider = ({
  http,
  children,
}: PaymentModuleProviderProps) => {
  const services = useMemo(
    () => ({
      payments: createPaymentService(http),
      refunds: createRefundService(http),
      invoices: createInvoiceService(http),
      collectionLookup: createCollectionLookupService(http),
    }),
    [http],
  );

  return (
    <PaymentModuleContext.Provider value={services}>
      {children}
    </PaymentModuleContext.Provider>
  );
};

export { PaymentModuleContext };
