import { PrismaClient } from "@prisma/client";

type ModelName = keyof PrismaClient;

type HandlePrismaQueryParams<
  T extends ModelName,
  A extends keyof PrismaClient[T]
> = {
  model: T;
  action: A;
  query?: Parameters<PrismaClient[T][A]>[0] & { where?: any };
  db: PrismaClient;
  count?: boolean;
  debug?: boolean;
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
  const { model, action, query, db, count } = params;
  const queryFn = query
    ? () => db[model][action](query)
    : () => db[model][action]();

  if (count) {
    const [_count, data] = await db.$transaction([
      db[model].count(query?.where ? { where: query.where } : undefined),
      queryFn(),
    ]);

    return { _count, data } as HandlePrismaQueryResult<any>;
  } else {
    const data = await queryFn();

    return data;
  }
};
