/**
 * Lightweight hash-based view router.
 * Swaps content inside #view-container based on the URL hash.
 */

const views = {};
let currentView = null;
let viewContainer = null;

/**
 * Register a view with the router.
 * @param {string} name — view name (e.g. 'hub', 'tira')
 * @param {{ render: (container: HTMLElement) => void, destroy?: () => void }} view
 */
export function registerView(name, view) {
  views[name] = view;
}

/** Navigate to a named view programmatically. */
export function navigateTo(viewName) {
  window.location.hash = `#/${viewName}`;
}

/** Get the currently active view name. */
export function getCurrentView() {
  return currentView;
}

/**
 * Re-render the currently active view in place.
 * Used to return to the landing view after an in-container overlay (e.g. chat)
 * has replaced #view-container's contents.
 */
export function reloadView() {
  if (!currentView || !viewContainer) return;
  if (views[currentView]?.destroy) {
    views[currentView].destroy();
  }
  viewContainer.innerHTML = '';
  views[currentView].render(viewContainer);
  document.dispatchEvent(new CustomEvent('view-changed', { detail: { view: currentView } }));
}

/** Start the router — call once after registering views. */
export function startRouter(defaultView = 'tira') {
  viewContainer = document.querySelector('#view-container');
  if (!viewContainer) {
    console.error('Router: #view-container not found');
    return;
  }

  window.addEventListener('hashchange', () => handleRoute(defaultView));
  handleRoute(defaultView);
}

function handleRoute(defaultView) {
  const hash = window.location.hash.replace('#/', '') || defaultView;
  const viewName = views[hash] ? hash : defaultView;

  if (viewName === currentView) return;

  // Destroy current view
  if (currentView && views[currentView]?.destroy) {
    views[currentView].destroy();
  }
  viewContainer.innerHTML = '';

  // Render new view
  currentView = viewName;
  views[viewName].render(viewContainer);

  // Notify app bar and other listeners
  document.dispatchEvent(new CustomEvent('view-changed', { detail: { view: viewName } }));
}
