// src/report-matcher.js

export function matchStandardReports(query, visibleReports) {
  if (!query || !visibleReports.length) return [];

  const queryWords = normalize(query).split(/\s+/).filter(w => w.length > 2);

  const scored = visibleReports.map(report => {
    const targetWords = [
      ...report.matchKeywords.map(k => normalize(k)),
      normalize(report.name),
      normalize(report.description)
    ].join(' ').split(/\s+/);

    let matchCount = 0;
    for (const qw of queryWords) {
      if (targetWords.some(tw => tw.includes(qw) || qw.includes(tw))) {
        matchCount++;
      }
    }

    const confidence = queryWords.length > 0
      ? Math.round((matchCount / queryWords.length) * 100)
      : 0;

    return { report, confidence };
  });

  return scored
    .filter(s => s.confidence >= 40)
    .sort((a, b) => b.confidence - a.confidence);
}

export function getConfidenceTier(confidence) {
  if (confidence >= 70) return 'high';
  if (confidence >= 40) return 'medium';
  return 'low';
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '');
}
