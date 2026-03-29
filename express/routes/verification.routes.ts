// routes/verificationRoutes.ts
import { Router } from "express";
import { initiateVerification } from "../controllers/verification.controller.ts";

const VerificationRouter = Router();

VerificationRouter.post("/crypto", initiateVerification);

export default VerificationRouter;
