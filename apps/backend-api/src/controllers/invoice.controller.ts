import { Response } from 'express';

import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles.enum';
import { generateInvoicePdf } from '../services/invoice.service';

const getErrorStatus = (error: unknown): number => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof error.statusCode === 'number'
  ) {
    return error.statusCode;
  }

  return 500;
};

const getErrorMessage = (error: unknown): string => {
  return error instanceof Error
    ? error.message
    : 'Unable to generate invoice PDF.';
};

/**
 * Download invoice PDF.
 *
 * GET /api/invoices/:invoiceId/pdf
 */
export const downloadInvoicePdfHandler = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user?.userId || !req.user.role) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized: User information missing.',
      });
      return;
    }

    // Normalize Express route parameter to a string.
    const invoiceId = Array.isArray(req.params.invoiceId)
      ? req.params.invoiceId[0]
      : req.params.invoiceId;

    if (!invoiceId) {
      res.status(400).json({
        success: false,
        message: 'Invoice ID is required.',
      });
      return;
    }

    const pdfBuffer = await generateInvoicePdf(invoiceId, {
      userId: req.user.userId,
      role: req.user.role as UserRole,
      branchId: req.user.branchId,
    });

    const safeFileName = `Invoice-${invoiceId}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${safeFileName}"`,
    );

    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(200).send(pdfBuffer);
  } catch (error) {
    res.status(getErrorStatus(error)).json({
      success: false,
      message: getErrorMessage(error),
    });
  }
};
