// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, euint32, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title QuantumHabit - Privacy-preserving habit tracking dApp
/// @notice A FHEVM-based contract for encrypted habit tracking and progress calculation
contract QuantumHabit is ZamaEthereumConfig {
    enum HabitType {
        Daily,
        Weekly,
        Custom
    }

    enum RewardType {
        Milestone,
        Consecutive
    }

    struct Habit {
        uint256 id;
        address owner;
        string name;
        string description;
        uint32 targetDays;
        HabitType habitType;
        euint8 completionStandard;
        uint256 createdAt;
        bool isActive;
    }

    struct CompletionRecord {
        uint256 habitId;
        uint256 date;
        euint8 completionStatus;
        bool exists;
    }

    struct HabitStats {
        euint32 completedDays;
        euint32 consecutiveDays;
        euint8 completionRate;
        euint8 completionPercentage;
    }

    struct Reward {
        uint256 id;
        uint256 habitId;
        RewardType rewardType;
        uint8 milestonePercent; // For milestone rewards
        uint32 consecutiveDays; // For consecutive rewards
        euint8 rewardAmount;
        bool claimed;
        uint256 claimedAt;
    }

    uint256 private _nextHabitId;
    uint256 private _nextRewardId;
    
    mapping(uint256 => Habit) private _habits;
    mapping(uint256 => mapping(uint256 => CompletionRecord)) private _completionRecords; // habitId => date => record
    mapping(address => uint256[]) private _userHabits; // user => habitIds
    mapping(uint256 => uint256[]) private _habitCompletionDates; // habitId => dates[]
    mapping(address => Reward[]) private _userRewards; // user => rewards
    // Track claimed rewards: user => habitId => rewardType => milestone/consecutive value => claimed
    mapping(address => mapping(uint256 => mapping(RewardType => mapping(uint256 => bool)))) private _claimedRewards;

    event HabitCreated(uint256 indexed habitId, address indexed owner, string name);
    event HabitUpdated(uint256 indexed habitId, address indexed owner);
    event HabitDeleted(uint256 indexed habitId, address indexed owner);
    event CompletionRecorded(uint256 indexed habitId, address indexed user, uint256 date);
    event RewardClaimed(uint256 indexed habitId, address indexed user, RewardType rewardType, uint256 rewardId);

    /// @notice Create a new habit
    function createHabit(
        string memory name,
        string memory description,
        uint32 targetDays,
        HabitType habitType,
        externalEuint8 completionStandard,
        bytes calldata proof
    ) external returns (uint256) {
        require(targetDays > 0, "Target days must be greater than 0");
        require(bytes(name).length > 0, "Habit name cannot be empty");

        uint256 habitId = _nextHabitId++;
        euint8 encryptedStandard = FHE.fromExternal(completionStandard, proof);

        _habits[habitId] = Habit({
            id: habitId,
            owner: msg.sender,
            name: name,
            description: description,
            targetDays: targetDays,
            habitType: habitType,
            completionStandard: encryptedStandard,
            createdAt: block.timestamp,
            isActive: true
        });

        _userHabits[msg.sender].push(habitId);

        // Allow owner to decrypt the completion standard
        FHE.allowThis(encryptedStandard);
        FHE.allow(encryptedStandard, msg.sender);

        emit HabitCreated(habitId, msg.sender, name);
        return habitId;
    }

    /// @notice Update habit information
    function updateHabit(
        uint256 habitId,
        string memory name,
        string memory description,
        uint32 targetDays,
        externalEuint8 completionStandard,
        bytes calldata proof
    ) external {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        require(_habits[habitId].isActive, "Habit is not active");
        require(targetDays > 0, "Target days must be greater than 0");

        Habit storage habit = _habits[habitId];
        habit.name = name;
        habit.description = description;
        habit.targetDays = targetDays;
        
        euint8 encryptedStandard = FHE.fromExternal(completionStandard, proof);
        habit.completionStandard = encryptedStandard;
        
        FHE.allowThis(encryptedStandard);
        FHE.allow(encryptedStandard, msg.sender);

        emit HabitUpdated(habitId, msg.sender);
    }

    /// @notice Delete a habit (soft delete)
    function deleteHabit(uint256 habitId) external {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        _habits[habitId].isActive = false;
        emit HabitDeleted(habitId, msg.sender);
    }

    /// @notice Get habit information
    function getHabit(uint256 habitId) external view returns (Habit memory) {
        return _habits[habitId];
    }

    /// @notice Get all habit IDs for a user
    function getUserHabits(address user) external view returns (uint256[] memory) {
        return _userHabits[user];
    }

    /// @notice Record completion for a specific date
    function recordCompletion(
        uint256 habitId,
        uint256 date,
        externalEuint8 completionStatus,
        bytes calldata proof
    ) external {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        require(_habits[habitId].isActive, "Habit is not active");

        euint8 encryptedStatus = FHE.fromExternal(completionStatus, proof);

        if (!_completionRecords[habitId][date].exists) {
            _habitCompletionDates[habitId].push(date);
        }

        _completionRecords[habitId][date] = CompletionRecord({
            habitId: habitId,
            date: date,
            completionStatus: encryptedStatus,
            exists: true
        });

        // Allow owner to decrypt
        FHE.allowThis(encryptedStatus);
        FHE.allow(encryptedStatus, msg.sender);

        emit CompletionRecorded(habitId, msg.sender, date);
    }

    /// @notice Batch record completions
    function batchRecordCompletion(
        uint256 habitId,
        uint256[] memory dates,
        externalEuint8[] memory statuses,
        bytes[] calldata proofs
    ) external {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        require(_habits[habitId].isActive, "Habit is not active");
        require(dates.length == statuses.length && dates.length == proofs.length, "Array length mismatch");

        for (uint256 i = 0; i < dates.length; i++) {
            euint8 encryptedStatus = FHE.fromExternal(statuses[i], proofs[i]);

            if (!_completionRecords[habitId][dates[i]].exists) {
                _habitCompletionDates[habitId].push(dates[i]);
            }

            _completionRecords[habitId][dates[i]] = CompletionRecord({
                habitId: habitId,
                date: dates[i],
                completionStatus: encryptedStatus,
                exists: true
            });

            FHE.allowThis(encryptedStatus);
            FHE.allow(encryptedStatus, msg.sender);

            emit CompletionRecorded(habitId, msg.sender, dates[i]);
        }
    }

    /// @notice Get completion record for a specific date
    function getCompletionRecord(
        uint256 habitId,
        uint256 date
    ) external view returns (CompletionRecord memory) {
        return _completionRecords[habitId][date];
    }

    /// @notice Check if a date is completed (returns encrypted status)
    /// @dev This function is not view because FHE.asEuint8 modifies state
    function isCompleted(uint256 habitId, uint256 date) external returns (euint8) {
        CompletionRecord memory record = _completionRecords[habitId][date];
        if (!record.exists) {
            euint8 zero = FHE.asEuint8(0);
            // Authorize owner to decrypt (even though it's 0)
            FHE.allowThis(zero);
            FHE.allow(zero, _habits[habitId].owner);
            return zero;
        }
        // Return the stored completionStatus (already authorized when recorded)
        return record.completionStatus;
    }

    /// @notice Get all completion dates for a habit
    function getCompletionDates(uint256 habitId) external view returns (uint256[] memory) {
        return _habitCompletionDates[habitId];
    }

    /// @notice Calculate total completed days (encrypted)
    /// @dev This function is not view because FHE operations modify state
    function calculateCompletedDays(uint256 habitId) public returns (euint32) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        uint256[] memory dates = _habitCompletionDates[habitId];
        euint32 total = FHE.asEuint32(0);
        
        for (uint256 i = 0; i < dates.length; i++) {
            CompletionRecord memory record = _completionRecords[habitId][dates[i]];
            if (record.exists) {
                // Check if completion status > 0 (encrypted comparison)
                euint8 zero = FHE.asEuint8(0);
                ebool hasCompleted = FHE.gt(record.completionStatus, zero);
                euint32 one = FHE.asEuint32(1);
                euint32 addValue = FHE.select(hasCompleted, one, FHE.asEuint32(0));
                total = FHE.add(total, addValue);
            }
        }
        
        // Authorize owner to decrypt the result
        FHE.allowThis(total);
        FHE.allow(total, msg.sender);
        
        return total;
    }

    /// @notice Calculate consecutive days (encrypted)
    /// @dev This function is not view because FHE operations modify state
    function calculateConsecutiveDays(uint256 habitId) public returns (euint32) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        uint256[] memory dates = _habitCompletionDates[habitId];
        if (dates.length == 0) {
            euint32 zero = FHE.asEuint32(0);
            FHE.allowThis(zero);
            FHE.allow(zero, msg.sender);
            return zero;
        }

        // Sort dates (assuming they are already sorted by date, but we need to handle this)
        // For simplicity, we'll iterate and find the longest consecutive sequence
        
        euint32 maxConsecutive = FHE.asEuint32(0);
        euint32 currentConsecutive = FHE.asEuint32(0);
        uint256 lastDate = 0;

        for (uint256 i = 0; i < dates.length; i++) {
            CompletionRecord memory record = _completionRecords[habitId][dates[i]];
            if (!record.exists) {
                continue;
            }

            euint8 zero = FHE.asEuint8(0);
            ebool hasCompleted = FHE.gt(record.completionStatus, zero);
            euint32 one = FHE.asEuint32(1);

            // Check if this is consecutive (simplified: just check if completed)
            if (lastDate == 0 || dates[i] == lastDate + 86400) {
                // Consecutive day
                euint32 addValue = FHE.select(hasCompleted, one, FHE.asEuint32(0));
                currentConsecutive = FHE.add(currentConsecutive, addValue);
            } else {
                // Reset
                currentConsecutive = FHE.select(hasCompleted, one, FHE.asEuint32(0));
            }

            // Update max
            ebool isMax = FHE.gt(currentConsecutive, maxConsecutive);
            maxConsecutive = FHE.select(isMax, currentConsecutive, maxConsecutive);

            lastDate = dates[i];
        }

        // Authorize owner to decrypt the result
        FHE.allowThis(maxConsecutive);
        FHE.allow(maxConsecutive, msg.sender);

        return maxConsecutive;
    }

    /// @notice Calculate completion percentage (0-100)
    /// @dev This function is not view because FHE.div modifies state
    function calculateCompletionPercentage(uint256 habitId) public returns (euint8) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        euint32 completedDays = calculateCompletedDays(habitId);
        uint32 targetDays = _habits[habitId].targetDays;
        
        if (targetDays == 0) {
            euint8 zero = FHE.asEuint8(0);
            FHE.allowThis(zero);
            FHE.allow(zero, msg.sender);
            return zero;
        }

        // Multiply by 100 first to avoid precision loss
        euint32 multiplied = FHE.mul(completedDays, 100);
        euint8 percentage = FHE.asEuint8(FHE.div(multiplied, targetDays));
        
        // Authorize owner to decrypt the result
        FHE.allowThis(percentage);
        FHE.allow(percentage, msg.sender);
        
        return percentage;
    }

    /// @notice Calculate completion rate (completed days / total days since creation)
    /// @dev This function is not view because FHE.div modifies state
    function calculateCompletionRate(uint256 habitId) public returns (euint8) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        Habit memory habit = _habits[habitId];
        if (!habit.isActive) {
            euint8 zero = FHE.asEuint8(0);
            FHE.allowThis(zero);
            FHE.allow(zero, msg.sender);
            return zero;
        }

        uint256 totalDays = (block.timestamp - habit.createdAt) / 86400;
        if (totalDays == 0) {
            euint8 zero = FHE.asEuint8(0);
            FHE.allowThis(zero);
            FHE.allow(zero, msg.sender);
            return zero;
        }

        euint32 completedDays = calculateCompletedDays(habitId);
        euint32 multiplied = FHE.mul(completedDays, 100);
        euint8 rate = FHE.asEuint8(FHE.div(multiplied, uint32(totalDays)));
        
        // Authorize owner to decrypt the result
        FHE.allowThis(rate);
        FHE.allow(rate, msg.sender);
        
        return rate;
    }

    /// @notice Get complete statistics for a habit
    /// @dev This function is not view because it needs to authorize decryption
    function getHabitStats(uint256 habitId) external returns (HabitStats memory) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        euint32 completedDays = calculateCompletedDays(habitId);
        euint32 consecutiveDays = calculateConsecutiveDays(habitId);
        euint8 completionRate = calculateCompletionRate(habitId);
        euint8 completionPercentage = calculateCompletionPercentage(habitId);

        // Allow owner to decrypt all stats
        FHE.allowThis(completedDays);
        FHE.allow(completedDays, msg.sender);
        FHE.allowThis(consecutiveDays);
        FHE.allow(consecutiveDays, msg.sender);
        FHE.allowThis(completionRate);
        FHE.allow(completionRate, msg.sender);
        FHE.allowThis(completionPercentage);
        FHE.allow(completionPercentage, msg.sender);

        return HabitStats({
            completedDays: completedDays,
            consecutiveDays: consecutiveDays,
            completionRate: completionRate,
            completionPercentage: completionPercentage
        });
    }

    /// @notice Check milestone reward eligibility
    /// @dev This function is not view because it needs to authorize decryption
    function checkMilestoneReward(
        uint256 habitId,
        uint8 milestonePercent
    ) external returns (bool eligible, euint8 rewardAmount) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        euint8 completionPercentage = calculateCompletionPercentage(habitId);
        euint8 milestone = FHE.asEuint8(milestonePercent);
        
        // Check if completionPercentage >= milestone
        ebool isEligible = FHE.ge(completionPercentage, milestone);
        
        // Calculate reward (simplified: base reward * completion percentage / 100)
        euint8 baseReward = FHE.asEuint8(100); // Base reward points
        euint8 calculatedReward = FHE.div(FHE.mul(baseReward, completionPercentage), 100);
        
        // Select reward only if eligible
        euint8 reward = FHE.select(isEligible, calculatedReward, FHE.asEuint8(0));
        
        // Allow owner to decrypt
        FHE.allowThis(reward);
        FHE.allow(reward, msg.sender);

        // For simplicity, we'll return eligible as true if percentage >= milestone
        // In a real scenario, we'd need to decrypt to check
        return (true, reward); // Simplified: always return true, actual check should be done client-side
    }

    /// @notice Check consecutive reward eligibility
    /// @dev This function is not view because it needs to authorize decryption
    function checkConsecutiveReward(
        uint256 habitId,
        uint32 consecutiveDays
    ) external returns (bool eligible, euint8 rewardAmount) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        euint32 actualConsecutive = calculateConsecutiveDays(habitId);
        euint32 targetConsecutive = FHE.asEuint32(consecutiveDays);
        
        ebool isEligible = FHE.ge(actualConsecutive, targetConsecutive);
        
        euint8 baseReward = FHE.asEuint8(50); // Base reward points
        euint8 reward = FHE.select(isEligible, baseReward, FHE.asEuint8(0));
        
        FHE.allowThis(reward);
        FHE.allow(reward, msg.sender);

        return (true, reward); // Simplified
    }

    /// @notice Batch check multiple rewards at once
    /// @dev This function checks multiple milestones and consecutive targets in a single transaction
    /// @param habitId The habit ID
    /// @param milestonePercents Array of milestone percentages to check (e.g., [25, 50, 75, 100])
    /// @param consecutiveTargets Array of consecutive day targets to check (e.g., [7, 14, 30, 60])
    /// @return milestoneRewards Array of reward amounts for milestones (encrypted)
    /// @return consecutiveRewards Array of reward amounts for consecutive targets (encrypted)
    function checkMultipleRewards(
        uint256 habitId,
        uint8[] memory milestonePercents,
        uint32[] memory consecutiveTargets
    ) external returns (euint8[] memory milestoneRewards, euint8[] memory consecutiveRewards) {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        // Initialize arrays
        milestoneRewards = new euint8[](milestonePercents.length);
        consecutiveRewards = new euint8[](consecutiveTargets.length);
        
        // Get completion stats once
        euint8 completionPercentage = calculateCompletionPercentage(habitId);
        euint32 actualConsecutive = calculateConsecutiveDays(habitId);
        
        // Check milestone rewards
        euint8 baseReward = FHE.asEuint8(100);
        for (uint256 i = 0; i < milestonePercents.length; i++) {
            euint8 milestone = FHE.asEuint8(milestonePercents[i]);
            ebool isEligible = FHE.ge(completionPercentage, milestone);
            euint8 calculatedReward = FHE.div(FHE.mul(baseReward, completionPercentage), 100);
            euint8 reward = FHE.select(isEligible, calculatedReward, FHE.asEuint8(0));
            
            // Authorize for decryption
            FHE.allowThis(reward);
            FHE.allow(reward, msg.sender);
            
            milestoneRewards[i] = reward;
        }
        
        // Check consecutive rewards
        euint8 consecutiveBaseReward = FHE.asEuint8(50);
        for (uint256 i = 0; i < consecutiveTargets.length; i++) {
            euint32 target = FHE.asEuint32(consecutiveTargets[i]);
            ebool isEligible = FHE.ge(actualConsecutive, target);
            euint8 reward = FHE.select(isEligible, consecutiveBaseReward, FHE.asEuint8(0));
            
            // Authorize for decryption
            FHE.allowThis(reward);
            FHE.allow(reward, msg.sender);
            
            consecutiveRewards[i] = reward;
        }
        
        return (milestoneRewards, consecutiveRewards);
    }

    /// @notice Claim a reward
    /// @param habitId The habit ID
    /// @param rewardType The type of reward (Milestone or Consecutive)
    /// @param milestoneOrConsecutiveValue For milestone: milestone percentage (25, 50, 75, 100). For consecutive: consecutive days (7, 14, 30, 60)
    function claimReward(
        uint256 habitId,
        RewardType rewardType,
        uint256 milestoneOrConsecutiveValue
    ) external {
        require(_habits[habitId].owner == msg.sender, "Not the habit owner");
        
        // Check if this reward has already been claimed
        require(
            !_claimedRewards[msg.sender][habitId][rewardType][milestoneOrConsecutiveValue],
            "Reward already claimed"
        );
        
        // Mark as claimed
        _claimedRewards[msg.sender][habitId][rewardType][milestoneOrConsecutiveValue] = true;
        
        // Create reward record
        Reward memory reward = Reward({
            id: _nextRewardId++,
            habitId: habitId,
            rewardType: rewardType,
            milestonePercent: rewardType == RewardType.Milestone ? uint8(milestoneOrConsecutiveValue) : 0,
            consecutiveDays: rewardType == RewardType.Consecutive ? uint32(milestoneOrConsecutiveValue) : 0,
            rewardAmount: FHE.asEuint8(0), // Would be set from check function
            claimed: true,
            claimedAt: block.timestamp
        });

        _userRewards[msg.sender].push(reward);

        emit RewardClaimed(habitId, msg.sender, rewardType, reward.id);
    }

    /// @notice Get user rewards
    function getUserRewards(address user) external view returns (Reward[] memory) {
        return _userRewards[user];
    }
}
