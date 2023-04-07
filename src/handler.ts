import { PrismaClient } from "@prisma/client";

type ModelName = keyof PrismaClient;

type HandlePrismaQueryParams<
  T extends ModelName,
  A extends keyof PrismaClient[T]
> = {
  model: T;
  action: A;
  query?: PrismaClient[T][A] extends (...args: any) => any
    ? Parameters<PrismaClient[T][A]>[0]
    : never;
  db: PrismaClient;
  count?: boolean;
};

type HandlePrismaQueryCountResult<T> = {
  _count: number;
  data: T;
};

type HandlePrismaQueryResult<T> = T extends undefined
  ? { error: string }
  : T extends Array<any>
  ? T
  : HandlePrismaQueryCountResult<T>;

type Unpromise<T> = T extends Promise<infer U> ? U : T;

export const handlePrismaQuery = async <
  T extends ModelName,
  A extends keyof PrismaClient[T]
>(
  params: HandlePrismaQueryParams<T, A>
): Promise<
  HandlePrismaQueryResult<
    Unpromise<
      PrismaClient[T][A] extends (...args: any) => any
        ? ReturnType<PrismaClient[T][A]>
        : undefined
    >
  >
> => {
  try {
    const { model, action, query, db, count } = params;
    const queryFn = query
      ? // @ts-ignore
        () => db[model][action](query)
      : // @ts-ignore
        () => db[model][action]();

    if (count) {
      const [_count, data] = await db.$transaction([
        // @ts-ignore
        db[model].count(query?.where ? { where: query.where } : undefined),
        queryFn(),
      ]);

      return { _count, data } as HandlePrismaQueryResult<any>;
    } else {
      const data = await queryFn();

      return data;
    }
  } catch (error) {
    // @ts-ignore
    const message = messages[error.code] ?? "Something went wrong.";

    // @ts-ignore
    return { error: message };
  }
};
