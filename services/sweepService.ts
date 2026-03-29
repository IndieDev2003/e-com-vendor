import { ethers } from "ethers";
import { provider } from "../config/eth";
import { generateWallet } from "../config/wallet";
import { fundGas } from "./gasService";

const MAIN_WALLET = process.env.MAIN_WALLET_ADDRESS!;
const USDT_CONTRACT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const usdtAbi = [
  "function transfer(address to, uint amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
];

export async function sweepFunds(
  walletIndex: number,
  currency: "ETH" | "USDT",
) {
  const { privateKey, address } = generateWallet(walletIndex);
  const wallet = new ethers.Wallet(privateKey, provider);

  if (currency === "ETH") {
    const balance = await provider.getBalance(wallet.address);
    if (balance <= 0n) return;
    const gas = 21000n * (await provider.getFeeData()).gasPrice!;
    const amountToSend = balance - gas;
    if (amountToSend <= 0n) return;
    const tx = await wallet.sendTransaction({
      to: MAIN_WALLET,
      value: amountToSend,
      gasLimit: 21000,
      gasPrice: (await provider.getFeeData()).gasPrice,
    });
    console.log("🚀 ETH Swept:", tx.hash);
    return tx.hash;
  }

  // USDT
  await fundGas(wallet.address); // fund gas first
  const contract = new ethers.Contract(USDT_CONTRACT, usdtAbi, wallet);
  const balance = await contract.balanceOf(wallet.address);
  if (balance <= 0n) return;
  const tx = await contract.transfer(MAIN_WALLET, balance);
  console.log("🚀 USDT Swept:", tx.hash);
  return tx.hash;
}
