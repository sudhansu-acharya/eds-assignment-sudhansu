export default function createConciergeShell() {
  const shell = document.createElement('div');
  shell.className = 'concierge-shell';
  const dialog = document.createElement('dialog');
  dialog.className = 'concierge-shell-panel';
  dialog.id = 'concierge-panel';
  const header = document.createElement('header');
  header.className = 'concierge-shell-header';
  const title = document.createElement('h2');
  title.id = 'concierge-panel-title';
  title.textContent = 'Ask WKND';
  dialog.setAttribute('aria-labelledby', title.id);
  const mount = document.createElement('div');
  mount.id = 'brand-concierge-mount';
  mount.className = 'brand-concierge';
  mount.setAttribute('aria-busy', 'true');
  const status = document.createElement('p');
  status.className = 'concierge-shell-status';
  status.setAttribute('role', 'status');
  status.textContent = 'Loading WKND chat...';
  let expand;
  let reopen;
  const button = (label, className, action) => {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = className;
    element.textContent = label;
    element.addEventListener('click', action);
    return element;
  };
  const focusInput = () => {
    const input = mount.querySelector('.chat-input');
    if (input) input.focus();
    else expand.focus();
  };
  const collapse = () => {
    dialog.close();
    shell.classList.remove('is-expanded');
    document.body.classList.remove('concierge-shell-open');
    dialog.show();
    focusInput();
  };
  const open = () => {
    if (shell.classList.contains('is-expanded')) return;
    dialog.close();
    shell.classList.add('is-expanded');
    dialog.showModal();
    document.body.classList.add('concierge-shell-open');
    reopen.hidden = true;
    focusInput();
  };
  expand = button('Open chat', 'concierge-shell-expand', open);
  expand.setAttribute('aria-controls', dialog.id);
  expand.setAttribute('aria-haspopup', 'dialog');
  const minimize = button('Minimize', 'concierge-shell-minimize', collapse);
  const dismiss = button('Dismiss', 'concierge-shell-dismiss', () => {
    dialog.close();
    shell.classList.remove('is-expanded');
    document.body.classList.remove('concierge-shell-open');
    reopen.hidden = false;
    reopen.focus();
  });
  reopen = button('Ask WKND', 'concierge-shell-reopen', () => {
    reopen.hidden = true;
    dialog.show();
    focusInput();
  });
  reopen.hidden = true;
  header.append(title, minimize);
  dialog.append(header, status, mount, expand, dismiss);
  shell.append(dialog, reopen);
  document.body.append(shell);
  dialog.show();
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    collapse();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog || !shell.classList.contains('is-expanded')) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) collapse();
  });
  return {
    mount,
    onEvent(event) {
      if (event.eventType === 'query:submitted') open();
      if (event.eventType === 'webclient:initialized') {
        mount.setAttribute('aria-busy', 'false');
        status.hidden = true;
        if (!mount.querySelector('.input-section')) {
          // Preserve usable chat if a vendor update changes the compact-input markup.
          shell.classList.add('input-unavailable');
          // eslint-disable-next-line no-console
          console.error('Concierge compact input markup is unavailable; use Open chat.');
        }
      }
    },
    fail() {
      mount.setAttribute('aria-busy', 'false');
      mount.hidden = true;
      status.hidden = false;
      status.textContent = 'Chat could not load. Please reload the page to try again.';
    },
  };
}
