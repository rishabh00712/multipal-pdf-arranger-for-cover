import { PDFDocument, rgb } from 'pdf-lib';
import { createSpreadPage } from './createSpreadPage.js';

export async function generateSpreadPdf(buffer) {
  const originalPdf = await PDFDocument.load(buffer);
  const newPdf = await PDFDocument.create();

  const POINTS_PER_MM = 2.83465;
  const BLEED_MM = 5;
  const BLEED = BLEED_MM * POINTS_PER_MM;
  const IMG_WIDTH = 575.525;
  const IMG_HEIGHT = 575.525;
  const FINAL_WIDTH = IMG_WIDTH * 2 + BLEED * 2;
  const FINAL_HEIGHT = IMG_HEIGHT + BLEED * 2;
  const MARGIN_X = BLEED;
  const MARGIN_Y = BLEED;

  const pagePairs = [
    [16, 0]
  ];

  const uniquePages = [...new Set(pagePairs.flat().filter(p => p !== 'blank'))];
  const copiedPages = await newPdf.copyPages(originalPdf, uniquePages);
  const pageMap = {};
  uniquePages.forEach((pageNum, index) => {
    pageMap[pageNum] = copiedPages[index];
  });

  for (const [leftIdx, rightIdx] of pagePairs) {
    const [leftPage] = leftIdx !== 'blank' && pageMap[leftIdx]
      ? await newPdf.embedPages([pageMap[leftIdx]])
      : [null];

    const [rightPage] = rightIdx !== 'blank' && pageMap[rightIdx]
      ? await newPdf.embedPages([pageMap[rightIdx]])
      : [null];

    createSpreadPage(newPdf, {
      leftPage,
      rightPage,
      width: FINAL_WIDTH,
      height: FINAL_HEIGHT,
      marginX: MARGIN_X,
      marginY: 5,
      imgWidth: IMG_WIDTH,
      imgHeight: IMG_HEIGHT,
      bleed: BLEED,
      extraGutter: 0,
    });
  }

  const wrapperPdf = await PDFDocument.create();
  const finalPages = await wrapperPdf.copyPages(newPdf, newPdf.getPageIndices());

  const WRAP_PADDING = 30;
  const WRAP_WIDTH = FINAL_WIDTH + WRAP_PADDING * 2;
  const WRAP_HEIGHT = FINAL_HEIGHT + WRAP_PADDING * 2;

  for (const page of finalPages) {
    const wrapperPage = wrapperPdf.addPage([WRAP_WIDTH, WRAP_HEIGHT]);

    // ✅ Fill black background
    wrapperPage.drawRectangle({
      x: 0,
      y: 0,
      width: WRAP_WIDTH,
      height: WRAP_HEIGHT,
      color: rgb(0, 0, 0),
    });

    const [embeddedPage] = await wrapperPdf.embedPages([page]);
    wrapperPage.drawPage(embeddedPage, {
      x: (WRAP_WIDTH - FINAL_WIDTH) / 2,
      y: (WRAP_HEIGHT - FINAL_HEIGHT) / 2,
      width: FINAL_WIDTH,
      height: FINAL_HEIGHT,
    });
  }

  const finalBytes = await wrapperPdf.save();
  return finalBytes; // ✅ no local save
}
