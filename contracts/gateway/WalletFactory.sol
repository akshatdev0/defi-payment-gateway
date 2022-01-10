// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./Wallet.sol";

contract WalletFactory is Initializable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    mapping(bytes32 => address) public getWallet;
    mapping(address => bytes32) public getIdentifier;
    address[] public allWallets;
    address public treasury;

    event WalletCreated(bytes32 identifier, address indexed walletAddress, uint256);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    function initialize(address owner_, address treasury_) public initializer {
        require(owner_ != address(0), "WalletFactory: new owner is the zero address");
        require(treasury_ != address(0), "WalletFactory: new treasury is the zero address");
        OwnableUpgradeable.__Ownable_init();
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
        _transferOwnership(owner_);
        _updateTreasury(treasury_);
    }

    function totalWallets() external view returns (uint256) {
        return allWallets.length;
    }

    function createWallet(bytes32 identifier) external onlyOwner {
        bytes32 salt = keccak256(abi.encodePacked(identifier));
        Wallet wallet = new Wallet{ salt: salt }();
        wallet.initialize(address(this));
        address walletAddress = address(wallet);
        getWallet[identifier] = walletAddress;
        getIdentifier[walletAddress] = identifier;
        allWallets.push(walletAddress);
        emit WalletCreated(identifier, walletAddress, allWallets.length);
    }

    function transferFrom(
        bytes32 identifier,
        address token,
        uint256 amount
    ) external onlyOwner {
        Wallet wallet = Wallet(getWallet[identifier]);
        wallet.transfer(token, treasury, amount);
    }

    function updateTreasury(address newTreasury) public virtual onlyOwner {
        require(newTreasury != address(0), "WalletFactory: new treasury is the zero address");
        _updateTreasury(newTreasury);
    }

    function _updateTreasury(address newTreasury) internal virtual {
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
}
