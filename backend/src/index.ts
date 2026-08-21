import "dotenv/config";
import { env } from "@/lib/env";
import { app } from "@/app";
import { keepAliveCron } from "@/lib/cron";

app
  .listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    if (env.NODE_ENV === "production") {
      keepAliveCron.start();
    }
  })
  .on("error", (err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
