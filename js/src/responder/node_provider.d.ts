import { Node } from "../common/node";
import { Stream } from "../utils/async";
import { NodeProvider } from "../common/interfaces";
export declare abstract class LocalNode extends Node {
    _listChangeController: Stream<string>;
    readonly listStream: Stream<string>;
    onStartListListen(): void;
    onAllListCancel(): void;
    _hasListListener(): () => boolean;
    provider: NodeProvider;
    readonly path: string;
    constructor(path: string);
    callbacks: object;
}
