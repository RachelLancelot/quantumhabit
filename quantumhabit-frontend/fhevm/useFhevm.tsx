"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Eip1193Provider } from "ethers";
import { createFhevmInstance, FhevmAbortError } from "./internal/fhevm";
import { FhevmInstance } from "./fhevmTypes";

export function useFhevm(parameters: {
  provider: Eip1193Provider | string | undefined;
  mockChains?: Record<number, string>;
}) {
  const { provider, mockChains: inputMockChains } = parameters;
  
  const [instance, setInstance] = useState<FhevmInstance | undefined>(undefined);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<Error | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  // Memoize mockChains to prevent unnecessary re-renders
  // Use JSON.stringify for deep comparison, but only recreate if content actually changes
  const mockChainsString = inputMockChains ? JSON.stringify(inputMockChains) : undefined;
  const mockChains = useMemo(() => inputMockChains, [mockChainsString]);

  // Stable callback for status updates
  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
  }, []);

  useEffect(() => {
    if (!provider) {
      setInstance(undefined);
      setStatus("");
      setError(undefined);
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const loadInstance = async () => {
      try {
        setError(undefined);
        setStatus("Initializing FHEVM...");

        const fhevmInstance = await createFhevmInstance({
          provider: provider,
          mockChains: mockChains,
          signal: abortController.signal,
          onStatusChange: handleStatusChange,
        });

        if (!abortController.signal.aborted) {
          setInstance(fhevmInstance);
          setStatus("FHEVM ready");
        }
      } catch (err) {
        if (err instanceof FhevmAbortError) {
          // Aborted, ignore
          return;
        }
        if (!abortController.signal.aborted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setStatus("FHEVM initialization failed");
        }
      }
    };

    loadInstance();

    return () => {
      abortController.abort();
    };
  }, [provider, mockChains, handleStatusChange]);

  return { instance, status, error };
}
