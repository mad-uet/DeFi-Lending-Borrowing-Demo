// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LARToken
 * @notice Lending And Reward token for DeFi lending protocol incentives
 * @dev ERC20 token with initial supply and burn capability
 */
contract LARToken is ERC20, Ownable {
    /**
     * @notice Constructor that mints initial supply to deployer
     * @dev Mints 1,000,000 tokens (1M * 10^18) to msg.sender
     */
    constructor() ERC20("Lending And Reward", "LAR") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @notice Mints tokens to a specified address
     * @dev Only callable by owner, used for deposit rewards
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Burns tokens from a specified address
     * @dev Only callable by owner, used for withdrawal mechanisms
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}
