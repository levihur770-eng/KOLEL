/** Small shared pieces: avatar, bottom sheet, top bar. */
import type { ReactNode } from 'react';
import { initials } from '../logic/names';
import { t } from '../text/en';
import { go } from './nav';

export function Avatar({ name, photo, size = 56 }: { name: string; photo?: string; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (photo) return <img className="avatar" src={photo} alt="" style={style} />;
  return (
    <span className="avatar avatar-initials" style={style} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

export function TopBar({ title, sub, back, right }: { title: string; sub?: string; back?: string; right?: ReactNode }) {
  return (
    <header className="topbar">
      {back !== undefined && (
        <button className="icon-button" aria-label={t.back} onClick={() => go(back)}>
          {'‹'}
        </button>
      )}
      <div className="topbar-title">
        <h1 dir="auto">{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {right}
    </header>
  );
}

/** A panel that slides up from the bottom, within thumb reach. */
export function Sheet({ title, sub, onClose, children }: { title: string; sub?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div>
            <h2 dir="auto">{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <button className="icon-button" aria-label={t.cancel} onClick={onClose}>
            {'×'}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
