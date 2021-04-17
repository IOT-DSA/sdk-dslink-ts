/// <reference types="node" />
export declare function toBuffer(val: Uint8Array): Buffer;
export declare abstract class DsCodec {
    static _codecs: {
        [key: string]: DsCodec;
    };
    static defaultCodec: DsCodec;
    static register(name: string, codec: DsCodec): void;
    static getCodec(name: string): DsCodec;
    _blankData: any;
    get blankData(): any;
    abstract encodeFrame(val: any): any;
    abstract decodeStringFrame(input: string): any;
    abstract decodeBinaryFrame(input: Uint8Array): any;
}
export declare abstract class DsJson {
    static instance: DsJsonCodecImpl;
    static encode(val: object, pretty?: boolean): string;
    static decode(str: string): any;
    abstract encodeJson(val: any, pretty?: boolean): string;
    abstract decodeJson(str: string): any;
}
export declare class DsJsonCodecImpl extends DsCodec implements DsJson {
    static _safeEncoder(key: string, value: any): any;
    decodeJson(str: string): any;
    encodeJson(val: any, pretty?: boolean): string;
    decodeBinaryFrame(bytes: Uint8Array): any;
    static reviver(key: string, value: any): any;
    static replacer(key: string, value: any): any;
    decodeStringFrame(str: string): any;
    encodeFrame(val: object): any;
}
export declare class DsMsgPackCodecImpl extends DsCodec {
    static instance: DsMsgPackCodecImpl;
    decodeBinaryFrame(bytes: Uint8Array): any;
    decodeStringFrame(input: string): any;
    encodeFrame(val: object): any;
}
