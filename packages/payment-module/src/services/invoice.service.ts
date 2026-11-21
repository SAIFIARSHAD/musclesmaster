import type { AxiosInstance } from 'axios';

export const createInvoiceService = (http: AxiosInstance) => ({
  async downloadInvoicePdf(invoiceId: string): Promise<Blob> {
    const response = await http.get(
      `/invoices/${invoiceId}/pdf`,
      {
        responseType: 'blob',
      },
    );

    return response.data;
  },
});

export type InvoiceService = ReturnType<typeof createInvoiceService>;