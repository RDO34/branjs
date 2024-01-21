# Bran

_Scalable test fixtures with ease._ 🍃

## Motivation

Does this look familiar?

```ts
const myEmployeeFixture = {
  name: 'foo';
  job: 'something';
} as unknown as EmployeeWithDetails;
```

Or maybe this?

```ts
const myEmployeeFixture: EmployeeWithDetails = {
  name: 'foo';
  job: 'something';
} as any;
```

In the wise words of our beloved TypeScript:

> _"as unknown as whatever the hell you want"_

Testing is important for large systems - however spending as little time and brain power writing tests allows us to more quickly ship new features and products with confidence.

How often do we find that one test issue we've been struggling with inevitably leads back to bad test data?

Bran is a minimalist implementation of the [builder pattern](https://en.wikipedia.org/wiki/Builder_pattern) specifically for quickly and easily creating a suite of reliable and consistent test fixtures.

It aims to cut out a common time-sink and one of the main barriers to writing good tests.

Create _one_ fixture _once_ (per model) and leverage the builder pattern to effortlessly create all the variations your heart could desire whenever and wherever you need them.

Bran is:

✅ Typesafe<br />
✅ Scalable<br />
✅ Composable<br />

_Stay true to your data models kids._

## Basic Builder

Create a builder

```ts
// src/test/fixtures
import { createBuilder } from "branjs";

import { Person } from "../../models/person";

export const person = createBuilder<Person>({
  name: "Jeremy",
  age: 30,
});
```

Use it in a test

```ts
test('returns "old" when person is older than 30', () => {
  const oldPerson = person().with.age(35).build();
  expect(isOld(oldPerson)).toBe("old");
});
```

Change a value in another test

```ts
test('returns "not old!" when person is not older than 30', () => {
  const youngPerson = person().with.age(25).build();
  expect(isOld(youngPerson)).toBe("not old!");
});
```

Build multiple fixtures in one test

```ts
test("returns the name of the oldest person", () => {
  const mark = person().with.name("Mark").with.age(30).build();
  const jeremy = person().with.name("Jeremy").with.age(29).build();

  expect(getOldest(mark, jeremy)).toBe("Mark");
});
```

Note that you should only set the properties that are important to your test, and that you should always set them explicitly - otherwise run the risk of changes to the base fixture breaking your tests!

## In depth

Ok, ok, so these examples might not look so useful - do we really need all this abstraction to update a couple of properties on a POJO?

You're right! If this were I real application I wouldn't use Bran to write these tests either.

But these are not realistic examples.

Let's take a look at a something slightly more true to life.

Lets say we have the following model:

```ts
type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  dob: Date;
  addresses: Address[];
  mobile?: string;
  email?: string;
  overdueFees?: number;
};

type Order = {
  id: string;
  customerId: string;
  items: Item[];
  price: number;
  state: string;
  createdAt: Date;
  discounts: Discount[];
  deliveryOption?: DeliveryOption;
};
```

We're missing some types here, but for the purposes of this example those won't be important.

If we have test fixture builders created already for these models:

```ts
// src/test/fixtures
export const customerFixture = createBuilder<Customer>({
  id: "e6eee9f8-9aeb-47d3-b40b-55a31f5e34e9",
  firstName: "John",
  lastName: "Doe",
  dob: new Date("1984-01-01"),
  addresses: [],
  mobile: "07777777777",
  email: "john.doe@example.com",
});

export const orderFixture = createBuilder<Order>({
  id: "9f10634c-ac40-400b-9c06-93a44562eb97",
  customerId: "e6eee9f8-9aeb-47d3-b40b-55a31f5e34e9",
  items: [],
  price: 199,
  state: "PENDING",
});
```

Then we can quickly and easily create tests that involve these types:

```ts
test("returns true when the order can be dispatched", () => {
  const customer = customerFixture().with.overdueFees(0).build();
  const order = orderFixture().with.state("PENDING").build();

  expect(canDispatch(order, customer)).toBe(true);
});

test("returns false when the order is cancelled", () => {
  const customer = customerFixture().with.overdueFees(0).build();
  const order = orderFixture().with.state("CANCELLED").build();

  expect(canDispatch(order, customer)).toBe(false);
});

test("returns false when the customer has overdue fees", () => {
  const customer = customerFixture().with.overdueFees(299).build();
  const order = orderFixture().with.state("PENDING").build();

  expect(canDispatch(order, customer)).toBe(false);
});
```

This means that:

1. We can spending our time worrying about the parts of our tests that _actually_ matter.
2. We can be confident that our tests are using data that correctly represents our data model.

## Composing fixtures

Additionally fixtures can easily be composed together.

For example if we add the following model and fixture builder to our previous example:

```ts
type Item = {
  id: string;
  name: string;
  price: number;
  isAlcohol: boolean;
};

// src/test/fixtures
const itemFixture = createBuilder<Item>({
  id: "3c1b5249-a510-45fa-84d6-4e03edb4e572",
  name: "test-product",
  price: 199,
  isAlcohol: false,
});
```

Then we can compose this with our existing order fixture builder to create more tests:

```ts
test("returns true when an order requires an ID check", () => {
  const alcoholicItem = itemFixture().with.isAlcohol(true).build();
  const order = orderFixture().with.items([alcoholicItem]).build();

  expect(requiresIdCheck(order)).toBe(true);
});

test("returns false when the customer is not allowed to check out", () => {
  const alcoholicItem = itemFixture().with.isAlcohol(true).build();
  const order = orderFixture().with.items([alcoholicItem]).build();

  const seventeenYearsAgo = new Date();
  seventeenYearsAgo.setFullYear(seventeenYearsAgo.getFullYear() - 17);

  const underageCustomer = customerFixture()
    .with.dob(seventeenYearsAgo)
    .build();

  expect(canCheckout(underageCustomer, order)).toBe(false);
});
```

## Why?

So why not just create a simple function for fixtures? Something like this:

```ts
export const createFixture = (options?: Partial<MyType>): MyType => ({
  // ...some initial fixture data
  ...options,
});
```

There's honestly nothing wrong with this approach. In fact it's probably a much better approach if your types are simple enough!

However, this can become painful when dealing with deeply nested values:

```ts
export const createFixture = (
  cb?: (initialFixture: MyType) => MyType
): MyType => {
  const initialFixture = {
    /* some initial fixture data */
  };
  return cb ? cb(initialFixture) : initialFixture;
};

// usage

const myFixture = createFixture((initialFixture) => ({
  ...initialFixture,
  some: {
    ...initialFixture.some,
    deeply: {
      ...initialFixture.some.deeply,
      nested: {
        ...initialFixture.some.deeply.nested,
        value: "foo",
      },
    },
  },
}));
```

This is a less convenient pattern that involves a lot more boilerplate. This will inevitably lead to developers creating more ad hoc fixtures in-place, often with incomplete models or forced types.

Using a deep-copy method and mutating the copy could work well as an alternative:

```ts
export const createFixture = (): MyType => {
  const initialFixture = {
    /* some initial fixture data */
  };
  return JSON.parse(JSON.stringify(initialFixture));
};

// usage

const myFixture = createFixture();
myFixture.some.deeply.nested.value = "foo";
```

Again, there is nothing wrong with this approach. Some data would be lost with this approach to deep-copying (for example dates in the initial fixture would be stringified) however other deep-copy methods are available.

In fact `createBuilder` will also deep-copy the initial fixture data and could even be used in the exact same way.

However the rescursive builder API offers a highly readable and convenient way to to express the same thing.

To achieve the same effect with a builder would be trivial:

```ts
export const fixtureBuilder = createBuilder({
  // ...some initial fixture data
});

// usage

const myFixture = fixtureBuilder().with.some.deeply.nested.value("foo").build();
```

Bran offers a consistent approach for creating test fixtures that can easily scale across an app with minimal boilerplate and a highly readable implementation.

## API

The Builder API is very shallow, which makes it very easy to read and learn.

The `createBuilder` function takes a shape of type `T` (your base fixture) and returns a builder of type `IBuilder<T>`. Providing an explicit type generic is encouraged, as this will help ensure the base fixture correctly matches the model.

```ts
<T extends Record<string | symbol, any>>(initialFixture: T) =>
  () =>
    IBuilder<T>;
```

Note that the base model should not be array-like. Instead create a builder for the elements of the array and use that to populate an array.

The `createBuilder` function returns another function that will return an instance of a builder interface.

```ts
interface IBuilder<T> {
  with: RecursiveWith<T>;
  build(): T;
}
```

The builder interface includes two key properties.

`with` is the entrypoint to a recursive Proxy. It's shape matches the shape of the base model, however each property is also callable as a function of type:

```ts
(value: TProperty | (() => TProperty)) => IBuilder<T>;
```

Note that, since this is a recursive shape, `TProperty` will be the type of the current property path of the base model.

It sounds a lot more confusing than it actually is - it should feel very intuitive in practice. See the examples above to get a better feel for it.

Note that this function will always return the base builder interface, allowing for method chaining.

`build` is the function called to create the final product of the builder.

```ts
() => T;
```

It will return the fixture with all the changes made prior to the build. This is a deep copy of the initial fixture, so there is no risk of mutability and the same builder can be used to create further fixtures.
