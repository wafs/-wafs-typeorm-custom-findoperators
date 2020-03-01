import { Connection, FindOperator, FindOperatorType } from "typeorm";

interface ICreateFindOperatorOptions<T = { [key: string]: any }> {
  sql: (aliasPath: string, parameters: string[], extraOptions?: T) => string;
  useParameter?: boolean;
  multipleParameters?: boolean;
}

export const createFindOperator = <U>(options: ICreateFindOperatorOptions) => <T>(value: FindOperator<T> | T, extraOptions?: U): FindOperator<T> => {
  const toSql = (
    connection: Connection,
    aliasPath: string,
    parameters: string[]
  ) => options.sql(aliasPath, parameters, extraOptions);

  // Override the SQL statement function for the outgoing operator.
  const operator = new FindOperator("custom" as FindOperatorType, value, options.useParameter, options.multipleParameters);
  operator.toSql = toSql;

  return operator;
};
