import { expect, describe, it, test } from "vitest";

import { createBuilder, mergeBuilders } from "./index";

describe("Bran", () => {
  it("should return a builder object", () => {
    const builder = createBuilder({ name: "John" })();
    expect(builder).toBeDefined();
  });

  it("should return an object with a build method", () => {
    const builder = createBuilder({ name: "John" })();
    expect(builder.build).toBeDefined();
  });

  it("should return an object with a with method", () => {
    const builder = createBuilder({ name: "John" })();
    expect(builder.with).toBeDefined();
  });

  describe("builder", () => {
    it("should allow setting a property", () => {
      const builder = createBuilder({ name: "John" })();
      const result = builder.with.name("Steve").build();
      expect(result.name).toBe("Steve");
    });

    it("should allow setting a nested property", () => {
      const builder = createBuilder({
        name: "John",
        address: { city: "San Francisco" },
      });
      const result = builder().with.address.city("San Jose").build();
      expect(result.address.city).toBe("San Jose");
    });

    it("should allow setting a deeply nested property", () => {
      const builder = createBuilder({
        name: "John",
        very: { deeply: { nested: { value: "test" } } },
      });
      const result = builder().with.very.deeply.nested.value("test2").build();
      expect(result.very.deeply.nested.value).toBe("test2");
    });

    it("should allow setting an array property", () => {
      const builder = createBuilder({
        name: "John",
        orders: [{ id: "1", date: new Date() }],
      });
      const result = builder()
        .with.orders[0]({
          id: "1",
          date: new Date(),
        })
        .build();
      expect(result.orders[0].id).toBe("1");
    });

    it("should allow setting a deeply nested array property", () => {
      const builder = createBuilder({
        name: "John",
        orders: [{ id: "1", date: new Date() }],
      });
      const result = builder().with.orders[0].id("2").build();
      expect(result.orders[0].id).toBe("2");
    });

    it("should allow setting multiple properties", () => {
      const builder = createBuilder({
        name: "John",
        age: 20,
        address: {
          street: "2 Main St",
          city: "San Francisco",
        },
        orders: [{ id: "1", date: new Date() }],
        very: {
          deeply: {
            nested: {
              value: "test",
            },
          },
        },
      });
      const result = builder()
        .with.name("Steve")
        .with.age(30)
        .with.address.city("San Jose")
        .with.orders[0].id("2")
        .with.very.deeply.nested.value("test2")
        .build();
      expect(result.name).toBe("Steve");
      expect(result.age).toBe(30);
      expect(result.address.city).toBe("San Jose");
      expect(result.orders[0].id).toBe("2");
      expect(result.very.deeply.nested.value).toBe("test2");
    });

    it("should allow building multiple objects", () => {
      const builder = createBuilder({
        name: "John",
        age: 20,
        address: {
          street: "2 Main St",
          city: "San Francisco",
        },
        orders: [{ id: "1", date: new Date() }],
        very: {
          deeply: {
            nested: {
              value: "test",
            },
          },
        },
      });
      const result1 = builder()
        .with.name("Steve")
        .with.age(30)
        .with.address.city("San Jose")
        .with.orders[0].id("2")
        .with.very.deeply.nested.value("test2")
        .build();
      const result2 = builder()
        .with.name("Steve")
        .with.age(30)
        .with.address.city("San Jose")
        .with.orders[0].id("2")
        .with.very.deeply.nested.value("test2")
        .build();
      expect(result1).not.toBe(result2);
    });

    it("should allow setting a property with a function", () => {
      const builder = createBuilder({ name: "John" });
      const result = builder()
        .with.name(() => "Steve")
        .build();
      expect(result.name).toBe("Steve");
    });

    it("should allow setting a nested property with a function", () => {
      const builder = createBuilder({
        name: "John",
        address: { city: "San Francisco" },
      });
      const result = builder()
        .with.address.city(() => "San Jose")
        .build();
      expect(result.address.city).toBe("San Jose");
    });

    it("should allow setting an complete object", () => {
      const builder = createBuilder({
        name: "John",
        address: { city: "San Francisco" },
      });
      const result = builder().with.address({ city: "Buenos Aires" }).build();
      expect(result.address).toEqual({ city: "Buenos Aires" });
    });
  });

  describe("immutability", () => {
    it("should not mutate the original object", () => {
      const original = {
        name: "John",
        age: 20,
        address: {
          street: "2 Main St",
          city: "San Francisco",
        },
        orders: [{ id: "1", date: new Date() }],
        very: {
          deeply: {
            nested: {
              value: "test",
            },
          },
        },
      };
      const builder = createBuilder(original);
      builder()
        .with.name("Steve")
        .with.age(30)
        .with.address.city("San Jose")
        .with.orders[0].id("2")
        .with.very.deeply.nested.value("test2")
        .build();
      expect(original).toEqual({
        name: "John",
        age: 20,
        address: {
          street: "2 Main St",
          city: "San Francisco",
        },
        orders: [{ id: "1", date: new Date() }],
        very: {
          deeply: {
            nested: {
              value: "test",
            },
          },
        },
      });
    });

    it("should not mutate the original object when setting a property with a function", () => {
      const original = { name: "John" };
      const builder = createBuilder(original);
      builder()
        .with.name(() => "Steve")
        .build();
      expect(original).toEqual({ name: "John" });
    });
  });

  describe("optional properties", () => {
    it("should allow setting an optional property", () => {
      type Person = {
        name: string;
        age?: number;
      };
      const builder = createBuilder<Person>({ name: "John" });
      const result = builder().with.age(20).build();
      expect(result.age).toBe(20);
    });

    it("should allow setting an optional nested property", () => {
      type Person = {
        name: string;
        address?: {
          city: string;
        };
      };
      const builder = createBuilder<Person>({ name: "John" });
      const result = builder().with.address({ city: "San Francisco" }).build();
      expect(result.address?.city).toBe("San Francisco");
    });
  });

  describe("types", () => {
    it("should allow setting nullish values", () => {
      type Person = {
        name: string;
        age: number | null;
      };
      const builder = createBuilder<Person>({ name: "John", age: null });
      const result = builder().with.age(20).build();
      expect(result.age).toBe(20);
    });

    it("should allow setting undefined values", () => {
      type Person = {
        name: string;
        age: number | undefined;
      };
      const builder = createBuilder<Person>({ name: "John", age: undefined });
      const result = builder().with.age(20).build();
      expect(result.age).toBe(20);
    });

    it("should allow setting optional values", () => {
      type Person = {
        name: string;
        age?: number;
      };
      const builder = createBuilder<Person>({ name: "John" });
      const result = builder().with.age(20).build();
      expect(result.age).toBe(20);
    });

    it("should allow setting optional nested values", () => {
      type Person = {
        name: string;
        address?: {
          city: string;
        };
      };
      const builder = createBuilder<Person>({ name: "John" });
      const result = builder().with.address({ city: "San Francisco" }).build();
      expect(result.address?.city).toBe("San Francisco");
    });

    it("should allow setting date values", () => {
      type Person = {
        name: string;
        date: Date;
      };
      const builder = createBuilder<Person>({ name: "John", date: new Date() });
      const result = builder().with.date(new Date("2021-01-01")).build();
      expect(result.date).toEqual(new Date("2021-01-01"));
    });
  });

  describe("examples", () => {
    describe("ages", () => {
      type Person = {
        name: string;
        age: number;
      };

      const isOld = (person: Person) => {
        if (person.age > 30) {
          return "old";
        }

        return "not old!";
      };

      const person = createBuilder({
        name: "Jeremy",
        age: 30,
      });

      test('returns "old" when person is older than 30', () => {
        const oldPerson = person().with.age(35).build();
        expect(isOld(oldPerson)).toBe("old");
      });

      test('returns "not old!" when person is not older than 30', () => {
        const youngPerson = person().with.age(25).build();
        expect(isOld(youngPerson)).toBe("not old!");
      });

      const getOldest = (person1: Person, person2: Person) => {
        if (person1.age > person2.age) {
          return person1.name;
        }

        return person2.name;
      };

      test("returns the name of the oldest person", () => {
        const mark = person().with.name("Mark").with.age(30).build();
        const jeremy = person().with.name("Jeremy").with.age(29).build();

        expect(getOldest(mark, jeremy)).toBe("Mark");
      });
    });

    describe("ecommerce", () => {
      type Customer = {
        id: string;
        firstName: string;
        lastName: string;
        dob: Date;
        addresses: any[];
        mobile?: string;
        email?: string;
        overdueFees?: number;
      };

      type Item = {
        id: string;
        name: string;
        price: number;
        isAlcohol: boolean;
      };

      type Order = {
        id: string;
        customerId: string;
        items: Item[];
        price: number;
        state: string;
        createdAt: Date;
        discounts: any[];
        deliveryOption?: any;
      };

      const customerFixture = createBuilder<Customer>({
        id: "e6eee9f8-9aeb-47d3-b40b-55a31f5e34e9",
        firstName: "John",
        lastName: "Doe",
        dob: new Date("1984-01-01"),
        addresses: [],
        mobile: "07777777777",
        email: "john.doe@example.com",
      });

      const orderFixture = createBuilder<Order>({
        id: "9f10634c-ac40-400b-9c06-93a44562eb97",
        customerId: "e6eee9f8-9aeb-47d3-b40b-55a31f5e34e9",
        items: [],
        price: 199,
        state: "PENDING",
        createdAt: new Date(),
        discounts: [],
      });

      const canDispatch = (order: Order, customer: Customer) => {
        if (order.state === "CANCELLED") {
          return false;
        }

        if (customer.overdueFees) {
          return false;
        }

        return true;
      };

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

      const itemFixture = createBuilder<Item>({
        id: "3c1b5249-a510-45fa-84d6-4e03edb4e572",
        name: "test-product",
        price: 199,
        isAlcohol: false,
      });

      const requiresIdCheck = (order: Order) => {
        return order.items.some((item) => item.isAlcohol);
      };

      test("returns true when an order requires an ID check", () => {
        const alcoholicItem = itemFixture().with.isAlcohol(true).build();
        const order = orderFixture().with.items([alcoholicItem]).build();

        expect(requiresIdCheck(order)).toBe(true);
      });

      const canCheckout = (customer: Customer, order: Order) => {
        if (!requiresIdCheck(order)) {
          return true;
        }

        const eighteenYearsAgo = new Date();
        eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);

        return customer.dob < eighteenYearsAgo;
      };

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
    });
  });

  describe("nested builders", () => {
    describe("basic", () => {
      type Address = {
        street: string;
        city: string;
        country: string;
      };

      type Customer = {
        name: string;
        address: Address;
      };

      const addressFixture = createBuilder<Address>({
        street: "2 Main St",
        city: "San Francisco",
        country: "USA",
      });

      const customerFixture = createBuilder<Customer>({
        name: "John",
        address: addressFixture(),
      });

      it("should correctly return a fixture with a nested fixture", () => {
        const customer = customerFixture().build();
        expect(customer.address.city).toBe("San Francisco");
      });

      it("should allow setting a property on a nested fixture", () => {
        const customer = customerFixture()
          .with.address.city("San Jose")
          .build();
        expect(customer.address.city).toBe("San Jose");
      });
    });

    describe("complex", () => {
      type Address = {
        street: string;
        city: string;
        country: string;
      };

      type Customer = {
        name: string;
        address: Address;
      };

      type Order = {
        id: string;
        customer: Customer;
      };

      const addressFixture = createBuilder<Address>({
        street: "2 Main St",
        city: "San Francisco",
        country: "USA",
      });

      const customerFixture = createBuilder<Customer>({
        name: "John",
        address: addressFixture(),
      });

      const orderFixture = createBuilder<Order>({
        id: "1",
        customer: customerFixture(),
      });

      it("should correctly return a fixture with a nested fixture", () => {
        const order = orderFixture().build();
        expect(order.customer.address.city).toBe("San Francisco");
      });

      it("should allow setting a property on a nested fixture", () => {
        const order = orderFixture()
          .with.customer.address.city("San Jose")
          .build();
        expect(order.customer.address.city).toBe("San Jose");
      });
    });

    describe("deeply nested", () => {
      type Address = {
        street: string;
        city: string;
        country: string;
      };

      type Customer = {
        name: string;
        address: Address;
      };

      type Item = {
        id: string;
        name: string;
        price: number;
      };

      type Order = {
        id: string;
        customer: Customer;
        items: Item[];
      };

      const addressFixture = createBuilder<Address>({
        street: "2 Main St",
        city: "San Francisco",
        country: "USA",
      });

      const customerFixture = createBuilder<Customer>({
        name: "John",
        address: addressFixture(),
      });

      const itemFixture = createBuilder<Item>({
        id: "1",
        name: "test-product",
        price: 199,
      });

      const orderFixture = createBuilder<Order>({
        id: "1",
        customer: customerFixture(),
        items: [itemFixture()],
      });

      it("should correctly return a fixture with a deeply nested fixture", () => {
        const order = orderFixture().build();
        expect(order.customer.address.city).toBe("San Francisco");
      });

      it("should allow setting a property on a deeply nested fixture", () => {
        const order = orderFixture()
          .with.customer.address.city("San Jose")
          .build();
        expect(order.customer.address.city).toBe("San Jose");
      });

      it("should allow setting a property on a deeply nested array fixture", () => {
        const order = orderFixture()
          .with.items[0].name("test-product-2")
          .build();
        expect(order.items[0].name).toBe("test-product-2");
      });
    });
  });

  describe("merging builders", () => {
    it("should allow merging two builders", () => {
      type Address = {
        street: string;
        city: string;
        country: string;
      };

      type Customer = {
        name: string;
        address: Address;
      };

      type CustomerDetails = {
        mobile: string;
      };

      type CustomerWithMobile = Customer & CustomerDetails;

      const addressFixture = createBuilder<Address>({
        street: "2 Main St",
        city: "San Francisco",
        country: "USA",
      });

      const customerFixture = createBuilder<Customer>({
        name: "John",
        address: addressFixture(),
      });

      const customerDetailsFixture = createBuilder<CustomerDetails>({
        mobile: "07777777777",
      });

      const mergedCustomerFixture = mergeBuilders<
        Customer,
        CustomerDetails,
        CustomerWithMobile
      >(customerFixture, customerDetailsFixture);

      const customer = mergedCustomerFixture().build();
      expect(customer.mobile).toBe("07777777777");
      expect(customer.address.city).toBe("San Francisco");
    });
  });
});
