import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import path from 'path';

import { Invoice } from '../models/Invoice.model';
import { UserRole } from '../constants/roles.enum';

export interface InvoiceActor {
  userId: string;
  role: UserRole;
  branchId?: string;
}

/**
 * Fetch invoice after checking user's branch access.
 */
const getAuthorizedInvoice = async (
  invoiceId: string,
  actor: InvoiceActor,
) => {
  if (!mongoose.isValidObjectId(invoiceId)) {
    throw Object.assign(new Error('Invalid invoice ID.'), {
      statusCode: 400,
    });
  }

  const invoice = await Invoice.findById(invoiceId);

  if (!invoice) {
    throw Object.assign(new Error('Invoice not found.'), {
      statusCode: 404,
    });
  }

  if (
    actor.role !== UserRole.SUPER_ADMIN &&
    String(invoice.branchId) !== actor.branchId
  ) {
    throw Object.assign(
      new Error('You are not authorized to access this invoice.'),
      { statusCode: 403 },
    );
  }

  return invoice;
};

/**
 * Generate invoice PDF, save it privately and return its Buffer.
 * Reuse the existing PDF whenever the saved file is available.
 */
export const generateInvoicePdf = async (
  invoiceId: string,
  actor: InvoiceActor,
): Promise<Buffer> => {
  const invoice = await getAuthorizedInvoice(invoiceId, actor);

  // Private invoice storage location.
  const invoiceDirectory = path.resolve(
    process.cwd(),
    'uploads',
    'invoices',
  );

  const fileName = `${invoice.invoiceNumber.replace(
    /[^a-zA-Z0-9-_]/g,
    '_',
  )}.pdf`;

  const filePath = path.join(invoiceDirectory, fileName);

  const pdfUrl = `/api/invoices/${invoice._id}/pdf`;

  // Reuse an existing PDF instead of generating it again.
  try {
    const existingPdf = await fs.readFile(filePath);

    // Ensure the invoice has its download URL saved.
    if (invoice.pdfUrl !== pdfUrl) {
      invoice.pdfUrl = pdfUrl;
      await invoice.save();
    }

    return existingPdf;
  } catch (error) {
    const fileError = error as NodeJS.ErrnoException;

    // Only regenerate when the PDF file does not exist.
    if (fileError.code !== 'ENOENT') {
      throw error;
    }
  }

  // Generate a new PDF.
  const doc = new PDFDocument({
    size: 'A4',
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
    info: {
      Title: `Invoice ${invoice.invoiceNumber}`,
      Author: invoice.branchName,
      Subject: 'Membership Payment Invoice',
    },
  });

  const chunks: Buffer[] = [];

  const pdfBuffer: Buffer = await new Promise<Buffer>(
    (resolve, reject) => {
      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', reject);

      try {
        const pageWidth = doc.page.width;
        const left = 50;
        const right = pageWidth - 50;

        // Header
        doc
          .font('Helvetica-Bold')
          .fontSize(22)
          .fillColor('#172554')
          .text('MUSCLESMASTER', left, 50);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#64748b')
          .text('GYM MANAGEMENT SYSTEM', left, 78);

        doc
          .font('Helvetica-Bold')
          .fontSize(24)
          .fillColor('#0f172a')
          .text('INVOICE', 350, 50, {
            width: 195,
            align: 'right',
          });

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#334155')
          .text(
            `Invoice No: ${invoice.invoiceNumber}`,
            300,
            85,
            {
              width: 245,
              align: 'right',
            },
          );

        doc.text(
          `Date: ${new Date(invoice.generatedDate).toLocaleDateString('en-IN')}`,
          300,
          102,
          {
            width: 245,
            align: 'right',
          },
        );

        doc
          .moveTo(left, 135)
          .lineTo(right, 135)
          .lineWidth(1)
          .strokeColor('#cbd5e1')
          .stroke();

        // Branch details
        let y = 155;

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0f172a')
          .text('FROM', left, y);

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#334155')
          .text(invoice.branchName, left, y + 22);

        if (invoice.branchAddress) {
          doc.text(invoice.branchAddress, left, y + 38, {
            width: 230,
          });
        }

        if (invoice.branchGstNumber) {
          doc.text(
            `GSTIN: ${invoice.branchGstNumber}`,
            left,
            y + 68,
          );
        }

        // Member details
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor('#0f172a')
          .text('BILL TO', 320, y);

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#334155')
          .text(invoice.billingName, 320, y + 22);

        doc.text(
          `Phone: ${invoice.billingPhone}`,
          320,
          y + 38,
        );

        if (invoice.billingEmail) {
          doc.text(invoice.billingEmail, 320, y + 54);
        }

        if (invoice.billingAddress) {
          doc.text(invoice.billingAddress, 320, y + 70, {
            width: 225,
          });
        }

        y = 275;

        // Payment details
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#0f172a')
          .text('PAYMENT DETAILS', left, y);

        y += 30;

        const descriptionX = left;
        const amountX = 420;

        // Table header
        doc
          .rect(left, y, right - left, 28)
          .fill('#172554');

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#ffffff')
          .text('Description', descriptionX + 10, y + 9);

        doc.text('Amount (INR)', amountX, y + 9, {
          width: 75,
          align: 'right',
        });

        y += 38;

        // Subtotal
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#334155')
          .text(
            'Membership Payment',
            descriptionX + 10,
            y,
          );

        doc.text(invoice.subtotal.toFixed(2), amountX, y, {
          width: 75,
          align: 'right',
        });

        y += 25;

        // Discount
        doc.text('Discount', descriptionX + 10, y);

        doc.text(
          `-${invoice.discountAmount.toFixed(2)}`,
          amountX,
          y,
          {
            width: 75,
            align: 'right',
          },
        );

        y += 25;

        // Tax breakdown
        for (const tax of invoice.taxInfo) {
          doc.text(
            `${tax.taxType} (${tax.taxRate}%)`,
            descriptionX + 10,
            y,
          );

          doc.text(tax.taxAmount.toFixed(2), amountX, y, {
            width: 75,
            align: 'right',
          });

          y += 25;
        }

        doc
          .moveTo(left, y)
          .lineTo(right, y)
          .lineWidth(1)
          .strokeColor('#cbd5e1')
          .stroke();

        y += 15;

        // Total amount
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor('#0f172a')
          .text('TOTAL AMOUNT', descriptionX + 10, y);

        doc.text(
          `INR ${invoice.totalAmount.toFixed(2)}`,
          amountX - 30,
          y,
          {
            width: 105,
            align: 'right',
          },
        );

        y += 45;

        // Invoice status
        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .fillColor('#15803d')
          .text(`Invoice Status: ${invoice.status}`, left, y);

        // Footer
        const footerY = Math.max(y + 50, 720);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor('#64748b')
          .text(
            'Thank you for choosing MusclesMaster!',
            left,
            footerY,
            {
              width: right - left,
              align: 'center',
            },
          );

        doc.text(
          'This is a computer-generated invoice.',
          left,
          footerY + 16,
          {
            width: right - left,
            align: 'center',
          },
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    },
  );

  // Save the generated PDF in private server storage.
  await fs.mkdir(invoiceDirectory, {
    recursive: true,
  });

  await fs.writeFile(filePath, pdfBuffer);

  // Save authenticated download API URL.
  invoice.pdfUrl = pdfUrl;

  await invoice.save();

  return pdfBuffer;
};
