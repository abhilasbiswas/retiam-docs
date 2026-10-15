import type { ApiEntry } from '../data/references';
import type { SearchRecord } from '../types';

export function compactApiEntries(entries: ApiEntry[]): unknown;
export function expandApiEntries(payload: unknown): ApiEntry[];
export function compactSearchRecords(records: SearchRecord[]): unknown;
export function expandSearchRecords(payload: unknown): SearchRecord[];
