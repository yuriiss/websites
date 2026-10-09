'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

// three.js loads after the page is interactive and stays mounted across routes.
const Experience = dynamic(() => import('./Experience'), { ssr: false });

export function ExperienceMount() {
  const pathname = usePathname() || '/';
  return <Experience route={pathname} />;
}
