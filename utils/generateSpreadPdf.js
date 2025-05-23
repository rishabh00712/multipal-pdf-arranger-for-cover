import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export async function applyCoverPages(buffer) {
  // Load cover template PDF (from public/pdfs/cover_image.pdf)
  const coverTemplatePath = path.join(process.cwd(), 'public', 'pdfs', 'cover_image.pdf');
  const coverTemplateBytes = fs.readFileSync(coverTemplatePath);
  const coverPdf = await PDFDocument.load(coverTemplateBytes);

  // Load source content PDF (from buffer)
  const sourcePdf = await PDFDocument.load(buffer);

  // Create a new PDF to modify and return
  const outputPdf = await PDFDocument.create();

  // Copy the template page from cover
  const [templatePage] = await outputPdf.copyPages(coverPdf, [0]);
  const page = outputPdf.addPage(templatePage);

  const BLEED = 5 * 2.83465;
  const IMG_WIDTH = 582.525;
  const IMG_HEIGHT = 582.525;

  // Get content pages (16 and 0)
  const [page16, page0] = await outputPdf.copyPages(sourcePdf, [16, 0]);
  const [embed16] = await outputPdf.embedPages([page16]);
  const [embed0] = await outputPdf.embedPages([page0]);

  // Draw page 16 (left)
  page.drawPage(embed16, {
    x: BLEED+67,
    y: BLEED+167,
    width: IMG_WIDTH,
    height: IMG_HEIGHT,
  });

  // Draw page 0 (right)
  page.drawPage(embed0, {
    x:  BLEED + IMG_WIDTH+87,
    y: BLEED+167,
    width: IMG_WIDTH,
    height: IMG_HEIGHT,
  });

  const finalBytes = await outputPdf.save();
  return finalBytes; // 🔁 ready to send or store
}
