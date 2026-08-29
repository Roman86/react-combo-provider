[![npm version](https://badge.fury.io/js/react-combo-provider.svg)](https://badge.fury.io/js/react-combo-provider)
[![NPM Downloads](https://img.shields.io/npm/dm/react-combo-provider)](https://www.npmjs.com/package/react-combo-provider)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/react-combo-provider)](https://bundlephobia.com/package/react-combo-provider)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-ffdd00?logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/romanjs)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-ea4aaa?logo=github-sponsors&logoColor=white)](https://github.com/sponsors/Roman86)

# react-combo-provider

A tiny (~0.7 kB minzipped, zero-dependency) function that turns a regular hook into a Context Provider and a set of typed hooks. Each generated hook gets its own Context under the hood, so components re-render only when the data they actually use changes.

## The problem

Sharing state via Context the right way takes a surprising amount of code. For every slice you need a Context, a Provider and a typed hook with a null check. To keep "writer" components from re-rendering on every data change, data and API [have to live in separate Contexts](https://www.developerway.com/posts/how-to-write-performant-react-apps-with-context). And if you want every field of your model to update independently, each field needs its own Context, Provider and hook.

The pattern is standard. The amount of code is not.

## Install

```sh
npm i react-combo-provider
```

Peer dependency: React 18 or 19.

## Usage

Define a store with one call:

```ts
// countStore.ts
import { makeComboProviderAndHooks } from 'react-combo-provider';
import { useState } from 'react';

export const { CountStoreComboProvider, useCount, useSetCount } = makeComboProviderAndHooks(
  'countStore', // base name: generates the <CountStoreComboProvider> component
  ['count', 'setCount'], // hooks to generate: useCount and useSetCount, each with its own Context
  () => {
    // a regular hook: the shared memory of the store
    const [count, setCount] = useState(0);
    return { count, setCount }; // key = hook name, value = what that hook returns
  },
);
```

That's the whole store. Use it:

```tsx
const Value = () => <div>{useCount()}</div>; // re-renders when count changes

const Increment = () => {
  const setCount = useSetCount();
  // never re-renders on count changes: setCount lives in its own Context
  return <button onClick={() => setCount((c) => c + 1)}>+1</button>;
};

const App = () => (
  // mount it wherever the state should live: app root or any subtree
  <CountStoreComboProvider>
    <Value />
    <Increment />
  </CountStoreComboProvider>
);
```

Everything is typed automatically: `useCount()` returns `number`, `useSetCount()` returns `Dispatch<SetStateAction<number>>`. The names and types of the hooks and the Provider are inferred from your code, ready to be exported right away.

<details>
<summary>The same store written by hand (what this library saves you) 🙈</summary>

```tsx
import React, {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type ReactElement,
  type SetStateAction,
  useContext,
  useState,
} from 'react';

type CountData = number;
type CountApi = Dispatch<SetStateAction<number>>;

const CountDataContext = createContext<CountData | null>(null);
CountDataContext.displayName = 'CountDataContext';

const CountApiContext = createContext<CountApi | null>(null);
CountApiContext.displayName = 'CountApiContext';

export function useCountData(): CountData {
  const context = useContext(CountDataContext);
  if (context == null) {
    throw new Error('useCountData must be within CountStoreProvider');
  }
  return context;
}

export function useCountApi(): CountApi {
  const context = useContext(CountApiContext);
  if (!context) {
    throw new Error('useCountApi must be within CountStoreProvider');
  }
  return context;
}

export function CountStoreProvider({ children }: PropsWithChildren): ReactElement {
  const [
    count,
    setCount,
  ] = useState(0);

  return (
    <CountApiContext.Provider value={setCount}>
      <CountDataContext.Provider value={count}>{children}</CountDataContext.Provider>
    </CountApiContext.Provider>
  );
}
```

Now imagine more fields in the store. And a few more stores in the app.

</details>

## Provider props

The store hook can take an argument. It becomes the props of the generated Provider:

```tsx
export const { UserStoreComboProvider, useUser } = makeComboProviderAndHooks(
  'userStore',
  ['user'],
  ({ initialName }: { initialName: string }) => ({
    user: useState({ name: initialName }),
  }),
);

// <UserStoreComboProvider initialName="Alice">...</UserStoreComboProvider>
```

## Good to know

- Calling a hook outside of its Provider throws a clear error ("useCount must be within CountStoreComboProvider") instead of silently returning undefined.
- The Provider and every Context get proper displayName values, so React DevTools show meaningful names.
- The generated Provider name always ends with "...ComboProvider" as a reminder that it stacks several Contexts inside.
- Each mounted Provider instance holds its own independent state, so the same store can be reused in multiple places (scoped stores).
