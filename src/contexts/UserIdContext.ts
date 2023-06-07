import { createContext } from "react";

// Creates a context for the generated hooks to pass extra data to the backend. Will be sent in the headers.
export const UserIdContext = createContext<string | undefined>(undefined);
