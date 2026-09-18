// PDF text extraction using pdfjs-dist
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
if (typeof window !== 'undefined') {
  // Use unpkg or cdnjs worker matching pdfjs-dist version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
}

export interface PdfProgressInfo {
  stage: 'reading' | 'extracting';
  currentPage?: number;
  totalPages?: number;
  percent: number;
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (info: PdfProgressInfo) => void
): Promise<ExtractedPdfResult> {
  // 1. Validate file size up to 50MB
  if (file.size > MAX_PDF_SIZE_BYTES) {
    throw new Error('File is too large. Please upload a PDF smaller than 50MB.');
  }

  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = await file.arrayBuffer();
  } catch (err: any) {
    throw new Error(`Failed to read PDF file into memory: ${err?.message || 'Unknown read error'}`);
  }

  onProgress?.({ stage: 'reading', percent: 10 });

  let pdf: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    pdf = await loadingTask.promise;
  } catch (err: any) {
    const errName = err?.name || '';
    const errMsg = err?.message || String(err || '');

    if (errName === 'PasswordException' || errMsg.toLowerCase().includes('password')) {
      throw new Error('This PDF is password-protected. Please upload an unlocked PDF document.');
    }
    if (errName === 'InvalidPDFException' || errMsg.toLowerCase().includes('invalid pdf')) {
      throw new Error('The PDF file is corrupted or formatted improperly and could not be opened.');
    }
    throw new Error(`Unable to open PDF: ${errMsg || 'Invalid PDF file'}`);
  }

  const pageCount = pdf.numPages;
  if (!pageCount || pageCount === 0) {
    throw new Error('The PDF contains no pages or is empty.');
  }

  let fullText = '';

  // 2. Extract pages asynchronously, yielding every page to keep UI responsive
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    try {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item: any) => item.str)
        .filter((str: string) => str && str.trim().length > 0);

      fullText += `\n--- Page ${pageNum} ---\n` + strings.join(' ');
    } catch (pageErr: any) {
      console.warn(`Warning: Could not read text on page ${pageNum}:`, pageErr);
    }

    // Report extraction progress
    const percent = Math.round((pageNum / pageCount) * 100);
    onProgress?.({
      stage: 'extracting',
      currentPage: pageNum,
      totalPages: pageCount,
      percent,
    });

    // Yield execution to the browser event loop to prevent UI freezing
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const cleanedText = fullText.trim();
  if (!cleanedText || cleanedText.length < 20) {
    throw new Error(
      'Could not extract readable text from this PDF. The document may consist entirely of scanned images or non-selectable text. Please upload a PDF with digital text.'
    );
  }

  return {
    text: cleanedText,
    pageCount,
  };
}
