export interface GooglePresenceData {
  readonly totalResults: number;
  readonly topPosition: number | null;
}

export interface KnowledgeGraphData {
  readonly hasKnowledgeGraph: boolean;
  readonly hasAnswerBox: boolean;
  readonly descriptionSource: string | null;
  readonly title: string | null;
}

export function parseGooglePresence(value: unknown): GooglePresenceData | undefined {
  if (!value || typeof value !== 'object') { return undefined; }
  const v = value as Record<string, unknown>;
  if (typeof v.totalResults !== 'number') { return undefined; }
  const pos = v.topPosition;
  if (pos !== null && typeof pos !== 'number') { return undefined; }
  return { totalResults: v.totalResults, topPosition: pos };
}

export function parseKnowledgeGraph(value: unknown): KnowledgeGraphData | undefined {
  if (!value || typeof value !== 'object') { return undefined; }
  const v = value as Record<string, unknown>;
  if (typeof v.hasKnowledgeGraph !== 'boolean') { return undefined; }
  if (typeof v.hasAnswerBox !== 'boolean') { return undefined; }
  return {
    hasKnowledgeGraph: v.hasKnowledgeGraph,
    hasAnswerBox: v.hasAnswerBox,
    descriptionSource: typeof v.descriptionSource === 'string' ? v.descriptionSource : null,
    title: typeof v.title === 'string' ? v.title : null,
  };
}

export function parseBreakdown(value: unknown): Record<string, number> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) { return undefined; }
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'number') { result[k] = v; }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}
