import { Link } from 'react-router';
import { useAuth } from '@/lib/auth-store';
import { footerColumns, viewerRole } from '../nav-config';
import { Logo } from './logo';

export function Footer({ variant = 'full' }: { variant?: 'full' | 'minimal' }) {
  const { me } = useAuth();
  return (
    <footer className="bg-footer-bg [&_a:focus-visible]:outline-primary-foreground mt-auto">
      <div className="max-w-content mx-auto px-4 pb-7 pt-14 sm:px-6 lg:px-8">
        {variant === 'full' && (
          <div className="grid grid-cols-2 gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
              <Logo inverse />
              <p className="text-label text-footer-text">Home service booking marketplace.</p>
            </div>
            {footerColumns(viewerRole(me)).map((col) => (
              <div key={col.title} className="flex flex-col gap-2.5">
                <h2 className="text-label text-primary-foreground font-bold">{col.title}</h2>
                <ul className="flex flex-col lg:gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="text-label text-footer-text hover:text-primary-foreground flex min-h-11 items-center lg:min-h-0"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        <p
          className={
            variant === 'full'
              ? 'border-footer-divider text-meta text-footer-meta mt-10 border-t pt-5'
              : 'text-meta text-footer-meta'
          }
        >
          © 2026 Fixit
        </p>
      </div>
    </footer>
  );
}
