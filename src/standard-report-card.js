import './standard-report-card.css';

export function buildStandardReportCard(report, confidence) {
  const tier = confidence >= 70 ? 'high' : 'medium';
  const paramCount = report.parameters.length;
  const sectionCount = report.sections.length;
  let preamble = '';
  if (tier === 'high') {
    preamble = '<div style="font-size: 14px; margin-bottom: 12px;">I found a standard report that covers this exactly:</div>';
  } else {
    preamble = '<div class="standard-report-card__recommendation">There\'s also a standard report that may be relevant:</div>';
  }
  return `
    ${preamble}
    <div class="standard-report-card" data-report-id="${report.id}">
      <div class="standard-report-card__badge-row">
        <span class="standard-report-card__badge">Standard Report</span>
        <span class="standard-report-card__domain">${getDomainLabel(report.domain)}</span>
      </div>
      <div class="standard-report-card__name">${report.name}</div>
      <div class="standard-report-card__description">${report.description}</div>
      <div class="standard-report-card__meta">
        <span class="standard-report-card__chip standard-report-card__chip--info">${paramCount} parameters</span>
        <span class="standard-report-card__chip standard-report-card__chip--info">${sectionCount} sections</span>
        <span class="standard-report-card__chip standard-report-card__chip--fresh">${report.freshness}</span>
      </div>
      <button class="standard-report-card__open-btn" data-action="open-standard-report" data-report-id="${report.id}">Open Report</button>
    </div>`;
}

export function getDomainLabel(domain) {
  const labels = { 'permits-licensing': 'Permits & Licensing', 'code-enforcement': 'Code Enforcement', 'financial': 'Financial Management', 'justice': 'Justice & Public Safety', 'gis': 'GIS & Mapping', 'utilities': 'Utilities & Billing', 'hr-payroll': 'HR & Payroll' };
  return labels[domain] || domain;
}
