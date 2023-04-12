#!/usr/bin/env node

import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const { argv } = yargs(hideBin(process.argv)).option("baseUrl", {
  alias: "b",
  type: "string",
  description: "The base URL to use",
});

function lowercaseFirstLetter(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

function startCase(lowercaseFirstLetterString) {
  const result = lowercaseFirstLetterString.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1).replace(/\s+/g, "");
}

function extractModels(schema) {
  const modelRegex = /model\s+(\w+)/g;
  const modelNames = [];
  let match;

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

function getSingleQuery(hookName, argsType, modelName, action) {
  return {
    hook: `
export const ${hookName} = ({ query, options } = {}) => {
  const key = ["${modelName}.${action}", query, options];

  const result = useQuery(
    key,
    () =>
      fetch("${argv.baseUrl ?? "/api"}/${lowercaseFirstLetter(
      modelName
    )}/${action}", {
        method: "POST",
        ...(query && { body: JSON.stringify(query) }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.error) {
            throw new Error(res.error);
          }
          return response;
        }),
    options
  );

  return { ...result, key };
};
`,
    type: `
export declare function ${hookName}<
  T extends ${argsType},
  U = Prisma.${modelName}GetPayload<T>
>(params?: {
    query?: T;
    options?: Omit<
    UseQueryOptions<U, { error?: string }, U, QueryKey>,
    "queryKey" | "queryFn"
    >;
}): UseQueryResult<U, { error?: string }> & { key: QueryKey };
`,
  };
}

function getManyQuery(hookName, argsType, modelName, action) {
  return {
    hook: `
export const ${hookName} = ({
  query,
  count,
  options,
} = {}) => {
  const key = ["${modelName}.${action}", query, options];
  const params = new URLSearchParams({
    ...(count ? { count: \`\${count}\` } : undefined),
  });

  const result = useQuery(
    key,
    () =>
      fetch("${argv.baseUrl ?? "/api"}/${lowercaseFirstLetter(
      modelName
    )}/${action}?" + params, {
        method: "POST",
        ...(query && { body: JSON.stringify(query) }),
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.error) {
            throw new Error(res.error);
          }
          return response;
        }),
    options
  );

  return { ...result, key };
};
`,
    type: `
export declare function ${hookName}<
  T extends ${argsType},
  U = Prisma.${modelName}GetPayload<T>,
  C extends boolean = false
>(params?: {
  count?: C;
  query?: T;
  options?: Omit<
    UseQueryOptions<ResultType<U, C>, { error?: string }, ResultType<U, C>, QueryKey>,
    "queryKey" | "queryFn"
  >;
}): UseQueryResult<ResultType<U, C>, { error?: string }> & { key: QueryKey };
`,
  };
}

function getMutation(hookName, argsType, modelName, action, isMany) {
  const returnType = isMany
    ? "{ count: number }"
    : `Prisma.${modelName}GetPayload<${argsType}>`;

  return {
    hook: `
export const ${hookName} = () => {
  return useMutation(
    async (mutation) =>
      fetch("${argv.baseUrl ?? "/api"}/${lowercaseFirstLetter(
      modelName
    )}/${action}", {
        body: JSON.stringify(mutation),
        method: "POST",
      })
        .then((res) => res.json())
        .catch()
  );
};
`,
    type: `
export declare function ${hookName}(): UseMutationResult<
  ${returnType} & { error?: string },
  never,
  ${argsType}
>;
`,
  };
}

const generateCustomHook = (modelName, action, isMutation) => {
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

const generateCustomHooksForModels = (models) => {
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
  let types = "";
  let tmp;

  for (const model of models) {
    for (const action of queryActions) {
      tmp = generateCustomHook(model, action, false);
      hooks += tmp.hook;
      types += tmp.type;
    }
    for (const action of mutationActions) {
      tmp = generateCustomHook(model, action, true);
      hooks += tmp.hook;
      types += tmp.type;
    }
  }

  return { hooks, types };
};

const tsImports = `import { QueryKey, UseQueryOptions, UseMutationResult, UseQueryResult } from "react-query";
import { Prisma } from "@prisma/client";
`;
const jsImports = `import { useQuery, useMutation } from "react-query";
`;

const tsHelpers = `
type ResultType<T, C extends boolean> = C extends true
  ? { data: T[]; _count: number }
  : T[];
`;

(async () => {
  const schema = fs.readFileSync("prisma/schema.prisma", "utf-8");
  const models = extractModels(schema);
  const { hooks, types } = generateCustomHooksForModels(models);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  fs.writeFileSync(
    join(__dirname, "..", "dist", "hooks.js"),
    jsImports + hooks
  );
  fs.writeFileSync(
    join(__dirname, "..", "dist", "hooks.d.ts"),
    tsImports + tsHelpers + types
  );

  // eslint-disable-next-line no-console
  console.log("\n🪝   Generated custom hooks successfully.\n");
  process.exit(0);
})();
