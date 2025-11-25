//////////////////////////////////////////////////////////////////////////
//
// WARNING!!
// ALWAY USE DYNAMICALLY IMPORT THIS FILE TO AVOID INCLUDING THE ENTIRE 
// FHEVM MOCK LIB IN THE FINAL PRODUCTION BUNDLE!!
//
//////////////////////////////////////////////////////////////////////////

import { JsonRpcProvider, Contract } from "ethers";
import { MockFhevmInstance } from "@fhevm/mock-utils";
import { FhevmInstance } from "../../fhevmTypes";

export const fhevmMockCreateInstance = async (parameters: {
  rpcUrl: string;
  chainId: number;
  metadata: {
    ACLAddress: `0x${string}`;
    InputVerifierAddress: `0x${string}`;
    KMSVerifierAddress: `0x${string}`;
  };
}): Promise<FhevmInstance> => {
  console.log("[fhevmMockCreateInstance] Creating mock instance with parameters:", parameters);
  
  const provider = new JsonRpcProvider(parameters.rpcUrl);
  
  // Query InputVerifier contract's EIP712 domain (v0.3.0 requirement)
  const inputVerifierContract = new Contract(
    parameters.metadata.InputVerifierAddress,
    ["function eip712Domain() external view returns (bytes1, string, string, uint256, address, bytes32, uint256[])"],
    provider
  );
  
  const domain = await inputVerifierContract.eip712Domain();
  const verifyingContractAddressInputVerification = domain[4]; // index 4 is the verifyingContract address
  const gatewayChainId = Number(domain[3]); // index 3 is the chainId
  
  console.log("[fhevmMockCreateInstance] InputVerifier EIP712 domain chainId:", gatewayChainId);
  console.log("[fhevmMockCreateInstance] verifyingContractAddressInputVerification:", verifyingContractAddressInputVerification);
  
  // v0.3.0 API: MockFhevmInstance.create requires 4th parameter 'properties'
  const instance = await MockFhevmInstance.create(
    provider,
    provider,
    {
      aclContractAddress: parameters.metadata.ACLAddress,
      chainId: parameters.chainId,
      gatewayChainId: gatewayChainId,
      inputVerifierContractAddress: parameters.metadata.InputVerifierAddress,
      kmsContractAddress: parameters.metadata.KMSVerifierAddress,
      verifyingContractAddressDecryption:
        "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
      verifyingContractAddressInputVerification:
        verifyingContractAddressInputVerification,
    },
    {
      // v0.3.0 new requirement: properties object
      inputVerifierProperties: {},
      kmsVerifierProperties: {},
    }
  );
  
  console.log("[fhevmMockCreateInstance] ✅ Mock FHEVM instance created successfully");
  
  // Type assertion: MockFhevmInstance → FhevmInstance
  return instance as unknown as FhevmInstance;
};
