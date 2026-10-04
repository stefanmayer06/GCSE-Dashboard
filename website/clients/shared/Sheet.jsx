import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from './circuit/Icon.jsx';

// App sheet: slides up from the bottom on phones and opens as a centred
// panel on wider screens. Renders into <body> (page wrappers keep an entrance
// transform that would pin position:fixed to the page), traps focus, closes
// on Escape or a backdrop tap, locks page scroll and restores focus.
export function useSheetFocus(onClose, open = true) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    const first = panel?.querySelector('[data-autofocus]') || panel?.querySelector('button, a[href], input, textarea, select');
    first?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const controls = [...panelRef.current.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled)')]
        .filter((element) => element.offsetParent !== null || element === document.activeElement);
      if (!controls.length) return;
      const firstControl = controls[0];
      const lastControl = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      window.setTimeout(() => {
        if (previousFocus?.isConnected && previousFocus !== document.body) previousFocus.focus();
      }, 0);
    };
  }, [open]);

  return panelRef;
}

export default function Sheet({ title, onClose, children, className = '', size = 'md', showTitle = true, footer = null }) {
  const titleId = useId();
  const panelRef = useSheetFocus(onClose);
  const node = (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        ref={panelRef}
        className={`sheet sheet-${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="sheet-handle" aria-hidden="true" />
        <header className={`sheet-head${showTitle ? '' : ' sr-only-head'}`}>
          <h2 id={titleId} className="sheet-title">{title}</h2>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={20} strokeWidth={2.4} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer ? <footer className="sheet-foot">{footer}</footer> : null}
      </section>
    </div>
  );
  return typeof document === 'undefined' ? node : createPortal(node, document.body);
}
