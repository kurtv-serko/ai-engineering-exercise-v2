import { createDb, ensureSeeded } from "@farepath/db";

import { buildServer } from "./server.js";

const PORT = Number(process.env["PORT"] ?? 3001);

const db = createDb();

const { seeded } = ensureSeeded(db);

const app = buildServer({ db, logger: true });

app
  .listen({ port: PORT, host: "127.0.0.1" })
  .then(() => {
    if (seeded) {
      app.log.info("seeded a fresh database");
    }
    app.log.info(`farepath api listening on http://127.0.0.1:${PORT}`);
  })
  .catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
