// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TreasuryModule
 * @notice Manages DAO treasury funds
 */
contract TreasuryModule is ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public dao;
    address public governance;
    bool public isInitialized;

    uint256 public totalDeposits;
    uint256 public totalWithdrawals;

    mapping(address => uint256) public tokenBalances;
    address[] public supportedTokens;

    event Deposit(address indexed from, address indexed token, uint256 amount);
    event Withdrawal(address indexed to, address indexed token, uint256 amount);
    event TokenAdded(address indexed token);

    modifier onlyGovernance() {
        require(msg.sender == governance, "Only governance");
        _;
    }

    modifier onlyInitialized() {
        require(isInitialized, "Not initialized");
        _;
    }

    function initialize(address _dao, address _governance) external {
        require(!isInitialized, "Already initialized");
        require(_dao != address(0), "Invalid DAO");
        require(_governance != address(0), "Invalid governance");

        dao = _dao;
        governance = _governance;
        isInitialized = true;
    }

    receive() external payable {
        totalDeposits += msg.value;
        emit Deposit(msg.sender, address(0), msg.value);
    }

    function deposit() external payable onlyInitialized {
        require(msg.value > 0, "No ETH sent");
        totalDeposits += msg.value;
        emit Deposit(msg.sender, address(0), msg.value);
    }

    function depositToken(address token, uint256 amount) external onlyInitialized {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Amount must be > 0");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        if (tokenBalances[token] == 0) {
            supportedTokens.push(token);
            emit TokenAdded(token);
        }

        tokenBalances[token] += amount;
        totalDeposits += amount;

        emit Deposit(msg.sender, token, amount);
    }

    function withdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyInitialized onlyGovernance nonReentrant {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");

        if (token == address(0)) {
            require(address(this).balance >= amount, "Insufficient ETH");
            totalWithdrawals += amount;
            (bool success, ) = to.call{value: amount}("");
            require(success, "ETH transfer failed");
        } else {
            require(tokenBalances[token] >= amount, "Insufficient token balance");
            tokenBalances[token] -= amount;
            totalWithdrawals += amount;
            IERC20(token).safeTransfer(to, amount);
        }

        emit Withdrawal(to, token, amount);
    }

    function getBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        }
        return tokenBalances[token];
    }

    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
}
