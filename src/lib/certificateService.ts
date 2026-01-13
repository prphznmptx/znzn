import { supabase } from './supabase';

export interface Certificate {
  id: string;
  enrollment_id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  generated_at: string;
  download_url?: string;
  certificate_number: string;
}

/**
 * Generate a certificate number in format: CERT-YYYY-XXXXXX
 */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${year}-${randomNum}`;
}

/**
 * Generate certificate HTML/PDF content
 */
function generateCertificateHTML(
  userName: string,
  courseName: string,
  completionDate: string,
  certificateNumber: string,
  instructorName: string
): string {
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
          font-family: 'Georgia', serif;
          background: white;
          padding: 0;
        }
        
        .certificate {
          width: 1100px;
          height: 850px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border: 3px solid #d4af37;
          padding: 60px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .certificate::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.1);
        }
        
        .certificate::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.1);
        }
        
        .content {
          position: relative;
          z-index: 1;
        }
        
        .header {
          margin-bottom: 40px;
        }
        
        .title {
          font-size: 48px;
          font-weight: bold;
          color: #d4af37;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .subtitle {
          font-size: 24px;
          color: #333;
          font-style: italic;
          margin-bottom: 30px;
        }
        
        .body {
          margin-bottom: 40px;
        }
        
        .body p {
          font-size: 16px;
          color: #555;
          margin-bottom: 20px;
          line-height: 1.6;
        }
        
        .recipient-name {
          font-size: 36px;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 10px;
          text-decoration: underline;
          text-decoration-color: #d4af37;
          text-underline-offset: 8px;
        }
        
        .course-name {
          font-size: 24px;
          color: #34495e;
          margin-bottom: 15px;
          font-weight: 600;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          margin-top: 40px;
          position: relative;
          z-index: 1;
        }
        
        .signature {
          width: 200px;
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-bottom: 5px;
        }
        
        .signature-name {
          font-size: 14px;
          color: #333;
          font-weight: bold;
        }
        
        .signature-title {
          font-size: 12px;
          color: #666;
        }
        
        .certificate-number {
          font-size: 12px;
          color: #999;
          margin-top: 20px;
        }
        
        .date {
          font-size: 14px;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="content">
          <div class="header">
            <div class="title">Certificate of Completion</div>
            <div class="subtitle">This is proudly presented to</div>
          </div>
          
          <div class="body">
            <div class="recipient-name">${userName}</div>
            <p>for successfully completing</p>
            <div class="course-name">${courseName}</div>
            <p>Awarded on ${completionDate}</p>
          </div>
          
          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-name">${instructorName}</div>
              <div class="signature-title">Course Instructor</div>
            </div>
            
            <div>
              <div class="date">${completionDate}</div>
              <div class="certificate-number">Certificate #${certificateNumber}</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Create a certificate for completed course
 */
export async function createCertificate(
  enrollmentId: string,
  userId: string,
  courseId: string,
  courseName: string,
  userName: string,
  instructorName: string
): Promise<{ success: boolean; certificate?: Certificate; error?: string }> {
  try {
    const certificateNumber = generateCertificateNumber();
    const completionDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Generate certificate HTML
    const certificateHTML = generateCertificateHTML(
      userName,
      courseName,
      completionDate,
      certificateNumber,
      instructorName
    );

    // In production, you would:
    // 1. Convert HTML to PDF using a service like puppeteer or html2pdf
    // 2. Upload PDF to B2 storage
    // 3. Get public URL
    // For now, we'll create a data URL (not suitable for production)
    
    const { data, error } = await supabase
      .from('student_certificates')
      .insert([
        {
          enrollment_id: enrollmentId,
          user_id: userId,
          course_id: courseId,
          course_title: courseName,
          certificate_number: certificateNumber,
          download_url: `data:text/html;base64,${btoa(certificateHTML)}`,
          generated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update enrollment with certificate reference
    await supabase
      .from('student_enrollments')
      .update({
        certificate_id: data.id,
        certificate_generated_at: new Date().toISOString(),
      })
      .eq('id', enrollmentId);

    return { success: true, certificate: data };
  } catch (err) {
    console.error('Certificate creation error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create certificate',
    };
  }
}

/**
 * Get certificate for a user enrollment
 */
export async function getCertificate(
  enrollmentId: string
): Promise<Certificate | null> {
  try {
    const { data, error } = await supabase
      .from('student_certificates')
      .select('*')
      .eq('enrollment_id', enrollmentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (err) {
    console.error('Certificate fetch error:', err);
    return null;
  }
}

/**
 * Download certificate as HTML (for browser printing)
 */
export function downloadCertificateAsHTML(certificate: Certificate, userName: string): void {
  if (!certificate.download_url) {
    console.error('No download URL available');
    return;
  }

  // If it's a data URL, convert to HTML and print
  if (certificate.download_url.startsWith('data:')) {
    const htmlContent = atob(certificate.download_url.split(',')[1]);
    const printWindow = window.open('', '', 'width=1100,height=850');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  } else {
    // Open URL for download
    window.open(certificate.download_url, '_blank');
  }
}

/**
 * List all certificates for a user
 */
export async function getUserCertificates(userId: string): Promise<Certificate[]> {
  try {
    const { data, error } = await supabase
      .from('student_certificates')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Certificate list error:', err);
    return [];
  }
}
