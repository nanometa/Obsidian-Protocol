import type {
  Abi,
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  EstimateContractGasParameters,
  PublicClient
} from "viem";
import { formatEther } from "viem";

const FALLBACK_ESTIMATE = "~$0.01 USDC";

export async function estimateVaultGas<
  const TAbi extends Abi | readonly unknown[],
  TFunctionName extends ContractFunctionName<TAbi, "nonpayable" | "payable">,
  TArgs extends ContractFunctionArgs<TAbi, "nonpayable" | "payable", TFunctionName>
>(
  publicClient: PublicClient | undefined,
  contractAddress: Address,
  abi: TAbi,
  functionName: TFunctionName,
  args: TArgs,
  account: Address
): Promise<string> {
  if (!publicClient) return FALLBACK_ESTIMATE;

  try {
    const parameters = {
      address: contractAddress,
      abi,
      functionName,
      args,
      account
    } as EstimateContractGasParameters<TAbi, TFunctionName, TArgs>;

    const [gasUnits, gasPrice] = await Promise.all([
      publicClient.estimateContractGas(parameters),
      publicClient.getGasPrice()
    ]);
    const gasCost = Number(formatEther(gasUnits * gasPrice));

    if (!Number.isFinite(gasCost) || gasCost <= 0) return FALLBACK_ESTIMATE;
    if (gasCost < 0.01) return FALLBACK_ESTIMATE;

    return `~$${gasCost.toFixed(2)} USDC`;
  } catch {
    return FALLBACK_ESTIMATE;
  }
}
