import { PDFDocument, rgb } from 'pdf-lib';

/**
 * Merges multiple PDF files into a single PDF.
 * @param pdfFiles Array of Uint8Array representing PDF files.
 * @returns Uint8Array of the merged PDF.
 */
export async function mergePDFs(pdfFiles: Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  
  for (const pdfBytes of pdfFiles) {
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  
  return await mergedPdf.save();
}

/**
 * Converts images to a single PDF.
 * @param images Array of Uint8Array representing image files.
 * @returns Uint8Array of the generated PDF.
 */
export async function imagesToPDF(images: { bytes: Uint8Array, type: string }[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  for (const imgData of images) {
    let image;
    if (imgData.type === 'image/jpeg' || imgData.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imgData.bytes);
    } else if (imgData.type === 'image/png') {
      image = await pdfDoc.embedPng(imgData.bytes);
    } else {
      continue; // Skip unsupported formats
    }
    
    const page = pdfDoc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }
  
  return await pdfDoc.save();
}

/**
 * Adds a signature image to a specific page of a PDF.
 * @param pdfBytes Uint8Array of the PDF.
 * @param signatureBase64 Base64 string of the signature image.
 * @param pageIndex Index of the page to add the signature to.
 * @param x X coordinate (from bottom-left).
 * @param y Y coordinate (from bottom-left).
 * @param width Width of the signature.
 * @param height Height of the signature.
 * @returns Uint8Array of the signed PDF.
 */
export async function signPDF(
  pdfBytes: Uint8Array,
  signatureBase64: string,
  pageIndex: number,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const signatureImage = await pdfDoc.embedPng(signatureBase64);
  
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error('Invalid page index');
  }
  
  const page = pages[pageIndex];
  page.drawImage(signatureImage, {
    x,
    y,
    width,
    height,
  });
  
  return await pdfDoc.save();
}

/**
 * Gets the dimensions of a specific page in a PDF.
 * @param pdfBytes Uint8Array of the PDF.
 * @param pageIndex Index of the page.
 * @returns { width: number, height: number }
 */
export async function getPageDimensions(pdfBytes: Uint8Array, pageIndex: number): Promise<{ width: number, height: number }> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  if (pageIndex < 0 || pageIndex >= pages.length) {
    throw new Error('Invalid page index');
  }
  const page = pages[pageIndex];
  return {
    width: page.getWidth(),
    height: page.getHeight(),
  };
}
