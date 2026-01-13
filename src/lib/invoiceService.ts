import { supabase } from './supabase';

export interface Invoice {
  id: string;
  enrollment_id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  payment_method?: string;
  transaction_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date?: string;
  status: 'pending' | 'paid' | 'cancelled';
  pdf_url?: string;
  email_sent: boolean;
  email_sent_at?: string;
}

/**
 * Generate unique invoice number
 */
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(5, '0');
  return `INV-${year}${month}-${random}`;
}

/**
 * Create invoice for enrollment
 */
export async function createInvoice(
  enrollmentId: string,
  userId: string,
  courseId: string,
  amount: number,
  paymentMethod?: string,
  transactionId?: string
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  try {
    const invoiceNumber = generateInvoiceNumber();
    const invoiceDate = new Date();
    const dueDate = new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const { data, error } = await supabase
      .from('enrollment_invoices')
      .insert([
        {
          enrollment_id: enrollmentId,
          user_id: userId,
          course_id: courseId,
          amount,
          currency: 'UGX',
          payment_method: paymentMethod || null,
          transaction_id: transactionId || null,
          invoice_number: invoiceNumber,
          invoice_date: invoiceDate.toISOString(),
          due_date: dueDate.toISOString(),
          status: 'paid', // Auto-mark as paid if payment successful
          email_sent: false,
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, invoice: data };
  } catch (err) {
    console.error('Invoice creation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create invoice',
    };
  }
}

/**
 * Generate invoice HTML for display/printing
 */
function generateInvoiceHTML(
  invoice: Invoice,
  userName: string,
  userEmail: string,
  courseName: string,
  courseCreator: string
): string {
  const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const dueDate = invoice.due_date 
    ? new Date(invoice.due_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '-';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: white;
          color: #333;
          padding: 40px;
        }
        
        .invoice {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border: 1px solid #ddd;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          border-bottom: 2px solid #007bff;
          padding-bottom: 20px;
        }
        
        .company {
          flex: 1;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: #007bff;
          margin-bottom: 5px;
        }
        
        .company-details {
          font-size: 12px;
          color: #666;
          line-height: 1.6;
        }
        
        .invoice-title {
          text-align: right;
          flex: 1;
        }
        
        .invoice-title h1 {
          font-size: 32px;
          color: #333;
          margin-bottom: 10px;
        }
        
        .invoice-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        
        .invoice-details h3 {
          font-size: 14px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        
        .invoice-details p {
          font-size: 13px;
          color: #666;
          line-height: 1.8;
          margin-bottom: 5px;
        }
        
        .items {
          width: 100%;
          margin-bottom: 40px;
        }
        
        .items table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .items th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #dee2e6;
          font-size: 13px;
        }
        
        .items td {
          padding: 15px 12px;
          border-bottom: 1px solid #dee2e6;
          font-size: 13px;
        }
        
        .items tr:hover {
          background: #f8f9fa;
        }
        
        .text-right {
          text-align: right;
        }
        
        .summary {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 40px;
        }
        
        .summary-box {
          width: 400px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #dee2e6;
          font-size: 13px;
        }
        
        .summary-row.total {
          font-size: 18px;
          font-weight: bold;
          color: #007bff;
          border-bottom: 2px solid #007bff;
          padding: 15px 0;
        }
        
        .footer {
          border-top: 1px solid #dee2e6;
          padding-top: 20px;
          font-size: 11px;
          color: #999;
          text-align: center;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .status-paid {
          background: #d4edda;
          color: #155724;
        }
        
        .status-pending {
          background: #fff3cd;
          color: #856404;
        }
        
        @media print {
          body {
            padding: 0;
          }
          .invoice {
            border: none;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="invoice">
        <div class="header">
          <div class="company">
            <div class="company-name">Masterclass</div>
            <div class="company-details">
              <p>Professional Course Learning Platform</p>
              <p>Email: support@masterclass.local</p>
            </div>
          </div>
          <div class="invoice-title">
            <h1>INVOICE</h1>
            <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          </div>
        </div>
        
        <div class="invoice-details">
          <div>
            <h3>Bill To:</h3>
            <p><strong>${userName}</strong></p>
            <p>${userEmail}</p>
          </div>
          <div>
            <h3>Invoice Details:</h3>
            <p><strong>Date:</strong> ${invoiceDate}</p>
            <p><strong>Due Date:</strong> ${dueDate}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span></p>
          </div>
        </div>
        
        <div class="items">
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Rate</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${courseName}</strong><br>
                  <small>by ${courseCreator}</small>
                </td>
                <td class="text-right">1</td>
                <td class="text-right">UGX ${invoice.amount.toLocaleString()}</td>
                <td class="text-right">UGX ${invoice.amount.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="summary">
          <div class="summary-box">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>UGX ${invoice.amount.toLocaleString()}</span>
            </div>
            <div class="summary-row">
              <span>Tax (0%):</span>
              <span>UGX 0</span>
            </div>
            <div class="summary-row total">
              <span>Total:</span>
              <span>UGX ${invoice.amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>Thank you for your enrollment! This invoice is a record of your course enrollment transaction.</p>
          <p>For questions, please contact: support@masterclass.local</p>
          <p style="margin-top: 10px;">Generated on ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Get invoice
 */
export async function getInvoice(enrollmentId: string): Promise<Invoice | null> {
  try {
    const { data, error } = await supabase
      .from('enrollment_invoices')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (err) {
    console.error('Invoice fetch error:', err);
    return null;
  }
}

/**
 * Download invoice as HTML/print
 */
export function downloadInvoiceAsHTML(
  invoice: Invoice,
  userName: string,
  userEmail: string,
  courseName: string,
  courseCreator: string
): void {
  const htmlContent = generateInvoiceHTML(
    invoice,
    userName,
    userEmail,
    courseName,
    courseCreator
  );

  const printWindow = window.open('', '', 'width=900,height=1200');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }
}

/**
 * Mark invoice as email sent
 */
export async function markInvoiceEmailSent(invoiceId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('enrollment_invoices')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error marking invoice as sent:', err);
    return false;
  }
}

/**
 * Get user invoices
 */
export async function getUserInvoices(userId: string): Promise<Invoice[]> {
  try {
    const { data, error } = await supabase
      .from('enrollment_invoices')
      .select('*')
      .eq('user_id', userId)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Invoice list error:', err);
    return [];
  }
}
