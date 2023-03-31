import { OpenAPI2, OpenAPI3, ReferenceObject } from "./types";
declare type CommentObject = {
    title?: string;
    format?: string;
    deprecated?: boolean;
    description?: string;
    default?: string;
    example?: string;
};
export declare function prepareComment(v: CommentObject): string | void;
export declare function comment(text: string): string;
export declare function parseRef(ref: string): {
    url?: string;
    parts: string[];
};
export declare function isRef(obj: any): obj is ReferenceObject;
declare type SchemaObjectType = "anyOf" | "array" | "boolean" | "enum" | "number" | "object" | "oneOf" | "ref" | "string" | "unknown";
export declare function nodeType(obj: any): SchemaObjectType;
export declare function swaggerVersion(definition: OpenAPI2 | OpenAPI3): 2 | 3;
export declare function decodeRef(ref: string): string;
export declare function encodeRef(ref: string): string;
export declare function tsArrayOf(type: string): string;
export declare function tsTupleOf(types: string[]): string;
export declare function tsIntersectionOf(types: string[]): string;
export declare function tsPartial(type: string): string;
export declare function tsReadonly(immutable: boolean): string;
export declare function tsUnionOf(types: Array<string | number | boolean>): string;
export {};
