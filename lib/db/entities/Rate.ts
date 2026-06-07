import { EntitySchema } from "typeorm";

export interface Rate {
  id: number;
  name: string;
  value: number;
}

export const RateSchema = new EntitySchema<Rate>({
  name: "Rate",
  tableName: "rates",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, nullable: false },
    value: { type: "real", nullable: false },
  },
});
