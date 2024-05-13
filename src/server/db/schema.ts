// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import {
  numeric,
  pgTableCreator,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `trading-app_${name}`);

export const stockUser = createTable("stock_user", {
  id: serial("id").primaryKey(),
  cash: numeric("cash").notNull(),
  numberOfStocks: numeric("number_of_stocks").default("0"),
  totalCostOfStocks: numeric("total_cost_of_stocks").default("0"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt"),
});
