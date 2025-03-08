import { Hono } from "hono";
import { telegramApp } from "./telegram";
import { Env } from "./env";
import { cors } from "hono/cors";

const app = new Hono<Env>();

app.use('/*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length'],
    maxAge: 86400,
}));


app.get("/", (c) => c.text("Hi"));
app.route("/", telegramApp);

export default app