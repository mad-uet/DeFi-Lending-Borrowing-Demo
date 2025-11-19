// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Gas-optimized ERC20 token for testing purposes
 * @notice Anyone can mint tokens - FOR TESTING ONLY
 */
contract MockERC20 is ERC20 {
    uint8 private immutable _decimals;

    /**
     * @dev Constructor to create a mock ERC20 token
     * @param name_ Token name
     * @param symbol_ Token symbol
     * @param decimals_ Number of decimals (e.g., 18 for ETH, 6 for USDC)
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) ERC20(name_, symbol_) {
        _decimals = decimals_;
    }

    /**
     * @dev Returns the number of decimals
     * @return Number of decimals
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Mint tokens to any address - anyone can call for testing
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
