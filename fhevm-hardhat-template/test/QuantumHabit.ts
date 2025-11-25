import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { QuantumHabit, QuantumHabit__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("QuantumHabit")) as QuantumHabit__factory;
  const contract = (await factory.deploy()) as QuantumHabit;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("QuantumHabit", function () {
  let signers: Signers;
  let contract: QuantumHabit;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Habit Management", function () {
    it("should create a habit", async function () {
      const name = "Daily Exercise";
      const description = "Exercise for 30 minutes";
      const targetDays = 30;
      const habitType = 0; // Daily
      const completionStandard = 75; // 0-100 quality score

      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(completionStandard)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .createHabit(
          name,
          description,
          targetDays,
          habitType,
          encryptedStandard.handles[0],
          encryptedStandard.inputProof
        );
      await tx.wait();

      const habitId = 0;
      const habit = await contract.getHabit(habitId);
      expect(habit.owner).to.eq(signers.alice.address);
      expect(habit.name).to.eq(name);
      expect(habit.targetDays).to.eq(targetDays);
      expect(habit.isActive).to.eq(true);
    });

    it("should update a habit", async function () {
      // Create habit first
      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(75)
        .encrypt();

      let tx = await contract
        .connect(signers.alice)
        .createHabit("Old Name", "Old Desc", 30, 0, encryptedStandard.handles[0], encryptedStandard.inputProof);
      await tx.wait();

      // Update habit
      const newEncryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(80)
        .encrypt();

      tx = await contract
        .connect(signers.alice)
        .updateHabit(0, "New Name", "New Desc", 60, newEncryptedStandard.handles[0], newEncryptedStandard.inputProof);
      await tx.wait();

      const habit = await contract.getHabit(0);
      expect(habit.name).to.eq("New Name");
      expect(habit.targetDays).to.eq(60);
    });

    it("should delete a habit", async function () {
      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(75)
        .encrypt();

      let tx = await contract
        .connect(signers.alice)
        .createHabit("Test Habit", "Desc", 30, 0, encryptedStandard.handles[0], encryptedStandard.inputProof);
      await tx.wait();

      tx = await contract.connect(signers.alice).deleteHabit(0);
      await tx.wait();

      const habit = await contract.getHabit(0);
      expect(habit.isActive).to.eq(false);
    });

    it("should get user habits", async function () {
      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(75)
        .encrypt();

      let tx = await contract
        .connect(signers.alice)
        .createHabit("Habit 1", "Desc 1", 30, 0, encryptedStandard.handles[0], encryptedStandard.inputProof);
      await tx.wait();

      const encryptedStandard2 = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(80)
        .encrypt();

      tx = await contract
        .connect(signers.alice)
        .createHabit("Habit 2", "Desc 2", 60, 0, encryptedStandard2.handles[0], encryptedStandard2.inputProof);
      await tx.wait();

      const habitIds = await contract.getUserHabits(signers.alice.address);
      expect(habitIds.length).to.eq(2);
    });
  });

  describe("Completion Recording", function () {
    let habitId: number;

    beforeEach(async function () {
      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(75)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .createHabit("Test Habit", "Desc", 30, 0, encryptedStandard.handles[0], encryptedStandard.inputProof);
      await tx.wait();

      habitId = 0;
    });

    it("should record completion", async function () {
      const today = Math.floor(Date.now() / 86400000) * 86400000; // Round to day
      const completionStatus = 1; // Completed

      const encryptedStatus = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(completionStatus)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .recordCompletion(habitId, today, encryptedStatus.handles[0], encryptedStatus.inputProof);
      await tx.wait();

      const record = await contract.getCompletionRecord(habitId, today);
      expect(record.exists).to.eq(true);
    });

    it("should check if date is completed", async function () {
      const today = Math.floor(Date.now() / 86400000) * 86400000;
      const completionStatus = 1;

      const encryptedStatus = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(completionStatus)
        .encrypt();

      let tx = await contract
        .connect(signers.alice)
        .recordCompletion(habitId, today, encryptedStatus.handles[0], encryptedStatus.inputProof);
      await tx.wait();

      // isCompleted is not view, send transaction to authorize and get result
      const checkTx = await contract
        .connect(signers.alice)
        .isCompleted(habitId, today);
      await checkTx.wait();
      
      // Get result using staticCall (authorization is already done)
      const encryptedResult = await contract
        .connect(signers.alice)
        .isCompleted.staticCall(habitId, today);
      
      // The completionStatus was already authorized when recorded, so we can decrypt
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedResult,
        contractAddress,
        signers.alice
      );

      expect(Number(decrypted)).to.eq(completionStatus);
    });

    it("should batch record completions", async function () {
      const dates: number[] = [];
      const statuses: any[] = [];
      const proofs: string[] = [];

      for (let i = 0; i < 3; i++) {
        const date = Math.floor(Date.now() / 86400000) * 86400000 - i * 86400000;
        dates.push(date);

        const encryptedStatus = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add8(1)
          .encrypt();

        statuses.push(encryptedStatus.handles[0]);
        proofs.push(encryptedStatus.inputProof);
      }

      const tx = await contract
        .connect(signers.alice)
        .batchRecordCompletion(habitId, dates, statuses, proofs);
      await tx.wait();

      const completionDates = await contract.getCompletionDates(habitId);
      expect(completionDates.length).to.eq(3);
    });
  });

  describe("Statistics Calculation", function () {
    let habitId: number;

    beforeEach(async function () {
      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(75)
        .encrypt();

      const tx = await contract
        .connect(signers.alice)
        .createHabit("Test Habit", "Desc", 30, 0, encryptedStandard.handles[0], encryptedStandard.inputProof);
      await tx.wait();

      habitId = 0;
    });

    it("should calculate completed days", async function () {
      // Record 5 completions
      for (let i = 0; i < 5; i++) {
        const date = Math.floor(Date.now() / 86400000) * 86400000 - i * 86400000;
        const encryptedStatus = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add8(1)
          .encrypt();

        const tx = await contract
          .connect(signers.alice)
          .recordCompletion(habitId, date, encryptedStatus.handles[0], encryptedStatus.inputProof);
        await tx.wait();
      }

      // calculateCompletedDays is not view, send transaction to get result and authorize
      const tx = await contract
        .connect(signers.alice)
        .calculateCompletedDays(habitId);
      await tx.wait();
      
      // Get the result from the transaction return value
      const encryptedCompletedDays = await contract
        .connect(signers.alice)
        .calculateCompletedDays.staticCall(habitId);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        encryptedCompletedDays,
        contractAddress,
        signers.alice
      );

      expect(Number(decrypted)).to.eq(5);
    });

    it("should calculate completion percentage", async function () {
      // Record 15 completions out of 30 target
      for (let i = 0; i < 15; i++) {
        const date = Math.floor(Date.now() / 86400000) * 86400000 - i * 86400000;
        const encryptedStatus = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add8(1)
          .encrypt();

        const tx = await contract
          .connect(signers.alice)
          .recordCompletion(habitId, date, encryptedStatus.handles[0], encryptedStatus.inputProof);
        await tx.wait();
      }

      // calculateCompletionPercentage is not view, send transaction to get result and authorize
      const tx = await contract
        .connect(signers.alice)
        .calculateCompletionPercentage(habitId);
      await tx.wait();
      
      const encryptedPercentage = await contract
        .connect(signers.alice)
        .calculateCompletionPercentage.staticCall(habitId);
      const decrypted = await fhevm.userDecryptEuint(
        FhevmType.euint8,
        encryptedPercentage,
        contractAddress,
        signers.alice
      );

      // Should be approximately 50% (15/30 * 100)
      expect(Number(decrypted)).to.be.gte(49);
      expect(Number(decrypted)).to.be.lte(51);
    });

    it("should get complete habit stats", async function () {
      // Record some completions
      for (let i = 0; i < 10; i++) {
        const date = Math.floor(Date.now() / 86400000) * 86400000 - i * 86400000;
        const encryptedStatus = await fhevm
          .createEncryptedInput(contractAddress, signers.alice.address)
          .add8(1)
          .encrypt();

        const tx = await contract
          .connect(signers.alice)
          .recordCompletion(habitId, date, encryptedStatus.handles[0], encryptedStatus.inputProof);
        await tx.wait();
      }

      // getHabitStats is not view, send transaction to get result and authorize
      const tx = await contract
        .connect(signers.alice)
        .getHabitStats(habitId);
      await tx.wait();
      
      const stats = await contract
        .connect(signers.alice)
        .getHabitStats.staticCall(habitId);

      const decryptedCompletedDays = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        stats.completedDays,
        contractAddress,
        signers.alice
      );

      expect(Number(decryptedCompletedDays)).to.eq(10);
    });
  });

  describe("Access Control", function () {
    it("should prevent non-owner from updating habit", async function () {
      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(75)
        .encrypt();

      let tx = await contract
        .connect(signers.alice)
        .createHabit("Test", "Desc", 30, 0, encryptedStandard.handles[0], encryptedStandard.inputProof);
      await tx.wait();

      const newEncryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add8(80)
        .encrypt();

      await expect(
        contract
          .connect(signers.bob)
          .updateHabit(0, "Hacked", "Desc", 30, newEncryptedStandard.handles[0], newEncryptedStandard.inputProof)
      ).to.be.revertedWith("Not the habit owner");
    });

    it("should prevent non-owner from recording completion", async function () {
      const encryptedStandard = await fhevm
        .createEncryptedInput(contractAddress, signers.alice.address)
        .add8(75)
        .encrypt();

      let tx = await contract
        .connect(signers.alice)
        .createHabit("Test", "Desc", 30, 0, encryptedStandard.handles[0], encryptedStandard.inputProof);
      await tx.wait();

      const today = Math.floor(Date.now() / 86400000) * 86400000;
      const encryptedStatus = await fhevm
        .createEncryptedInput(contractAddress, signers.bob.address)
        .add8(1)
        .encrypt();

      await expect(
        contract
          .connect(signers.bob)
          .recordCompletion(0, today, encryptedStatus.handles[0], encryptedStatus.inputProof)
      ).to.be.revertedWith("Not the habit owner");
    });
  });
});
