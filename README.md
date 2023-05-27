# 🪝 Prisma Hooks
![Build](https://github.com/bryantbrock/prisma-hooks/actions/workflows/publish.yaml/badge.svg)

100% type-safe, generated react-query hooks for quering any model in your prisma-managed database.

Built originally on a Next.js project, these hooks can be used in any project that uses a React frontend and a Node.js backend. However, if not using Next.js (particularly, if you have a separate frontend and backend), you will need to maintain a copy of the `schema.prisma` file in both your client and in your server (since we rely on it for generating the custom hooks). You will only ever run `npx prisma-hooks generate` in the client, but be sure whenever changes are made to you schema file on the server that it is also updated in the client copy. 

## Install

```
yarn add prisma-hooks
```

Or via npm

```
npm i prisma-hooks
```

## Quickstart
1. Add your api handler (any node environment works)

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
    query: req.body,
    db: prisma,
  });

  if (res.error) {
    return res.status(422).json(res);
  }

  return res.status(200).json(res);
}
```


2. Generate your 100% type-safe custom hooks on the client
> Note: a `prisma/schema.prisma` file must exist on the client, even if your client and server are separate. A schema file must be preset on the client in order for the generator to work.

```
npx prisma-hooks generate
```

3. Use your newly generated hooks!

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
...
upsertPost({
  where: { id: 1 },
  create: { name: "New Name" },
  update: { name: "Udated Name" },
});
```
A mutation action (like `createMany`) is a `useMutation` from `react-query` while a query action (like `findMany`) is a `useQuery`.

## Known issues
For some reason, development bundlers like Webpack will "forget" that the hooks were generated. If running a Next.js application, for example, you may run into the error `TypeError: (0 , prisma_hooks__WEBPACK_IMPORTED_MODULE_2__.<hook>) is not a function`. VSCode also forgets sometimes. To resolve, simply run `npx prisma-hooks generate` again or delete the `.next` folder and restart your server. In other words, clear your development caches and the generated hooks will be working once again.

## API Reference
* [`hamdlePrismaQuery`](https://github.com/bryantbrock/prisma-hooks/blob/main/src/handler.ts)
* `useFindUniqueUser`
* `useFindFirstUser`
* `useFindManyUsers`
* `useCountUser`
* `useAggregateUser`
* `useGroupByUser`
* `useUpdateUser`
* `useUpdateManyUsers`
* `useUpsertUser`
* `useDeleteUser`
* `useDeleteManyUsers`
* `useCreateUser`
* `useCreateManyUsers`
