import { ethers } from "ethers";
import { provider } from "../config/eth";

const MAIN_PRIVATE_KEY = process.env.MAIN_PRIVATE_KEY!;
const mainWallet = new ethers.Wallet(MAIN_PRIVATE_KEY, provider);

export async function fundGas(address: string) {
  const tx = await mainWallet.sendTransaction({
    to: address,
    value: ethers.parseEther("0.003"),
  });
  console.log("⛽ Gas funded:", tx.hash);
  await tx.wait();
}
