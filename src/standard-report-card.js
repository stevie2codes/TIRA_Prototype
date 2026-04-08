import './standard-report-card.css';

export function buildStandardReportCard(report, confidence) {
  const paramCount = report.parameters.length;
  const sectionCount = report.sections.length;
  const label = confidence >= 70
    ? 'Found a matching standard report'
    : 'A standard report may also cover this';

  return `
    <div class="sr-disclosure" data-report-id="${report.id}">
      <button class="sr-disclosure__toggle" type="button">
        <forge-icon name="description" class="sr-disclosure__icon"></forge-icon>
        <span class="sr-disclosure__label">${label}</span>
        <span class="sr-disclosure__badge">Standard Report</span>
        <forge-icon name="expand_more" class="sr-disclosure__arrow"></forge-icon>
      </button>
      <div class="sr-disclosure__body">
        <div class="sr-disclosure__name">${report.name}</div>
        <div class="sr-disclosure__description">${report.description}</div>
        <div class="sr-disclosure__meta">
          <span class="sr-disclosure__chip">${getDomainLabel(report.domain)}</span>
          <span class="sr-disclosure__chip">${paramCount} parameters</span>
          <span class="sr-disclosure__chip">${sectionCount} sections</span>
          <span class="sr-disclosure__chip sr-disclosure__chip--fresh">${report.freshness}</span>
        </div>
        <div class="sr-disclosure__actions">
          <forge-button variant="outlined" dense data-action="open-standard-report" data-report-id="${report.id}" type="button">
            <forge-icon slot="start" name="open_in_new"></forge-icon>
            Open Report
          </forge-button>
        </div>
      </div>
    </div>`;
}

export function getDomainLabel(domain) {
  const labels = { 'permits-licensing': 'Permits & Licensing', 'code-enforcement': 'Code Enforcement', 'financial': 'Financial Management', 'justice': 'Justice & Public Safety', 'gis': 'GIS & Mapping', 'utilities': 'Utilities & Billing', 'hr-payroll': 'HR & Payroll' };
  return labels[domain] || domain;
}

/**
 * Wires the toggle behavior on a sr-disclosure element.
 */
export function wireSRDisclosure(container) {
  const disclosures = container.querySelectorAll('.sr-disclosure');
  disclosures.forEach(disc => {
    const toggle = disc.querySelector('.sr-disclosure__toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      disc.classList.toggle('sr-disclosure--open');
    });
  });
}
