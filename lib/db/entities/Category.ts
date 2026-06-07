import { EntitySchema } from "typeorm";

export interface Category {
  id: number;
  name: string;
  monthlyTarget: number;
  sortOrder: number;
}

export const CategorySchema = new EntitySchema<Category>({
  name: "Category",
  tableName: "categories",
  columns: {
    id: { type: Number, primary: true, generated: true },
    name: { type: String, nullable: false },
    monthlyTarget: { type: Number, name: "monthly_target", nullable: false },
    sortOrder: { type: Number, name: "sort_order", nullable: false },
  },
});
