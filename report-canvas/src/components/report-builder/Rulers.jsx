import { useMemo } from 'react';
import { DPI } from '../../constants/pageSettings.js';

function HorizontalRuler({ pageWidthIn, zoom, scrollLeft, marginLeft, marginRight }) {
  const scale = zoom / 100;
  const ticks = useMemo(() => {
    const t = [];
    for (let i = 0; i <= pageWidthIn; i += 0.25) {
      const isMajor = i % 1 === 0;
      const isHalf = i % 0.5 === 0 && !isMajor;
      t.push({ pos: i, isMajor, isHalf, label: isMajor ? `${i}` : null });
    }
    return t;
  }, [pageWidthIn]);

  return (
    <div className="ruler ruler-horizontal">
      <div
        className="ruler-track"
        style={{ transform: `translateX(${-scrollLeft}px)` }}
      >
        {ticks.map(t => (
          <div
            key={t.pos}
            className={`ruler-tick${t.isMajor ? ' major' : ''}${t.isHalf ? ' half' : ''}`}
            style={{ left: t.pos * DPI * scale }}
          >
            {t.label && <span className="ruler-label">{t.label}</span>}
          </div>
        ))}
        {/* Margin indicators */}
        <div className="ruler-margin-mark" style={{ left: marginLeft * DPI * scale }} />
        <div className="ruler-margin-mark" style={{ left: (pageWidthIn - marginRight) * DPI * scale }} />
      </div>
    </div>
  );
}

function VerticalRuler({ pageHeightIn, zoom, scrollTop, marginTop, marginBottom }) {
  const scale = zoom / 100;
  const ticks = useMemo(() => {
    const t = [];
    for (let i = 0; i <= pageHeightIn; i += 0.25) {
      const isMajor = i % 1 === 0;
      const isHalf = i % 0.5 === 0 && !isMajor;
      t.push({ pos: i, isMajor, isHalf, label: isMajor ? `${i}` : null });
    }
    return t;
  }, [pageHeightIn]);

  return (
    <div className="ruler ruler-vertical">
      <div
        className="ruler-track"
        style={{ transform: `translateY(${-scrollTop}px)` }}
      >
        {ticks.map(t => (
          <div
            key={t.pos}
            className={`ruler-tick${t.isMajor ? ' major' : ''}${t.isHalf ? ' half' : ''}`}
            style={{ top: t.pos * DPI * scale }}
          >
            {t.label && <span className="ruler-label">{t.label}</span>}
          </div>
        ))}
        <div className="ruler-margin-mark" style={{ top: marginTop * DPI * scale }} />
        <div className="ruler-margin-mark" style={{ top: (pageHeightIn - marginBottom) * DPI * scale }} />
      </div>
    </div>
  );
}

export default function Rulers({ pageDims, zoom, scrollPos, margins }) {
  return (
    <>
      <HorizontalRuler
        pageWidthIn={pageDims.widthIn}
        zoom={zoom}
        scrollLeft={scrollPos.left}
        marginLeft={margins.left}
        marginRight={margins.right}
      />
      <VerticalRuler
        pageHeightIn={pageDims.heightIn}
        zoom={zoom}
        scrollTop={scrollPos.top}
        marginTop={margins.top}
        marginBottom={margins.bottom}
      />
      <div className="ruler-corner" />
    </>
  );
}
