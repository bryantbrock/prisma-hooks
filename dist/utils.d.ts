/**
 * Serialize a JS object while preserving nested `undefined` values.
 */
export declare function serializePrismaQuery(value: any, undefinedPlaceholder?: string): string;
/**
 * Deserialize a JS object while preserving nested `undefined` values.
 */
export declare function deserializePrismaQuery(value: any, undefinedPlaceholder?: string): any;
