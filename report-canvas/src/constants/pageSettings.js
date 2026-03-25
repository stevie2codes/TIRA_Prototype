// Page size definitions at 96 CSS DPI
export const DPI = 96;

export const PAGE_SIZES = {
  letter: { label: 'Letter', width: 8.5, height: 11, unit: 'in' },
  a4:     { label: 'A4',     width: 8.27, height: 11.69, unit: 'in' }, // 210×297mm converted
  legal:  { label: 'Legal',  width: 8.5, height: 14, unit: 'in' },
};

export const DEFAULT_MARGINS = { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 }; // inches

export function getPageDimensions(pageSize, orientation) {
  const size = PAGE_SIZES[pageSize] || PAGE_SIZES.letter;
  const w = orientation === 'landscape' ? size.height : size.width;
  const h = orientation === 'landscape' ? size.width : size.height;
  return {
    widthIn: w,
    heightIn: h,
    widthPx: Math.round(w * DPI),
    heightPx: Math.round(h * DPI),
    label: size.label,
    unit: size.unit,
  };
}

export function getContentArea(pageSize, orientation, margins) {
  const page = getPageDimensions(pageSize, orientation);
  const m = margins || DEFAULT_MARGINS;
  return {
    widthPx: page.widthPx - Math.round((m.left + m.right) * DPI),
    heightPx: page.heightPx - Math.round((m.top + m.bottom) * DPI),
    topPx: Math.round(m.top * DPI),
    leftPx: Math.round(m.left * DPI),
  };
}
