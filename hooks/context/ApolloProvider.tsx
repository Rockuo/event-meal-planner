'use client';

import { client } from "@/lib/client";
import { ApolloProvider as Provider } from "@apollo/client/react";
import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

if (true) { // todo
  // Adds messages only in a dev environment
  loadDevMessages();
  loadErrorMessages();
}

export function ApolloProvider({ children }: { children: React.ReactNode }) {
    return <Provider client={client}>{children}</Provider>;
}
