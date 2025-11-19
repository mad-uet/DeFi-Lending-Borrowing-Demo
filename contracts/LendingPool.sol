// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "./interfaces/ILendingPool.sol";
import "./LARToken.sol";
import "./InterestRateModel.sol";

/**
 * @title LendingPool
 * @notice Core lending pool contract for DeFi lending/borrowing protocol
 * @dev Implements deposit, withdraw, borrow, and repay functionality with dynamic interest rates
 */
contract LendingPool is ILendingPool, Ownable {
    // Structs
    struct TokenConfig {
        address tokenAddress;
        address priceFeed;
        uint16 ltv; // Loan-to-value in basis points (7500 = 75%)
        bool isActive;
    }

    struct UserReserveData {
        uint256 deposited;
        uint256 borrowed;
        uint256 lastInterestIndex; // For future compounding (Phase 6)
    }

    // State variables
    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => mapping(address => UserReserveData)) public userReserves; // user => token => data
    mapping(address => uint256) public totalDeposits; // token => total
    mapping(address => uint256) public totalBorrows; // token => total

    LARToken public immutable larToken;
    InterestRateModel public immutable interestRateModel;

    address[] public supportedTokens;

    // Constants
    uint256 private constant PRICE_PRECISION = 1e8; // Chainlink price feed precision
    uint256 private constant USD_PRECISION = 1e18; // Internal USD calculation precision
    uint256 private constant BASIS_POINTS = 10000;
    uint256 private constant HEALTH_FACTOR_PRECISION = 1e18;

    /**
     * @notice Constructor
     * @param _larToken Address of LAR reward token
     * @param _interestRateModel Address of interest rate model
     */
    constructor(address _larToken, address _interestRateModel) Ownable(msg.sender) {
        require(_larToken != address(0), "Invalid LAR token address");
        require(_interestRateModel != address(0), "Invalid interest rate model address");
        
        larToken = LARToken(_larToken);
        interestRateModel = InterestRateModel(_interestRateModel);
    }

    /**
     * @notice Deposit tokens into the lending pool
     * @param token Address of the token to deposit
     * @param amount Amount of tokens to deposit
     */
    function deposit(address token, uint256 amount) external override {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenConfigs[token].tokenAddress != address(0), "Token not supported");
        require(tokenConfigs[token].isActive, "Token not active");

        // Transfer tokens from user to contract
        IERC20(token).transferFrom(msg.sender, address(this), amount);

        // Update user reserve data
        unchecked {
            userReserves[msg.sender][token].deposited += amount;
            totalDeposits[token] += amount;
        }

        // Calculate USD value and mint LAR rewards
        uint256 usdValue = _calculateUSDValue(token, amount);
        uint256 larToMint = usdValue; // 1:1 ratio with USD value
        
        larToken.mint(msg.sender, larToMint);

        emit Deposit(msg.sender, token, amount, larToMint);
    }

    /**
     * @notice Withdraw deposited tokens from the lending pool
     * @param token Address of the token to withdraw
     * @param amount Amount of tokens to withdraw
     */
    function withdraw(address token, uint256 amount) external override {
        require(amount > 0, "Amount must be greater than 0");
        require(userReserves[msg.sender][token].deposited >= amount, "Insufficient balance");

        // Calculate user's total borrowed value
        uint256 totalDebtUSD = _getUserTotalDebt(msg.sender);

        // If user has debt, check health factor after withdrawal
        if (totalDebtUSD > 0) {
            uint256 withdrawValueUSD = _calculateUSDValue(token, amount);
            
            // Calculate weighted LTV for borrowing power
            uint256 borrowingPower = _calculateBorrowingPower(msg.sender);
            uint256 withdrawValueWeighted = (withdrawValueUSD * tokenConfigs[token].ltv) / BASIS_POINTS;
            
            require(
                borrowingPower - withdrawValueWeighted >= totalDebtUSD,
                "Withdrawal would break health factor"
            );
        }

        // Calculate LAR to burn (proportional to withdrawal)
        uint256 usdValue = _calculateUSDValue(token, amount);
        uint256 larToBurn = usdValue;

        // Burn LAR from user
        larToken.burn(msg.sender, larToBurn);

        // Update reserves
        unchecked {
            userReserves[msg.sender][token].deposited -= amount;
            totalDeposits[token] -= amount;
        }

        // Transfer tokens back to user
        IERC20(token).transfer(msg.sender, amount);

        emit Withdraw(msg.sender, token, amount, larToBurn);
    }

    /**
     * @notice Borrow tokens against collateral
     * @param token Address of the token to borrow
     * @param amount Amount of tokens to borrow
     */
    function borrow(address token, uint256 amount) external override {
        require(amount > 0, "Amount must be greater than 0");
        require(tokenConfigs[token].tokenAddress != address(0), "Token not supported");
        require(tokenConfigs[token].isActive, "Token not active");
        require(totalDeposits[token] - totalBorrows[token] >= amount, "Insufficient liquidity");

        // Calculate borrowing power and current debt
        uint256 borrowingPower = _calculateBorrowingPower(msg.sender);
        uint256 currentDebt = _getUserTotalDebt(msg.sender);
        uint256 borrowValueUSD = _calculateUSDValue(token, amount);

        require(currentDebt + borrowValueUSD <= borrowingPower, "Insufficient collateral");

        // Get current interest rate
        uint256 interestRate = interestRateModel.calculateBorrowRate(totalBorrows[token], totalDeposits[token]);

        // Update reserves
        unchecked {
            userReserves[msg.sender][token].borrowed += amount;
            totalBorrows[token] += amount;
        }

        // Transfer tokens to user
        IERC20(token).transfer(msg.sender, amount);

        emit Borrow(msg.sender, token, amount, interestRate);
    }

    /**
     * @notice Repay borrowed tokens
     * @param token Address of the token to repay
     * @param amount Amount of tokens to repay
     */
    function repay(address token, uint256 amount) external override {
        require(amount > 0, "Amount must be greater than 0");
        uint256 borrowed = userReserves[msg.sender][token].borrowed;
        require(borrowed > 0, "No debt to repay");

        // Calculate interest (simplified linear for Phase 3)
        uint256 interestRate = interestRateModel.calculateBorrowRate(totalBorrows[token], totalDeposits[token]);
        uint256 interest = (borrowed * interestRate) / BASIS_POINTS;

        // Determine actual repayment amount (capped at borrowed + interest)
        uint256 totalDebt = borrowed + interest;
        uint256 repayAmount = amount > totalDebt ? totalDebt : amount;
        uint256 principalRepaid = repayAmount > interest ? repayAmount - interest : 0;

        // Transfer tokens from user
        IERC20(token).transferFrom(msg.sender, address(this), repayAmount);

        // Update reserves
        if (principalRepaid > 0) {
            unchecked {
                userReserves[msg.sender][token].borrowed -= principalRepaid;
                totalBorrows[token] -= principalRepaid;
            }
        }

        emit Repay(msg.sender, token, repayAmount, interest);
    }

    /**
     * @notice Get user account data
     * @param user Address of the user
     * @return totalCollateralUSD Total collateral in USD
     * @return totalDebtUSD Total debt in USD
     * @return availableBorrowsUSD Available borrowing capacity in USD
     * @return healthFactor Health factor (collateral * LTV / debt)
     */
    function getUserAccountData(address user)
        external
        view
        override
        returns (
            uint256 totalCollateralUSD,
            uint256 totalDebtUSD,
            uint256 availableBorrowsUSD,
            uint256 healthFactor
        )
    {
        totalCollateralUSD = _getUserTotalCollateral(user);
        totalDebtUSD = _getUserTotalDebt(user);
        uint256 borrowingPower = _calculateBorrowingPower(user);
        
        availableBorrowsUSD = borrowingPower > totalDebtUSD ? borrowingPower - totalDebtUSD : 0;
        
        if (totalDebtUSD == 0) {
            healthFactor = type(uint256).max;
        } else {
            healthFactor = (borrowingPower * HEALTH_FACTOR_PRECISION) / totalDebtUSD;
        }
    }

    /**
     * @notice Get asset price from oracle
     * @param token Address of the token
     * @return price Price in USD with 8 decimals
     */
    function getAssetPrice(address token) external view override returns (uint256) {
        require(tokenConfigs[token].priceFeed != address(0), "Price feed not set");
        
        (
            /* uint80 roundID */,
            int256 price,
            /* uint256 startedAt */,
            /* uint256 timeStamp */,
            /* uint80 answeredInRound */
        ) = AggregatorV3Interface(tokenConfigs[token].priceFeed).latestRoundData();
        
        require(price > 0, "Invalid price");
        return uint256(price);
    }

    /**
     * @notice Add a new supported token
     * @param token Address of the token
     * @param priceFeed Address of the Chainlink price feed
     * @param ltv Loan-to-value ratio in basis points
     */
    function addToken(address token, address priceFeed, uint16 ltv) external override onlyOwner {
        require(token != address(0), "Invalid token address");
        require(priceFeed != address(0), "Invalid price feed address");
        require(ltv > 0 && ltv <= BASIS_POINTS, "Invalid LTV");
        require(tokenConfigs[token].tokenAddress == address(0), "Token already added");

        tokenConfigs[token] = TokenConfig({
            tokenAddress: token,
            priceFeed: priceFeed,
            ltv: ltv,
            isActive: true
        });

        supportedTokens.push(token);

        emit TokenAdded(token, priceFeed, ltv);
    }

    /**
     * @notice Deactivate a token (prevent new deposits/borrows)
     * @param token Address of the token to deactivate
     */
    function deactivateToken(address token) external override onlyOwner {
        require(tokenConfigs[token].tokenAddress != address(0), "Token not found");
        tokenConfigs[token].isActive = false;
        emit TokenDeactivated(token);
    }

    // Internal helper functions

    /**
     * @notice Calculate USD value of token amount
     * @param token Address of the token
     * @param amount Amount of tokens
     * @return USD value with 18 decimals
     */
    function _calculateUSDValue(address token, uint256 amount) internal view returns (uint256) {
        uint256 price = this.getAssetPrice(token);
        uint8 decimals = IERC20Metadata(token).decimals();
        
        // Normalize to 18 decimals and multiply by price
        // price has 8 decimals, we want result in 18 decimals
        return (amount * price * USD_PRECISION) / (10 ** decimals) / PRICE_PRECISION;
    }

    /**
     * @notice Calculate user's total collateral in USD
     * @param user Address of the user
     * @return Total collateral value in USD with 18 decimals
     */
    function _getUserTotalCollateral(address user) internal view returns (uint256) {
        uint256 totalCollateralUSD = 0;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 deposited = userReserves[user][token].deposited;
            
            if (deposited > 0) {
                totalCollateralUSD += _calculateUSDValue(token, deposited);
            }
        }
        
        return totalCollateralUSD;
    }

    /**
     * @notice Calculate user's total debt in USD
     * @param user Address of the user
     * @return Total debt value in USD with 18 decimals
     */
    function _getUserTotalDebt(address user) internal view returns (uint256) {
        uint256 totalDebtUSD = 0;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 borrowed = userReserves[user][token].borrowed;
            
            if (borrowed > 0) {
                totalDebtUSD += _calculateUSDValue(token, borrowed);
            }
        }
        
        return totalDebtUSD;
    }

    /**
     * @notice Calculate user's borrowing power (collateral * LTV)
     * @param user Address of the user
     * @return Borrowing power in USD with 18 decimals
     */
    function _calculateBorrowingPower(address user) internal view returns (uint256) {
        uint256 borrowingPower = 0;
        
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            address token = supportedTokens[i];
            uint256 deposited = userReserves[user][token].deposited;
            
            if (deposited > 0) {
                uint256 collateralUSD = _calculateUSDValue(token, deposited);
                uint256 ltv = tokenConfigs[token].ltv;
                borrowingPower += (collateralUSD * ltv) / BASIS_POINTS;
            }
        }
        
        return borrowingPower;
    }
}

// Chainlink AggregatorV3Interface
interface AggregatorV3Interface {
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
