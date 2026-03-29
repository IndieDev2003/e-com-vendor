import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";

import { paymentQueue } from "../queues/paymentQueue.ts";

const serverAdapter = new ExpressAdapter();

// 👇 dashboard route
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(paymentQueue)],
  serverAdapter,
});

export { serverAdapter };


// config/bullBoard.ts
// import { ExpressAdapter } from "@bull-board/express";
// import { createBullBoard } from "@bull-board/api";
// import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
// import basicAuth from "express-basic-auth";

// import { paymentQueue } from "./redis.ts";

// const serverAdapter = new ExpressAdapter();
// serverAdapter.setBasePath("/admin/queues");

// createBullBoard({
//   queues: [new BullMQAdapter(paymentQueue)],
//   serverAdapter,
// });

// export const bullBoardMiddleware = basicAuth({
//   users: {
//     admin: process.env.BULL_BOARD_PASS || "admin123",
//   },
//   challenge: true,
//   realm: "BullMQ Dashboard",
// });

// export { serverAdapter };