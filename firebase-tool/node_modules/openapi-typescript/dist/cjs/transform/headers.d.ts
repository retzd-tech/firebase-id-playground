import type { GlobalContext, HeaderObject } from "../types";
interface TransformHeadersOptions extends GlobalContext {
    required: Set<string>;
}
export declare function transformHeaderObjMap(headerMap: Record<string, HeaderObject>, options: TransformHeadersOptions): string;
export {};
