# 🪝 Prisma Hooks
![Build](https://github.com/bryantbrock/prisma-hooks/actions/workflows/publish.yaml/badge.svg)

100% type-safe, generated react-query hooks for quering any model in your prisma-managed database.

## Install

> :warning: Requires `@prisma/client` and `react-query` to be installed

```
yarn add prisma-hooks
```

Or via npm

```
npm i prisma-hooks
```

## Quickstart

1. Generate your 100% type-safe custom hooks

```
npx prisma-hooks generate
```

2. Add your api handler (any node environment works)

```ts
// server.ts

import { prisma } from "services/prisma";
import { hamdlePrismaQuery } from "prisma-hooks";
...

// Handles requests like the following `/:model/:action?count=<boolean>`
export const handler(req) => {
  const res = await handlePrismaQuery({
    model: req.query.model,
    action: req.query.action,
    count: req.query.count ?? false,
    query: req.body.length ? JSON.parse(req.body) : undefined,
    db: prisma,
  });

  if (res.error) {
    return res.status(422).json(res);
  }

  return res.status(200).json(res);
}
```

3. Use your hooks in your client
   A mutation action (like `createMany`) is a `useMutation` from `react-query` while a query action (like `findMany`) is a `useQuery`.

```ts
// With `count` included
const { data: { data: posts = [], _count = 0 } = {}, isLoading } =
  useFindManyPosts({
    query: {
      where: { id: 1 },
      include: { comments: true },
      orderBy: { createdAt: "desc" },
    },
    options: { keepPreviousData: true, enabled: true },
    count: true,
  });
```

```ts
// Without `count` included
const { data: posts = [], isLoading } = useFindManyPosts({
  query: // ...
  options: // ...
});
```

```ts
const { mutateAsync: upsertPost, isLoading } = useUpsertPost();
upsertPost({
  where: { id: 1 },
  create: { name: "New Name" },
  update: { name: "Udated Name" },
});
```
