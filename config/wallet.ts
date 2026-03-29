import { ethers } from "ethers";

const MNEMONIC = process.env.WALLET_MNEMONIC!;
const hdNode = ethers.HDNodeWallet.fromMnemonic(MNEMONIC);

export function generateWallet(index: number) {
  const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${index}`);
  return {
    index,
    address: wallet.address,
    privateKey: wallet.privateKey,
  };
}
