import { Hono } from "hono";

import { telegramApp } from "./telegram";
import { Env } from "./env";

const app = new Hono<Env>();

app.get("/", (c) => c.text("Hi"));
app.route("/", telegramApp);

export default app;
