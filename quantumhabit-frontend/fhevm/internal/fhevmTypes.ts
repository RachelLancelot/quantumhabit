import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";

export type FhevmRelayerSDKType = {
  initSDK: (options?: unknown) => Promise<boolean>;
  createInstance: (config: unknown) => Promise<FhevmInstance>;
  SepoliaConfig: {
    aclContractAddress: string;
    inputVerifierContractAddress: string;
    kmsContractAddress: string;
    executorContractAddress: string;
    relayerUrl: string;
  };
  __initialized__?: boolean;
};

export type FhevmWindowType = {
  relayerSDK: FhevmRelayerSDKType;
};

export type FhevmInitSDKOptions = unknown;
export type FhevmInitSDKType = (options?: FhevmInitSDKOptions) => Promise<boolean>;
export type FhevmLoadSDKType = () => Promise<void>;

