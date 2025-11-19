// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockV3Aggregator
 * @dev Mock Chainlink price feed aggregator for testing
 * @notice Based on Chainlink's AggregatorV3Interface - anyone can update prices FOR TESTING ONLY
 */
contract MockV3Aggregator {
    uint8 public immutable decimals;
    int256 public latestAnswer;
    uint256 public latestTimestamp;
    uint256 public latestRound;

    /**
     * @dev Constructor to create a mock price feed
     * @param _decimals Number of decimals (8 for USD pairs, 18 for crypto pairs)
     * @param _initialAnswer Initial price answer
     */
    constructor(uint8 _decimals, int256 _initialAnswer) {
        decimals = _decimals;
        latestAnswer = _initialAnswer;
        latestTimestamp = block.timestamp;
        latestRound = 1;
    }

    /**
     * @dev Update the price - anyone can call for testing
     * @param _answer New price answer
     */
    function updateAnswer(int256 _answer) external {
        latestAnswer = _answer;
        latestTimestamp = block.timestamp;
        unchecked {
            ++latestRound;
        }
    }

    /**
     * @dev Get latest round data (Chainlink interface)
     * @return roundId Current round ID
     * @return answer Current price
     * @return startedAt Timestamp when round started
     * @return updatedAt Timestamp when round updated
     * @return answeredInRound Round ID when answer was computed
     */
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            uint80(latestRound),
            latestAnswer,
            latestTimestamp,
            latestTimestamp,
            uint80(latestRound)
        );
    }

    /**
     * @dev Returns the version of the aggregator
     * @return Version number (0 for mock)
     */
    function version() external pure returns (uint256) {
        return 0;
    }

    /**
     * @dev Returns the description of the aggregator
     * @return Description string
     */
    function description() external pure returns (string memory) {
        return "Mock Chainlink Aggregator";
    }
}
