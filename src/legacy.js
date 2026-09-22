// One-way import migration. Removed strategy types never enter the current model.
export function migrateLegacyRecords(records, validateCorrections) {
  if (!Array.isArray(records) || records.length > 200) throw Error('이전 백업의 records 배열은 최대 200개입니다.');
  let removed = 0;
  const kept = [];
  for (const original of records) {
    const m = original?.method;
    if (m?.kind === 'crafting' || m?.id === 'tablet-crafting-sale' || original?.originId === 'tablet-crafting-sale') { removed++; continue; }
    if (m?.kind !== undefined && m.kind !== 'map') throw Error('이전 분류 값이 올바르지 않습니다.');
    const r = structuredClone(original);
    if (r?.method) {
      if ('corrections' in r.method) {
        validateCorrections(r.method.corrections);
        if (!Array.isArray(r.method.constraints)) throw Error('이전 백업의 주의점 배열이 필요합니다.');
        for (const c of r.method.corrections) {
          if (!r.method.constraints.some(item => item?.text === c.text && item?.sourceUrl === c.url)) {
            r.method.constraints.push({ text: c.text, evidence: null, sourceUrl: c.url });
          }
        }
        delete r.method.corrections;
      }
      delete r.method.kind;
      if (r.method.budget && 'basis' in r.method.budget) {
        if (!['map', 'batch'].includes(r.method.budget.basis)) throw Error('이전 비용 기준이 올바르지 않습니다.');
        if (r.method.budget.basis === 'batch' && r.method.budget.amount !== null) {
          r.method.notes = `${r.method.notes || ''}\n이전 묶음 비용 기록: ${r.method.budget.amount} ${r.method.budget.currency}. 지도 1회당 비용은 미확인.`.trim();
          r.method.budget.amount = null;
        }
        delete r.method.budget.basis;
      }
    }
    kept.push(r);
  }
  return { records: kept, removed };
}
