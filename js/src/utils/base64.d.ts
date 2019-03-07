export default class Base64 {
    static encodeString(content: string): string;
    static decodeString(input: string): string;
    static encode(bytes: Uint8Array): string;
    static decode(input: string): Uint8Array;
}
