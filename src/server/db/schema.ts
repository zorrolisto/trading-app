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

export const sUser = createTable("s_user", {
  id: serial("id").primaryKey(),
  cash: numeric("cash").notNull(),
  totalCostOfStocks: numeric("total_cost_of_stocks").default("0"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt"),
});
export const inPossession = createTable("in_possession", {
  id: serial("id").primaryKey(),
  stockId: text("stock_id").notNull(),
  userId: text("user_id").notNull(),
  totalCost: numeric("total_cost").default("0"),
  quantity: numeric("quantity").default("0"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt"),
});
export const stock = createTable("stock", {
  id: serial("id").primaryKey(),
  nameInMarket: text("name_market").notNull(),
  name: text("name").notNull(),
  nameOfH5: text("h5_name").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt"),
});
export const transaction = createTable("s_transaction", {
  id: serial("id").primaryKey(),
  invested: numeric("invested").notNull(),
  stockCost: numeric("stock_cost").notNull(),
  type: text("type").notNull(),
  stockId: text("stock_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updatedAt"),
});
