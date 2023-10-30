// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IWormholeRelayer.sol";
import "./interfaces/IWormholeReceiver.sol";

import "./../../../T-REX/contracts/token/IToken.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Tunnel is IWormholeReceiver {
    IWormholeRelayer private _wormholeRelayer;
    mapping(uint256 => bytes32) private _targetIds;
    mapping(bytes32 => bool) private _delivered;

    mapping(address => mapping(uint256 => bytes32)) private _receiver;

    uint256 private GAS_LIMIT;
    uint8 private CONSISTENCY_LEVEL = 200;
    uint256 private immutable CHAIN_ID;

    event RWALocked(
        address tokenAddress,
        uint256 amount,
        address from,
        address to,
        uint256 timestamp
    );

    event RWAReleased(
        address tokenAddress,
        unit256 amount,
        address from,
        address to,
        uint256 timestamp
    );

    event RWAReceiverCreated();

    event RWAReceiverUpdated();

    constructor(address wormholeRelayer_, uint256 chainId_) {
        CHAIN_ID = chainId_;
        _wormholeRelayer = IWormholeRelayer(wormholeRelayer_);
    }

    function createReceiver(
        uint256 targetChain,
        bytes32 receiverAddress
    ) external {
        address caller = _msgSender();

        require(
            _receiver[caller][targetChain] == bytes32(0),
            "Receiver already created"
        );

        _receiver[caller][targetChain] = receiverAddress;

        emit RWAReceiverCreated(caller, receiverAddress, targetChain);
    }

    function updateReceiver(
        uint256 targetChain,
        bytes32 newReceiverAddress
    ) external payable {
        address caller = _msgSender();

        require(
            _receiver[caller][targetChain] != bytes32(0),
            "Receiver not created"
        );

        _receiver[caller][targetChain] = receiverAddress;

        emit RWAReceiverCreated(caller, receiverAddress, targetChain);
    }

    /// @dev For getting briging fee
    function deliveryPrice(
        uint256 targetChain
    ) external view returns (uint256) {
        (uint256 nativePriceQuote, ) = _relayer.quoteDeliveryPrice(
            targetChain,
            receiverValue,
            encodedExecutionParameters,
            deliveryProviderAddress
        );

        return nativePriceQuote;
    }

    /// @dev For setting extension contract ids
    function setTargetId(uint256 targetChain, bytes32 targetId) external {
        _targetIds[targetChain] = targetId;
    }

    /// @dev This function locks the Original NFT
    /// and tell whirlExtension Contract to mint a new similar NFT
    function bridge(
        uint256 targetChain,
        address assetId,
        uint256 amount
    ) external payable {
        address caller = _msgSender();

        bytes32 receiver = _receiver[caller][targetChain];
        require(receiver != bytes(0), "Receiver not set");

        address targetId = _targetIds[targetChain];
        require(targetId != bytes(0), "RWA not listed");

        IToken asset = IToken(assetId);
        asset.transferFrom(caller, address(this), amount);

        bytes memory payload = abi.encode(assetId, amount, caller, receiver);

        uint256 cost = deliveryPrice(targetChain);

        require(msg.value >= cost, "Insufficient gas supplied");

        _wormholeRelayer.send{value: cost}(
            targetChain,
            _targetIds[targetChain],
            payload,
            receiverValue,
            paymentForExtraReceiverValue,
            encodedExecutionParameters,
            refundChain(),
            refundAddress(),
            deliveryProviderAddress,
            messageKeys,
            CONSISTENCY_LEVEL
        );

        emit RWALocked(assetId, amount, caller, receiver, block.timestamp);
    }

    /// @dev This function unlocks the Original NFT to the
    /// owner of the burnt similar NFT on whirlExtension
    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory additionalVaas,
        bytes32 sourceAddress,
        uint16 sourceChain,
        bytes32 deliveryHash
    ) external payable override {
        require(
            msg.sender == address(_wormholeRelayer),
            "Only wormhole relayer allowed"
        );

        // Ensure no duplicate deliveries
        require(!_delivered[deliveryHash], "Message already processed");
        _delivered[deliveryHash] = true;

        address caller = address(this);

        // Parse the payload and do the corresponding actions!
        (address assetId, uint256 amount, address receiver) = abi.decode(
            payload,
            (address, uint256, address)
        );

        IToken asset = IToken(assetId);
        asset.transfer(receiver, tokenId);

        emit RWAReleased(assetId, amount, caller, receiver, block.timestamp);
    }

    function refundAddress() public returns (address) {
        return address(this);
    }

    function refundChain() public returns (uint256) {
        return CHAIN_ID;
    }

    receive() external payable {}
}
