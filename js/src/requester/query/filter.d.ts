import { FilterStructure } from './query-structure';
import { Requester } from '../requester';
export declare abstract class QueryFilter {
    static create(requester: Requester, path: string, onChange: () => void, filter: FilterStructure): QueryFilter;
    requester: Requester;
    path: string;
    onChange: () => void;
    abstract start(): void;
    /**
     * @returns [matched, ready]
     */
    abstract check(): [boolean, boolean];
    abstract destroy(): void;
}
