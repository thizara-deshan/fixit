import { useEffect } from 'react';

/** Adds classes to <body> while mounted (S3 phone sticky bar padding, D-6). */
export function useBodyClass(classes: string): void {
  useEffect(() => {
    const list = classes.split(/\s+/).filter(Boolean);
    document.body.classList.add(...list);
    return () => {
      document.body.classList.remove(...list);
    };
  }, [classes]);
}
