// Journal append-only; compensating actions явно различимы.
// Память — in-memory offline prototype; в Postgres — + migrations + TTL индексы.

import type { JournalEntry, WorkflowId } from './types.ts';

export class Journal {
  private entries: JournalEntry[] = [];
  private seq = 0;

  append(input: {
    workflowId: WorkflowId;
    kind: string;
    payload: unknown;
    reversible?: boolean;
    compensationOf?: number | null;
    fencingToken?: number;
  }): JournalEntry {
    if (!input.workflowId || typeof input.workflowId !== 'string') throw new Error('workflowId required');
    if (!input.kind || typeof input.kind !== 'string') throw new Error('kind required');
    const entry: JournalEntry = {
      seq: ++this.seq,
      workflowId: input.workflowId,
      kind: input.kind,
      payload: input.payload,
      reversible: input.reversible ?? false,
      compensationOf: input.compensationOf ?? null,
      createdAt: new Date().toISOString(),
      fencingToken: input.fencingToken,
    };
    this.entries.push(entry);
    return entry;
  }

  // Компенсация: отдельная запись, compensationOf указывает на исходный seq
  appendCompensation(originalSeq: number, payload: unknown, workflowId: WorkflowId): JournalEntry {
    const orig = this.entries.find(e => e.seq === originalSeq);
    if (!orig) throw new Error('original not found');
    if (!orig.reversible) throw new Error('not reversible');
    return this.append({
      workflowId,
      kind: `compensate:${orig.kind}`,
      payload,
      reversible: false,
      compensationOf: originalSeq,
    });
  }

  list(workflowId: WorkflowId): JournalEntry[] {
    return this.entries.filter(e => e.workflowId === workflowId).sort((a, b) => a.seq - b.seq);
  }

  // append-only: удаление/изменение запрещено
  get size(): number { return this.entries.length; }
}
