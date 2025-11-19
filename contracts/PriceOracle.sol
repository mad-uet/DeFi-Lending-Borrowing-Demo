// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @notice Dedicated price oracle aggregator for fetching and validating token prices
 * @dev Integrates with Chainlink price feeds with staleness checks and price validation
 */
contract PriceOracle is Ownable {
    // Constants
    uint256 public constant PRICE_TIMEOUT = 1 hours;
    
    // State variables
    mapping(address => address) public priceFeed;
    
    // Events
    event PriceFeedUpdated(address indexed token, address priceFeed);
    
    /**
     * @notice Constructor
     */
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Set or update price feed for a token
     * @param token Address of the token
     * @param feed Address of the Chainlink price feed
     */
    function setPriceFeed(address token, address feed) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(feed != address(0), "Invalid feed address");
        
        priceFeed[token] = feed;
        emit PriceFeedUpdated(token, feed);
    }
    
    /**
     * @notice Get price of a token normalized to 18 decimals
     * @param token Address of the token
     * @return price Price in USD with 18 decimals
     */
    function getPrice(address token) external view returns (uint256) {
        address feed = priceFeed[token];
        require(feed != address(0), "Price feed not set");
        
        AggregatorV3Interface priceFeedInterface = AggregatorV3Interface(feed);
        (
            /* uint80 roundID */,
            int256 price,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = priceFeedInterface.latestRoundData();
        
        require(price > 0, "Invalid price");
        require(block.timestamp - updatedAt < PRICE_TIMEOUT, "Stale price");
        
        uint8 decimals = priceFeedInterface.decimals();
        
        // Normalize to 18 decimals
        return uint256(price) * (10 ** (18 - decimals));
    }
    
    /**
     * @notice Get price and decimals separately
     * @param token Address of the token
     * @return price Price in USD normalized to 18 decimals
     * @return decimals Original decimals of the price feed
     */
    function getPriceWithDecimals(address token) external view returns (uint256 price, uint8 decimals) {
        address feed = priceFeed[token];
        require(feed != address(0), "Price feed not set");
        
        AggregatorV3Interface priceFeedInterface = AggregatorV3Interface(feed);
        (
            /* uint80 roundID */,
            int256 rawPrice,
            /* uint256 startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = priceFeedInterface.latestRoundData();
        
        require(rawPrice > 0, "Invalid price");
        require(block.timestamp - updatedAt < PRICE_TIMEOUT, "Stale price");
        
        decimals = priceFeedInterface.decimals();
        
        // Normalize to 18 decimals
        price = uint256(rawPrice) * (10 ** (18 - decimals));
    }
}

// Chainlink AggregatorV3Interface
interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}
