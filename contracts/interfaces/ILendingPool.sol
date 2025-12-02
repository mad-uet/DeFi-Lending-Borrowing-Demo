// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILendingPool
 * @notice Interface for the core lending pool contract
 * @dev Defines all external functions for deposit, withdraw, borrow, and repay operations
 */
interface ILendingPool {
    // Events
    event Deposit(address indexed user, address indexed token, uint256 amount, uint256 larMinted);
    event Withdraw(address indexed user, address indexed token, uint256 amount, uint256 larBurned);
    event Borrow(address indexed user, address indexed token, uint256 amount, uint256 interestRate);
    event Repay(address indexed user, address indexed token, uint256 amount, uint256 interest);
    event TokenAdded(address indexed token, address indexed priceFeed, uint16 ltv);
    event TokenDeactivated(address indexed token);
    event Liquidation(
        address indexed borrower,
        address indexed liquidator,
        address indexed debtToken,
        uint256 debtRepaid,
        address collateralToken,
        uint256 collateralSeized,
        uint256 liquidationBonus
    );

    // Structs
    struct UserAccountData {
        uint256 totalCollateralUSD;
        uint256 totalDebtUSD;
        uint256 availableBorrowsUSD;
        uint256 healthFactor;
    }

    // Core functions
    function deposit(address token, uint256 amount) external;
    function withdraw(address token, uint256 amount) external;
    function borrow(address token, uint256 amount) external;
    function repay(address token, uint256 amount) external;
    function liquidate(
        address borrower,
        address debtToken,
        uint256 debtAmount,
        address collateralToken
    ) external;

    // View functions
    function getUserAccountData(address user) external view returns (
        uint256 totalCollateralUSD,
        uint256 totalDebtUSD,
        uint256 availableBorrowsUSD,
        uint256 healthFactor
    );
    function getAssetPrice(address token) external view returns (uint256);
    
    // Admin functions
    function addToken(address token, uint16 ltv) external;
    function deactivateToken(address token) external;
}
