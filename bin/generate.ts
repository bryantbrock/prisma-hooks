#!/usr/bin/env ts-node

const fs = require("fs");
const path = require("path");

function lowercaseFirstLetter(str: string): string {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function startCase(lowercaseFirstLetterString: string): string {
  const result = lowercaseFirstLetterString.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1).replace(/\s+/g, "");
}

function extractModels(schema: string): string[] {
  const modelRegex = /model\s+(\w+)/g;
  const modelNames: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = modelRegex.exec(schema)) !== null) {
    modelNames.push(match[1]);
  }

  return modelNames.filter(
    (name) =>
      !name.includes("String") &&
      !name.includes("Int") &&
      !name.includes("Float") &&
      !name.includes("Boolean") &&
      !name.includes("DateTime")
  );
}

function getSingleQuery(
  hookName: string,
  argsType: string,
  modelName: string,
  action: string
) {
  return `
export const ${hookName} = <
  T extends ${argsType},
  U = Prisma.${modelName}GetPayload<T>
>({
  query,
  options,
}: {
  query?: T;
  options?: Omit<
  UseQueryOptions<U, { error?: string }, U, QueryKey>,
  "queryKey" | "queryFn"
>;
} = {}): UseQueryResult<U, { error?: string }> & { key: QueryKey } => {
  const key = ["${modelName}.${action}", query, options];

  const result = useQuery(
    key,
    () =>
      fetch("/api/${lowercaseFirstLetter(modelName)}/${action}", {
        method: "POST",
        ...(query && { body: JSON.stringify(query) }),
      })
        .then((res) => res.json())
        .catch(),
    options
  );

  return { ...result, key };
};
`;
}

function getManyQuery(
  hookName: string,
  argsType: string,
  modelName: string,
  action: string
) {
  return `
export const ${hookName} = <
  T extends ${argsType},
  U = Prisma.${modelName}GetPayload<T>,
  C extends boolean = false
>({
  query,
  count,
  options,
}: {
  count?: C;
  query?: T;
  options?: Omit<
    UseQueryOptions<ResultType<U, C>, { error?: string }, ResultType<U, C>, QueryKey>,
    "queryKey" | "queryFn"
  >;
} = {}): UseQueryResult<
  ResultType<U, C>,
  { error?: string }
> & { key: QueryKey } => {
  const key = ["${modelName}.${action}", query, options];
  const params = new URLSearchParams({
    ...(count ? { count: \`\${count}\` } : undefined),
  });

  const result = useQuery(
    key,
    () =>
      fetch("/api/${lowercaseFirstLetter(modelName)}/${action}?" + params, {
        method: "POST",
        ...(query && { body: JSON.stringify(query) }),
      })
        .then((res) => res.json())
        .catch(),
    options
  );

  return { ...result, key };
};
`;
}

function getMutation(
  hookName: string,
  argsType: string,
  modelName: string,
  action: string,
  isMany: boolean
) {
  const returnType = isMany
    ? "{ count: number }"
    : `Prisma.${modelName}GetPayload<${argsType}>`;

  return `
export const ${hookName} = (): UseMutationResult<
  ${returnType} & { error?: string },
  never,
  ${argsType}
> => {
  return useMutation(
    async (mutation: ${argsType}) =>
      fetch("/api/${lowercaseFirstLetter(modelName)}/${action}", {
        body: JSON.stringify(mutation),
        method: "POST",
      })
        .then((res) => res.json())
        .catch()
  );
};
`;
}

const generateCustomHook = (
  modelName: string,
  action: string,
  isMutation: boolean
) => {
  const isMany = action.includes("Many");
  const isCount = action === "count";
  const isAggregate = action === "aggregate";
  const isGroupBy = action === "groupBy";

  const displayAction = startCase(action);
  const hookName = `use${displayAction}${isMany ? `${modelName}s` : modelName}`;
  const argsType = `Prisma.${modelName}${
    isCount || isAggregate || isGroupBy ? "" : displayAction
  }Args`;

  if (isMutation) {
    return getMutation(hookName, argsType, modelName, action, isMany);
  }

  if (isMany) {
    return getManyQuery(hookName, argsType, modelName, action);
  }

  return getSingleQuery(hookName, argsType, modelName, action);
};

const generateCustomHooksForModels = (models: string[]) => {
  const queryActions = [
    "findUnique",
    "findFirst",
    "findMany",
    "count",
    "aggregate",
    "groupBy",
  ];

  const mutationActions = [
    "create",
    "createMany",
    "update",
    "updateMany",
    "delete",
    "deleteMany",
    "upsert",
  ];

  let hooks = "";

  for (const model of models) {
    for (const action of queryActions) {
      hooks += generateCustomHook(model, action, false);
    }
    for (const action of mutationActions) {
      hooks += generateCustomHook(model, action, true);
    }
  }

  return hooks;
};

const imports = `import { QueryKey, UseQueryOptions, useQuery, useMutation, UseMutationResult, UseQueryResult } from "react-query";
import { Prisma } from "@prisma/client";
`;

const helpers = `
type ResultType<T, C extends boolean> = C extends true
  ? { data: T[]; _count: number }
  : T[];
`;

(async () => {
  const schema = fs.readFileSync("prisma/schema.prisma", "utf-8");
  const models = extractModels(schema);
  const generatedHooks = generateCustomHooksForModels(models);

  fs.writeFileSync(
    path.join(__dirname, "..", "src", "hooks.ts"),
    imports + helpers + generatedHooks
  );

  // eslint-disable-next-line no-console
  console.log("\n🪝   Generated custom hooks successfully.\n");
  process.exit(0);
})();
