import { PDFDocument } from 'pdf-lib';
import { drawCutMarks } from './drawCutMarks.js';
import { drawMiddleMarks } from './drawMiddleMarks.js';

/**
 * Creates a PDF spread page, embeds left/right pages, adds cut & middle marks.
 * 
 * @param {PDFDocument} doc - The PDFDocument to add page to
 * @param {Object} options
 * @param {any} leftPage - The embedded left page (optional)
 * @param {any} rightPage - The embedded right page (optional)
 * @param {number} width - Final spread width (incl. bleed)
 * @param {number} height - Final spread height (incl. bleed)
 * @param {number} marginX - X margin from edge
 * @param {number} marginY - Y margin from edge
 * @param {number} imgWidth - Width of each side image
 * @param {number} imgHeight - Height of each image
 * @param {number} bleed - Bleed size in points
 * @param {number} extraGutter - Optional center offset
 */
export function createSpreadPage(doc, {
  leftPage,
  rightPage,
  width,
  height,
  marginX,
  marginY,
  imgWidth,
  imgHeight,
  bleed,
  extraGutter = 0,
}) {
  const page = doc.addPage([width, height]);

  if (leftPage) {
    page.drawPage(leftPage, {
      x: marginX,
      y: marginY,
      width: imgWidth,
      height: imgHeight,
    });
  }

  if (rightPage) {
    page.drawPage(rightPage, {
      x: marginX + imgWidth+17.0079,
      y: marginY,
      width: imgWidth,
      height: imgHeight,
    });
  }

  drawCutMarks(page, width, height, bleed);
  drawMiddleMarks(page, {
    imgWidth,
    bleed,
    finalHeight: height,
    extraGutter,
  });

  return page;
}
