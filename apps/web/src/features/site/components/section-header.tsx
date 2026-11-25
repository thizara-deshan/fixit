import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router';

export function SectionHeader({
  id,
  title,
  sub,
  link,
}: {
  id: string; // h2 id, used by aria-labelledby on the section
  title: string;
  sub: string;
  link?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="text-title-lg text-text">
          {title}
        </h2>
        <p className="text-body text-text-muted">{sub}</p>
      </div>
      {link && (
        <Link
          to={link.to}
          className="text-primary hover:text-primary-hover text-body-sm inline-flex min-h-11 items-center gap-1 font-bold sm:min-h-0"
        >
          {link.label} <ArrowRight aria-hidden="true" className="size-5" />
        </Link>
      )}
    </div>
  );
}
