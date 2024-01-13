import React, {
  type Context,
  createContext,
  type FC,
  type PropsWithChildren,
  type ReactElement,
  useContext,
  useMemo,
} from 'react';
import { makeProp } from './makeProp';
import { capitalizeFirstOnly } from './capitalizeFirstOnly';

interface PC<N extends string, Props> {
  HookName: `use${Capitalize<N>}`;
  Provider: FC<PropsWithChildren<Props>>;
}

type PBatchInput<PK extends string, PV, Props> = (props: Props) => Record<PK, PV>;

type InferProviderKeys<F> = F extends PBatchInput<infer PK, any, any> ? PK : never;
type InferProviderValue<F, PK extends string> = F extends PBatchInput<PK, infer PV, any>
  ? PV
  : never;

type BatchProvidersHookName<K extends string> = PC<K, any>['HookName'];
type BatchProvidersComponent<I> = I extends PBatchInput<any, any, infer P>
  ? FC<PropsWithChildren<P>>
  : never;

type PBatchHooks<F extends PBatchInput<any, any, any>> = {
  [K in InferProviderKeys<F> as BatchProvidersHookName<K>]: () => InferProviderValue<F, K>;
};

type PBatch<RN extends string, F extends PBatchInput<any, any, any>> = Record<
  `${Capitalize<RN>}ComboProvider`,
  BatchProvidersComponent<F>
> &
  PBatchHooks<F>;

const missingContextValue = Symbol('Missing context');

export function makeComboProviderAndHooks<
  N extends string,
  K extends Readonly<string>,
  I extends PBatchInput<K, any, any>,
>(tag: N, keys: readonly K[], useHooks: I): PBatch<N, I> {
  const reversedKeys = [...keys].reverse();
  const contexts: Array<Context<InferProviderValue<I, K> | typeof missingContextValue>> =
    reversedKeys.map((k) => {
      const Ctx = createContext(missingContextValue);
      Ctx.displayName = `${capitalizeFirstOnly(k)}Context` as const;
      return Ctx;
    });

  const Provider: FC<PropsWithChildren> = ({ children, ...props }) => {
    const kv = useHooks(props);
    return useMemo<ReactElement>(() => {
      let last = children;
      contexts.forEach((Ctx, i) => {
        const k = reversedKeys[i];
        last = <Ctx.Provider value={kv[k]}>{last}</Ctx.Provider>;
      });
      return <>{last}</>;
    }, [
      children,
      kv,
    ]);
  };
  const rootProviderName = `${capitalizeFirstOnly(tag)}ComboProvider` as const;
  Provider.displayName = rootProviderName;

  return {
    ...makeProp(rootProviderName, Provider as BatchProvidersComponent<I>),
    ...(Object.fromEntries(
      contexts.map((Ctx, i) => {
        const k = reversedKeys[i];
        const hookName = `use${capitalizeFirstOnly(k)}` satisfies BatchProvidersHookName<K>;
        return [
          hookName,
          (() => {
            const context = useContext(Ctx);
            if (context === missingContextValue) {
              throw new Error(`${hookName} must be within ${rootProviderName}`);
            }
            return context;
          }) satisfies () => InferProviderValue<I,
            K>,
        ] as const;
      }),
    ) as PBatchHooks<I>),
  };
}
