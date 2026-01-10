import { errorStore } from '../core/store';
import { ErrorEntry } from '../types';

const css = `
.dev-error-panel-root {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 999999;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #fff;
}
.dev-error-badge {
  background: #ff4757;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  transition: transform 0.2s, background 0.2s;
  user-select: none;
}
.dev-error-badge:hover { transform: translateY(-2px); background: #ff6b81; }
.dev-error-badge[data-count="0"] { background: #2f3542; opacity: 0.7; }
.dev-error-overlay {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 800px;
  height: 80vh;
  background: #1e1e2e;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.5);
  display: none;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #313244;
}
.dev-error-overlay.active { display: flex; }
.dev-error-header {
  padding: 16px 24px;
  background: #181825;
  border-bottom: 1px solid #313244;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.dev-error-header h2 { margin: 0; font-size: 1.2rem; color: #cdd6f4; }
.dev-error-close { cursor: pointer; font-size: 1.5rem; opacity: 0.6; }
.dev-error-close:hover { opacity: 1; }
.dev-error-list { flex: 1; overflow-y: auto; padding: 12px; }
.dev-error-item {
  padding: 12px 16px;
  border-radius: 8px;
  background: #313244;
  margin-bottom: 8px;
  border-left: 4px solid #f38ba8;
  cursor: pointer;
  transition: background 0.2s;
}
.dev-error-item:hover { background: #45475a; }
.dev-error-item.api { border-left-color: #fab387; }
.dev-error-item.promise { border-left-color: #f9e2af; }
.dev-error-item.console { border-left-color: #89b4fa; }
.dev-error-item-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.8rem;
  opacity: 0.7;
}
.dev-error-item-msg { font-family: monospace; word-break: break-all; white-space: pre-wrap; }
.dev-error-item-stack {
  margin-top: 10px;
  padding: 8px;
  background: #181825;
  font-size: 0.75rem;
  overflow-x: auto;
  display: none;
}
.dev-error-item.expanded .dev-error-item-stack { display: block; }
.dev-error-empty { text-align: center; padding: 40px; opacity: 0.5; }
`;

/**
 * UIの管理クラス
 */
export function mountUI() {
  if (typeof document === 'undefined') return;

  // Inject styles
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Root element
  const root = document.createElement('div');
  root.className = 'dev-error-panel-root';
  document.body.appendChild(root);

  // Badge
  const badge = document.createElement('div');
  badge.className = 'dev-error-badge';
  badge.innerHTML = '<span>Errors</span><span class="count">0</span>';
  root.appendChild(badge);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'dev-error-overlay';
  overlay.innerHTML = `
    <div class="dev-error-header">
      <h2>Dev Error Panel</h2>
      <div class="dev-error-close">&times;</div>
    </div>
    <div class="dev-error-list"></div>
  `;
  root.appendChild(overlay);

  const listContainer = overlay.querySelector('.dev-error-list') as HTMLElement;
  const closeBtn = overlay.querySelector('.dev-error-close') as HTMLElement;
  const countSpan = badge.querySelector('.count') as HTMLElement;

  // Events
  (badge as HTMLElement).onclick = () => overlay.classList.toggle('active');
  (closeBtn as HTMLElement).onclick = () => overlay.classList.remove('active');

  // Subscription
  errorStore.subscribe((errors) => {
    updateBadge(errors);
    renderList(errors);
  });

  function updateBadge(errors: ErrorEntry[]) {
    badge.setAttribute('data-count', errors.length.toString());
    countSpan.textContent = errors.length.toString();
  }

  function renderList(errors: ErrorEntry[]) {
    if (errors.length === 0) {
      listContainer.innerHTML = '<div class="dev-error-empty">No errors detected.</div>';
      return;
    }

    listContainer.innerHTML = errors.map(err => `
      <div class="dev-error-item ${err.type}" id="err-${err.id}">
        <div class="dev-error-item-header">
          <span>[${err.type.toUpperCase()}] ${err.timestamp.toLocaleTimeString()}</span>
        </div>
        <div class="dev-error-item-msg">${escapeHTML(err.message)}</div>
        ${err.stack ? `<pre class="dev-error-item-stack">${escapeHTML(err.stack)}</pre>` : ''}
      </div>
    `).join('');

    // Add click events for expansion
    listContainer.querySelectorAll('.dev-error-item').forEach(el => {
      el.addEventListener('click', () => el.classList.toggle('expanded'));
    });
  }
}

function escapeHTML(str: string) {
  return str.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m] || m));
}
