// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title ArcadeGameContract
 * @dev Smart contract for Over Hippo Arkade game chip purchases and rewards
 */
contract ArcadeGameContract is Ownable, ReentrancyGuard {
    IERC20 public overToken;
    
    // Game chip price in OVER tokens (with 18 decimals)
    uint256 public chipPrice = 100000000000000000; // 0.1 OVER per chip
    
    // Minimum withdrawal amount
    uint256 public minWithdrawal = 1000000000000000000; // 1 OVER
    
    // Player balances
    mapping(address => uint256) public playerChips;
    mapping(address => uint256) public playerOverBalance;
    mapping(address => uint256) public totalGamesPlayed;
    mapping(address => mapping(string => uint256)) public gameHighScores;
    
    // Game reward rates (OVER per 1000 points)
    mapping(string => uint256) public gameRewardRates;
    
    // Events
    event ChipsPurchased(address indexed player, uint256 chips, uint256 overCost);
    event ChipsUsed(address indexed player, string game, uint256 chips);
    event ScoreSubmitted(address indexed player, string game, uint256 score, uint256 reward);
    event TokensWithdrawn(address indexed player, uint256 amount);
    event RewardRateUpdated(string game, uint256 newRate);
    
    constructor(address _overToken) {
        overToken = IERC20(_overToken);
        
        // Initialize game reward rates (OVER per 1000 points, with 18 decimals)
        gameRewardRates["tetris"] = 1000000000000000;   // 0.001 OVER per 1000 points
        gameRewardRates["snake"] = 1500000000000000;    // 0.0015 OVER per 1000 points
        gameRewardRates["pacman"] = 2000000000000000;   // 0.002 OVER per 1000 points
    }
    
    /**
     * @dev Purchase game chips with OVER tokens
     * @param chipAmount Number of chips to purchase
     */
    function purchaseChips(uint256 chipAmount) external nonReentrant {
        require(chipAmount > 0, "Chip amount must be positive");
        
        uint256 overCost = chipAmount * chipPrice;
        require(overToken.balanceOf(msg.sender) >= overCost, "Insufficient OVER balance");
        
        // Transfer OVER tokens to contract
        require(overToken.transferFrom(msg.sender, address(this), overCost), "Transfer failed");
        
        // Add chips to player balance
        playerChips[msg.sender] += chipAmount;
        
        emit ChipsPurchased(msg.sender, chipAmount, overCost);
    }
    
    /**
     * @dev Use chips to play a game
     * @param game Game identifier (tetris, snake, pacman)
     * @param chipAmount Number of chips to use
     */
    function useChips(string memory game, uint256 chipAmount) external {
        require(chipAmount > 0, "Chip amount must be positive");
        require(playerChips[msg.sender] >= chipAmount, "Insufficient chips");
        
        playerChips[msg.sender] -= chipAmount;
        totalGamesPlayed[msg.sender]++;
        
        emit ChipsUsed(msg.sender, game, chipAmount);
    }
    
    /**
     * @dev Submit game score and calculate rewards
     * @param game Game identifier
     * @param score Player's score
     */
    function submitScore(string memory game, uint256 score) external {
        require(score > 0, "Score must be positive");
        require(gameRewardRates[game] > 0, "Invalid game");
        
        // Update high score if applicable
        if (score > gameHighScores[msg.sender][game]) {
            gameHighScores[msg.sender][game] = score;
        }
        
        // Calculate OVER reward
        uint256 reward = (score / 1000) * gameRewardRates[game];
        
        if (reward > 0) {
            playerOverBalance[msg.sender] += reward;
            emit ScoreSubmitted(msg.sender, game, score, reward);
        }
    }
    
    /**
     * @dev Withdraw OVER tokens from player balance
     * @param amount Amount to withdraw
     */
    function withdrawTokens(uint256 amount) external nonReentrant {
        require(amount >= minWithdrawal, "Amount below minimum withdrawal");
        require(playerOverBalance[msg.sender] >= amount, "Insufficient balance");
        require(overToken.balanceOf(address(this)) >= amount, "Contract insufficient balance");
        
        playerOverBalance[msg.sender] -= amount;
        require(overToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit TokensWithdrawn(msg.sender, amount);
    }
    
    /**
     * @dev Get player's complete stats
     * @param player Player address
     */
    function getPlayerStats(address player) external view returns (
        uint256 chips,
        uint256 overBalance,
        uint256 gamesPlayed,
        uint256 tetrisHighScore,
        uint256 snakeHighScore,
        uint256 pacmanHighScore
    ) {
        return (
            playerChips[player],
            playerOverBalance[player],
            totalGamesPlayed[player],
            gameHighScores[player]["tetris"],
            gameHighScores[player]["snake"],
            gameHighScores[player]["pacman"]
        );
    }
    
    // Owner functions
    
    /**
     * @dev Update chip price (only owner)
     * @param newPrice New price in OVER tokens (with 18 decimals)
     */
    function updateChipPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Price must be positive");
        chipPrice = newPrice;
    }
    
    /**
     * @dev Update game reward rate (only owner)
     * @param game Game identifier
     * @param newRate New reward rate (OVER per 1000 points, with 18 decimals)
     */
    function updateRewardRate(string memory game, uint256 newRate) external onlyOwner {
        gameRewardRates[game] = newRate;
        emit RewardRateUpdated(game, newRate);
    }
    
    /**
     * @dev Update minimum withdrawal amount (only owner)
     * @param newMinimum New minimum amount (with 18 decimals)
     */
    function updateMinWithdrawal(uint256 newMinimum) external onlyOwner {
        minWithdrawal = newMinimum;
    }
    
    /**
     * @dev Emergency withdraw for contract owner
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(overToken.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return overToken.balanceOf(address(this));
    }
}