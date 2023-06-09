import { createContext } from "react";

// Stringified JSON object with additional context for requests
export const Context = createContext<Record<any, any>>({});
