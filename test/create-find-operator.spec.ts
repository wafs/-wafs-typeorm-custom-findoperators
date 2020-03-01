import { Connection, createConnection, Not } from "typeorm";
import { createFindOperator } from "../src";
import { Numeric } from "./Numeric.entity";

describe("find operator", () => {

  let connection: Connection;

  beforeAll(async () => {
    connection = await createConnection();
    await connection.synchronize(true);
  });

  afterAll(async () => {
    await connection.close();
  });

  const StrangeOperator = createFindOperator({
    sql: (aliasPath, parameters) => {
      return `${aliasPath} <::> ${parameters[0]}`;
    }
  });

  const BetweenClosedRange = createFindOperator({
    sql: (aliasPath, parameters) => {
      return `${parameters[0]} < ${aliasPath} AND ${aliasPath} < ${parameters[1]}`;
    },
    useParameter: true,
    multipleParameters: true
  });

  const BetweenRange = createFindOperator({
    sql: (aliasPath, parameters, extraOptions) => {

      const op = extraOptions?.isInclusive ? "=" : "";
      return `${parameters[0]} <${op} ${aliasPath} AND ${aliasPath} <${op} ${parameters[1]}`;
    },
    multipleParameters: true
  });


  it("should produce correctly formatted sql", async () => {
    const operator = StrangeOperator("TEST");
    expect(operator.toSql(connection, "ALIAS", [":value"])).toEqual("ALIAS <::> :value");
  });

  it("should be able execute a custom operator's sql", async () => {
    const repository = connection.getRepository(Numeric);
    await repository.save(Array.from({ length: 10 }, (_, i) => repository.create({ value: i + 1 })));


    const numbersBetweenClosedRange = await repository.find({
      where: {
        value: BetweenClosedRange([1, 10])
      }
    });
    expect(numbersBetweenClosedRange.map(item => +item.value)).toStrictEqual([2, 3, 4, 5, 6, 7, 8, 9]);
  });


  it("should allow for more complex constructors", async () => {
    const repository = connection.getRepository(Numeric);
    await repository.save(Array.from({ length: 10 }, (_, i) => repository.create({ value: i + 1 })));


    const numbersBetweenClosedRange = await repository.find({
      where: {
        value: BetweenRange([1, 10], { isInclusive: false })
      }
    });
    expect(numbersBetweenClosedRange.map(item => +item.value)).toStrictEqual([2, 3, 4, 5, 6, 7, 8, 9]);

    const numbersBetweenOpenRange = await repository.find({
      where: {
        value: BetweenRange([1, 10], { isInclusive: true })
      }
    });
    expect(numbersBetweenOpenRange.map(item => +item.value)).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("should allow for nested find operators", async () => {
    const repository = connection.getRepository(Numeric);
    await repository.save(Array.from({ length: 10 }, (_, i) => repository.create({ value: i + 1 })));

    const numbersNotBetween = await repository.find({
      where: {
        value: Not(BetweenRange([1, 10]))
      }
    });

    expect(numbersNotBetween.map(item => +item.value)).toStrictEqual([1, 10]);
  });
});
