export async function checkBitcoinPayment(address: string) {
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/btc/main/addrs/${address}`,
    );

    if (!res.ok) throw new Error("API error");

    const data = await res.json();

    return {
      received: data.final_balance > 0,
      confirmations: data.n_tx || 0,
      txHash: data.txrefs?.[0]?.tx_hash || null,
    };
  } catch (err) {
    console.error("Blockchain error:", err);
    return { received: false };
  }
}
