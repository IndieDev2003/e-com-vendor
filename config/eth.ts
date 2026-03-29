import { ethers } from "ethers";

export const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL);
