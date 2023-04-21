import { PrismaClient } from "@prisma/client";
type ModelName = keyof PrismaClient;
type HandlePrismaQueryParams<T extends ModelName, A extends keyof PrismaClient[T]> = {
    model: T;
    action: A;
    query?: Parameters<PrismaClient[T][A]>[0] & {
        where?: any;
    };
    db: PrismaClient;
    count?: boolean;
    debug?: boolean;
};
type HandlePrismaQueryCountResult<T> = {
    _count: number;
    data: T;
};
type HandlePrismaQueryResult<T> = T extends undefined ? {
    error: string;
} : T extends Array<any> ? T : HandlePrismaQueryCountResult<T>;
type Unpromise<T> = T extends Promise<infer U> ? U : T;
export declare const handlePrismaQuery: <T extends string | number | symbol, A extends string | number | symbol>(params: HandlePrismaQueryParams<T, A>) => Promise<any>;
export {};
