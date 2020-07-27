import { FilterStructure } from './query-structure';
import { Requester } from '../requester';
import { RemoteNode } from '../node_cache';
export declare abstract class QueryFilter {
    static create(requester: Requester, path: string, onChange: () => void, filter: FilterStructure, summary?: RemoteNode, timeoutMs?: number): QueryFilter;
    requester: Requester;
    path: string;
    summary: RemoteNode;
    onChange: () => void;
    timeoutMs: number;
    abstract start(): void;
    /**
     * @returns [matched, ready]
     */
    abstract check(): [boolean, boolean];
    abstract destroy(): void;
}
