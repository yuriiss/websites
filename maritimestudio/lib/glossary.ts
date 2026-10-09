import raw from '@/data/glossary.json';
import type { IconName } from '@/components/Icon';

export type Term = { id: string; term: string; tag: string; def: string };
export type Category = { slug: string; name: string; intro: string; title: string; desc: string; terms: Term[] };

export const CATEGORIES: Category[] = (raw as { categories: Category[] }).categories;
export const TOTAL_TERMS = CATEGORIES.reduce((n, c) => n + c.terms.length, 0);

export const CARD_COPY: Record<string, string> = {
  'dynamic-positioning': 'DP class, FMEA, ASOG, CAMO, capability plots, drive-off, drift-off, thruster allocation, position reference systems and more.',
  'alternative-fuels': 'LNG, methanol, ammonia and hydrogen as fuel, FuelEU Maritime, EU ETS, CII, EEDI/EEXI, IGF Code, methane slip and more.',
  'energy-storage': 'Energy storage systems, battery management, thermal runaway, state of charge, spinning reserve, DC grids and more.',
  cybersecurity: 'IMO MSC.428(98), IACS UR E26/E27, USCG cyber rule, SBOM, OT security, threats, defences, governance — 300+ terms.',
  'autonomous-vessels': 'MASS, IMO MASS Code, autonomy degrees, remote operations centres, sensor fusion, collision avoidance, ODD and more.',
  'regulations-class': 'IMO conventions, SOLAS, MARPOL, ISM and ISPS Codes, classification societies, flag and port state control and more.',
  'training-certification': 'STCW, Certificate of Competency, DPO certification, CPD, simulator training, e-learning, competence assessment and more.',
  'vessel-operations': 'Passage planning, under-keel clearance, tonnage, offshore vessel types (PSV, AHTS, MODU), pilotage, VTS and more.',
};

export const CARD_ICON: Record<string, IconName> = {
  'dynamic-positioning': 'target',
  'alternative-fuels': 'drop',
  'energy-storage': 'battery',
  cybersecurity: 'shield',
  'autonomous-vessels': 'radar',
  'regulations-class': 'scale',
  'training-certification': 'cap',
  'vessel-operations': 'anchor',
};

export function firstLetter(term: string): string {
  const ch = term.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(ch) ? ch : '#';
}

export function groupByLetter<T extends { term: string }>(terms: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  terms.forEach((t) => {
    const k = firstLetter(t.term);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  });
  return Array.from(map.entries());
}
