// Parse an uploaded CSV/XLSX into header-keyed rows. SheetJS reads both formats;
// it's dynamically imported so its weight only loads on the import screen.
import type { Row } from './import-build';

export async function parseSpreadsheet(data: ArrayBuffer): Promise<Row[]> {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(data, { type: 'array' });
  const first = wb.SheetNames[0];
  if (!first) throw new Error('That file has no sheets.');
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[first], { defval: '' });
  return raw.map((r) => {
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) out[String(k).trim()] = v == null ? '' : String(v).trim();
    return out;
  });
}
