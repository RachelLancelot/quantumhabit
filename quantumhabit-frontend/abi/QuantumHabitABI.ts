
/*
  This file is auto-generated.
  Command: 'npm run genabi'
*/
export const QuantumHabitABI = {
  "abi": [
    {
      "inputs": [],
      "name": "ZamaProtocolUnsupported",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "date",
          "type": "uint256"
        }
      ],
      "name": "CompletionRecorded",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "name",
          "type": "string"
        }
      ],
      "name": "HabitCreated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "HabitDeleted",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "HabitUpdated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "user",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "enum QuantumHabit.RewardType",
          "name": "rewardType",
          "type": "uint8"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "rewardId",
          "type": "uint256"
        }
      ],
      "name": "RewardClaimed",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "uint256[]",
          "name": "dates",
          "type": "uint256[]"
        },
        {
          "internalType": "externalEuint8[]",
          "name": "statuses",
          "type": "bytes32[]"
        },
        {
          "internalType": "bytes[]",
          "name": "proofs",
          "type": "bytes[]"
        }
      ],
      "name": "batchRecordCompletion",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "calculateCompletedDays",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "calculateCompletionPercentage",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "calculateCompletionRate",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "calculateConsecutiveDays",
      "outputs": [
        {
          "internalType": "euint32",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "uint32",
          "name": "consecutiveDays",
          "type": "uint32"
        }
      ],
      "name": "checkConsecutiveReward",
      "outputs": [
        {
          "internalType": "bool",
          "name": "eligible",
          "type": "bool"
        },
        {
          "internalType": "euint8",
          "name": "rewardAmount",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "uint8",
          "name": "milestonePercent",
          "type": "uint8"
        }
      ],
      "name": "checkMilestoneReward",
      "outputs": [
        {
          "internalType": "bool",
          "name": "eligible",
          "type": "bool"
        },
        {
          "internalType": "euint8",
          "name": "rewardAmount",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "uint8[]",
          "name": "milestonePercents",
          "type": "uint8[]"
        },
        {
          "internalType": "uint32[]",
          "name": "consecutiveTargets",
          "type": "uint32[]"
        }
      ],
      "name": "checkMultipleRewards",
      "outputs": [
        {
          "internalType": "euint8[]",
          "name": "milestoneRewards",
          "type": "bytes32[]"
        },
        {
          "internalType": "euint8[]",
          "name": "consecutiveRewards",
          "type": "bytes32[]"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "enum QuantumHabit.RewardType",
          "name": "rewardType",
          "type": "uint8"
        },
        {
          "internalType": "uint256",
          "name": "milestoneOrConsecutiveValue",
          "type": "uint256"
        }
      ],
      "name": "claimReward",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "confidentialProtocolId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "targetDays",
          "type": "uint32"
        },
        {
          "internalType": "enum QuantumHabit.HabitType",
          "name": "habitType",
          "type": "uint8"
        },
        {
          "internalType": "externalEuint8",
          "name": "completionStandard",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "createHabit",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "deleteHabit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "getCompletionDates",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "date",
          "type": "uint256"
        }
      ],
      "name": "getCompletionRecord",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "habitId",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "date",
              "type": "uint256"
            },
            {
              "internalType": "euint8",
              "name": "completionStatus",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "exists",
              "type": "bool"
            }
          ],
          "internalType": "struct QuantumHabit.CompletionRecord",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "getHabit",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "address",
              "name": "owner",
              "type": "address"
            },
            {
              "internalType": "string",
              "name": "name",
              "type": "string"
            },
            {
              "internalType": "string",
              "name": "description",
              "type": "string"
            },
            {
              "internalType": "uint32",
              "name": "targetDays",
              "type": "uint32"
            },
            {
              "internalType": "enum QuantumHabit.HabitType",
              "name": "habitType",
              "type": "uint8"
            },
            {
              "internalType": "euint8",
              "name": "completionStandard",
              "type": "bytes32"
            },
            {
              "internalType": "uint256",
              "name": "createdAt",
              "type": "uint256"
            },
            {
              "internalType": "bool",
              "name": "isActive",
              "type": "bool"
            }
          ],
          "internalType": "struct QuantumHabit.Habit",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        }
      ],
      "name": "getHabitStats",
      "outputs": [
        {
          "components": [
            {
              "internalType": "euint32",
              "name": "completedDays",
              "type": "bytes32"
            },
            {
              "internalType": "euint32",
              "name": "consecutiveDays",
              "type": "bytes32"
            },
            {
              "internalType": "euint8",
              "name": "completionRate",
              "type": "bytes32"
            },
            {
              "internalType": "euint8",
              "name": "completionPercentage",
              "type": "bytes32"
            }
          ],
          "internalType": "struct QuantumHabit.HabitStats",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserHabits",
      "outputs": [
        {
          "internalType": "uint256[]",
          "name": "",
          "type": "uint256[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "user",
          "type": "address"
        }
      ],
      "name": "getUserRewards",
      "outputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "id",
              "type": "uint256"
            },
            {
              "internalType": "uint256",
              "name": "habitId",
              "type": "uint256"
            },
            {
              "internalType": "enum QuantumHabit.RewardType",
              "name": "rewardType",
              "type": "uint8"
            },
            {
              "internalType": "uint8",
              "name": "milestonePercent",
              "type": "uint8"
            },
            {
              "internalType": "uint32",
              "name": "consecutiveDays",
              "type": "uint32"
            },
            {
              "internalType": "euint8",
              "name": "rewardAmount",
              "type": "bytes32"
            },
            {
              "internalType": "bool",
              "name": "claimed",
              "type": "bool"
            },
            {
              "internalType": "uint256",
              "name": "claimedAt",
              "type": "uint256"
            }
          ],
          "internalType": "struct QuantumHabit.Reward[]",
          "name": "",
          "type": "tuple[]"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "date",
          "type": "uint256"
        }
      ],
      "name": "isCompleted",
      "outputs": [
        {
          "internalType": "euint8",
          "name": "",
          "type": "bytes32"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "date",
          "type": "uint256"
        },
        {
          "internalType": "externalEuint8",
          "name": "completionStatus",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "recordCompletion",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "habitId",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "name",
          "type": "string"
        },
        {
          "internalType": "string",
          "name": "description",
          "type": "string"
        },
        {
          "internalType": "uint32",
          "name": "targetDays",
          "type": "uint32"
        },
        {
          "internalType": "externalEuint8",
          "name": "completionStandard",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "proof",
          "type": "bytes"
        }
      ],
      "name": "updateHabit",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
} as const;
