/**
 * Report setup stepper — runs the 2-step, hybrid (chips + free text),
 * report-centric guided flow inside the chat surface. Renders steps as
 * assistant messages into `messagesEl`. Free-text answers arrive via
 * submitText() (wired to the chat input by the caller).
 *
 * Usage:
 *   const stepper = createReportSetupStepper({ messagesEl, onOpenDesigner });
 *   // wire chat input send -> stepper.submitText(text)
 */
import './report-setup-stepper.css';

const SUBJECT_CHIPS = ['Building permits', 'Department budgets', 'Code violations', 'Inspections'];
const SHOW_CHIPS = ['Permits issued', 'Fees collected', 'Applicant & address', 'Inspector'];
const ORGANIZE_CHIPS = ['District', 'Month', 'Permit type'];

export function createReportSetupStepper({ messagesEl, onOpenDesigner }) {
  const config = { subject: '', show: [], organizeBy: '' };
  let step = 1;

  function assistant(html) {
    const msg = document.createElement('forge-ai-response-message');
    const content = document.createElement('div');
    content.className = 'ai-response-content';
    content.innerHTML = html;
    msg.appendChild(content);
    messagesEl.appendChild(msg);
    scroll();
    return content;
  }

  function userBubble(text) {
    const msg = document.createElement('forge-ai-user-message');
    msg.textContent = text;
    messagesEl.appendChild(msg);
    scroll();
  }

  function scroll() {
    const c = messagesEl.closest('.chat-container') || messagesEl.parentElement;
    if (c) requestAnimationFrame(() => { c.scrollTop = c.scrollHeight; });
  }

  function chipRow(chips, { multi = false } = {}) {
    return `<div class="rss-chips">${chips
      .map(c => `<button class="rss-chip" type="button" data-chip="${c}">${c}</button>`)
      .join('')}</div>`;
  }

  function renderStep1() {
    const el = assistant(`
      <div class="rss-step">
        <span class="rss-step-meta">Step 1 of 2</span>
        <span class="rss-step-q">What's this report about?</span>
        <span class="rss-step-hint">Pick a subject or just describe it below.</span>
        ${chipRow(SUBJECT_CHIPS)}
      </div>
    `);
    el.querySelectorAll('.rss-chip').forEach(chip => {
      chip.addEventListener('click', () => answerStep1(chip.dataset.chip));
    });
  }

  function answerStep1(value) {
    config.subject = value;
    userBubble(value);
    step = 2;
    renderStep2();
  }

  function renderStep2() {
    const el = assistant(`
      <div class="rss-step">
        <span class="rss-step-meta">Step 2 of 2</span>
        <span class="rss-step-q">What should this report include?</span>
        <span class="rss-step-hint">Pick the details to show and how to organize them, or describe it.</span>
        <span class="rss-group-label">Show</span>
        ${chipRow(SHOW_CHIPS, { multi: true })}
        <span class="rss-group-label">Organize by</span>
        ${chipRow(ORGANIZE_CHIPS)}
        <div style="margin-top:6px;"><button class="rss-open-designer-btn" type="button" data-done>Build report →</button></div>
      </div>
    `);
    const showChips = Array.from(el.querySelectorAll('.rss-group-label'))[0]
      .nextElementSibling.querySelectorAll('.rss-chip');
    const organizeChips = Array.from(el.querySelectorAll('.rss-group-label'))[1]
      .nextElementSibling.querySelectorAll('.rss-chip');

    showChips.forEach(chip => chip.addEventListener('click', () => {
      const v = chip.dataset.chip;
      chip.classList.toggle('rss-chip--selected');
      if (config.show.includes(v)) config.show = config.show.filter(x => x !== v);
      else config.show.push(v);
    }));
    organizeChips.forEach(chip => chip.addEventListener('click', () => {
      organizeChips.forEach(c => c.classList.remove('rss-chip--selected'));
      chip.classList.add('rss-chip--selected');
      config.organizeBy = chip.dataset.chip;
    }));
    el.querySelector('[data-done]').addEventListener('click', () => finish());
  }

  function finish() {
    if (!config.subject) config.subject = 'New report';
    const title = config.organizeBy
      ? `${config.subject} by ${config.organizeBy}`
      : config.subject;
    const el = assistant(`
      <div class="rss-proposal">
        <div class="rss-proposal-title">${title}</div>
        <div class="rss-proposal-meta">Print-ready table${config.show.length ? ' · ' + config.show.join(', ') : ''}</div>
        <button class="rss-open-designer-btn" type="button" data-open>
          <forge-icon name="bar_chart"></forge-icon> Open in report designer
        </button>
      </div>
    `);
    el.querySelector('[data-open]').addEventListener('click', () => {
      onOpenDesigner({ ...config, title });
    });
  }

  // Free-text answers from the chat input feed the current step.
  function submitText(text) {
    const t = (text || '').trim();
    if (!t) return;
    if (step === 1) answerStep1(t);
    else { userBubble(t); /* refine: treat as extra context, no-op for prototype */ }
  }

  renderStep1();
  return { submitText };
}
