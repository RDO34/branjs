type ValueCallback<T> = () => T;

type RecursiveWith<T, TT = T> = Required<{
  [P in keyof T]: T[P] extends object | any[]
    ? RecursiveWith<T[P], TT> &
        ((value: T[P] | ValueCallback<T[P]>) => IBuilder<TT>)
    : (value: T[P] | ValueCallback<T[P]>) => IBuilder<TT>;
}>;

type IBuilder<T> = {
  with: RecursiveWith<T>;
  build(): T;
};

function deepCopy<T>(data: T): T {
  if (!data) {
    return data;
  }

  if (data instanceof Date) {
    return new Date(data.getTime()) as T;
  }

  if (Array.isArray(data)) {
    const copied: (typeof data)[number][] = [];

    for (let i = 0; i < data.length; i++) {
      copied.push(deepCopy(data[i]));
    }

    return copied as T;
  }

  if (typeof data === "object") {
    const copied = {} as T;
    const keys = Object.keys(data);

    for (let i = 0; i < keys.length; i++) {
      copied[keys[i] as keyof T] = deepCopy(data[keys[i] as keyof T]);
    }

    return copied;
  }

  return data;
}

type ProxyCallbackOptions = {
  path: string[];
  args: unknown[];
};

type ProxyCallback = (opts: ProxyCallbackOptions) => unknown;

const noop = () => {};

function createInnerProxy(callback: ProxyCallback, path: string[]) {
  const proxy: unknown = new Proxy(noop, {
    get(_obj, key) {
      if (typeof key !== "string" || key === "then") {
        return undefined;
      }
      return createInnerProxy(callback, [...path, key]);
    },
    apply(_1, _2, args) {
      const isApply = path[path.length - 1] === "apply";
      return callback({
        args: isApply ? (args.length >= 2 ? args[1] : []) : args,
        path: isApply ? path.slice(0, -1) : path,
      });
    },
  });

  return proxy;
}

const createRecursiveProxy = (callback: ProxyCallback) =>
  createInnerProxy(callback, []);

const createFlatProxy = <TFaux>(
  callback: (path: keyof TFaux & string) => any
): TFaux => {
  return new Proxy(noop, {
    get(_obj, name) {
      if (typeof name !== "string" || name === "then") {
        return undefined;
      }
      return callback(name as any);
    },
  }) as TFaux;
};

class Builder<T extends Record<string | symbol, any>> implements IBuilder<T> {
  private readonly product = {} as T;

  constructor(initialState: T) {
    this.product = deepCopy(initialState) as T;
  }

  with = createFlatProxy<RecursiveWith<T>>((key) => {
    if (this.hasOwnProperty(key)) {
      return this.product[key];
    }

    return createRecursiveProxy(({ path, args }) => {
      let current = this.product[key as keyof T];

      let value = args[0];

      if (typeof value === "function") {
        value = value();
      }

      if (!path.length) {
        this.product[key as keyof T] = value as T[keyof T];
        return this;
      }

      for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i] as keyof T];
      }

      current[path[path.length - 1] as keyof T] = value as T[keyof T];

      return this;
    });
  });

  build() {
    return deepCopy(this.product);
  }
}

const createBuilder = <T extends Record<string | symbol, any>>(
  initialState: T
): (() => IBuilder<T>) => {
  return () => new Builder(initialState);
};

export { createBuilder };
export default createBuilder;
export type { IBuilder };
