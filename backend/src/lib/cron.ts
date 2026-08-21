import http from "node:http";
import https from "node:https";
import { CronJob } from "cron";
import { env } from "./env";

// every 14 minutes send a GET request to the health endpoint
export const keepAliveCron = new CronJob("*/14 * * * *", function () {
  const base = env.FRONTEND_URL;
  if (!base) return;

  const url = new URL("/health", base).href;
  const client = url.startsWith("https:") ? https : http;

  client
    .get(url, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});
