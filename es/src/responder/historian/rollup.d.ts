export interface Rollup {
    update(value: any): void;
    reset(): void;
    getValue(): any;
}
export declare function getRollup(rollup: string): Rollup;
