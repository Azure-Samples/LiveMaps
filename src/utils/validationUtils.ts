import { number, NumberSchema, string, StringSchema } from 'yup';

export const notEmptyString: StringSchema<string> = string().defined().strict(true).nullable(false).min(1);

export const strictNumber: NumberSchema<number> = number()
  .transform((value, origin) => typeof origin === 'number' ? origin : NaN)
  .defined()
  .nullable(false);