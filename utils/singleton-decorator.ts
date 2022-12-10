
export const SINGLETON_KEY = Symbol("Singleton Key");

export type Singleton<T extends new (...args: unknown[]) => unknown> = T & {
  [SINGLETON_KEY]: T extends new (...args: unknown[]) => infer I ? I : never;
};

export function singleton<T extends new (...args: unknown[]) => unknown>(
  classTarget: T
) {
  return new Proxy(classTarget, {
    construct(target: Singleton<T>, argumentsList, newTarget) {
      if (target.prototype !== newTarget.prototype) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Reflect.construct(target, argumentsList, newTarget);
      }

      if (!target[SINGLETON_KEY]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        target[SINGLETON_KEY] = Reflect.construct(
          target,
          argumentsList,
          newTarget
        );
      }

      return target[SINGLETON_KEY];
    },
  });
}
