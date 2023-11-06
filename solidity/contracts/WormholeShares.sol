// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IWormhole.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WormholeShares is ERC20 {
    mapping(address => bool) private _allowed;

    constructor() ERC20("Wormhole Shares", "WSHARES") {
        _mint(address(this), 1_000_000_000_000_000_000_000_000);
    }

    function faucet(uint256 amount) external {
        require(_allowed[msg.sender] == true);
        _transfer(address(this), msg.sender, amount);
    }

    function allow() external {
        _allowed[msg.sender] = true;
    }
}
