// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IWormhole.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WormholeShares is ERC20 {
    mapping(address => bool) private _allowed;

    constructor(address tunnelFi) ERC20("Wormhole Shares", "WSHARES") {
        _mint(tunnelFi, 1_000_000_000_000_000_000_000_000);
    }

    function allow() external {
        _allowed[msg.sender] = true;
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        require(_allowed[to] == true);
        super._transfer(from, to, amount);
    }
}
