from beaker import *
from pyteal import *
from typing import Literal
from beaker.lib.storage import BoxMapping


class Supply(abi.NamedTuple):
    # Amount in Algo supplied
    amount: abi.Field[abi.Uint64]
    # Starting time of supply
    start_at: abi.Field[abi.Uint64]


class Borrow(abi.NamedTuple):
    # Loan amount in Algo
    principal: abi.Field[abi.Uint64]
    # Starting time of loan
    start_at: abi.Field[abi.Uint64]
    # Repaid time of loan
    repaid_at: abi.Field[abi.Uint64]
    # Collateral amoount dropped
    collateral: abi.Field[abi.Uint64]
    # Collateral asset type
    collateral_asa: abi.Field[abi.Asset]
    # Liquidation time
    liquidate_at: abi.Field[abi.Uint8]


class Collateral(abi.NamedTuple):
    # Price in Algo: Should be an oracle instead
    value: abi.Field[abi.Uint64]
    # Address of the issuer
    issuer: abi.Field[abi.Address]


class TunnelState:
    # ASA: IDs of the ASA being used as collateral
    supported_collaterals = BoxMapping(key_type=abi.Uint64, value_type=Collateral)

    # Supply apr:
    supply_apr = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Borrow apr:
    borrow_apr = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Total supply:
    total_supply = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Min supply: 1 Algo
    min_supply = GlobalStateValue(stack_type=TealType.uint64, default=Int(1_000_000))

    # Loan to value: Default 80 percent
    ltv = GlobalStateValue(stack_type=TealType.uint64, default=Int(8_000))

    # Total borrow:
    total_borrow = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Relayer: Wormhole Relayer
    relayer = GlobalStateValue(stack_type=TealType.uint64, default=Int(86525623))

    # Address pairs from ETH CONTRACT -> ALGO CONTRACT
    pairs = BoxMapping(key_type=abi.Byte, value_type=abi.Byte)

    # Target contract pairs
    sourceIds = BoxMapping(key_type=abi.Uint64, value_type=abi.Byte)

    # Address -> Borrow borrow
    borrows = BoxMapping(key_type=abi.Address, value_type=Borrow)

    # Address -> Borrow borrow
    supplies = BoxMapping(key_type=abi.Address, value_type=Supply)


def read_next(vaa: Expr, offset: int, t: abi.BaseType) -> tuple[int, Expr]:
    size = t.type_spec().byte_length_static()
    return offset + size, t.decode(vaa, start_index=Int(offset), length=Int(size))


Bytes32 = abi.StaticBytes[Literal[32]]


class ContractTransferVAA:
    def __init__(self):
        #: Version of VAA
        self.version = abi.Uint8()
        #: Which guardian set to be validated against
        self.index = abi.Uint32()
        #: How many signatures
        self.siglen = abi.Uint8()
        #: TS of message
        self.timestamp = abi.Uint32()
        #: Uniquifying
        self.nonce = abi.Uint32()
        #: The Id of the chain where the message originated
        self.chain = abi.Uint16()
        #: The address of the contract that emitted this message on the origin chain
        self.emitter = abi.Address()
        #: Unique integer representing the index, used for dedupe/ordering
        self.sequence = abi.Uint64()

        self.consistency = abi.Uint8()  # ?

        #: Type of message
        self.type = abi.Uint8()
        #: amount of transfer
        self.amount = abi.make(Bytes32)
        #: asset transferred
        self.contract = abi.make(Bytes32)
        #: Id of the chain the token originated
        self.from_chain = abi.Uint16()
        #: Receiver of the token transfer
        self.to_address = abi.Address()
        #: Id of the chain where the token transfer should be redeemed
        self.to_chain = abi.Uint16()
        #: Amount to pay relayer
        self.fee = abi.make(Bytes32)
        #: Address that sent the transfer
        self.from_address = abi.Address()

        #: Arbitrary byte payload
        self.payload = abi.DynamicBytes()

    def decode(self, vaa: Expr) -> Expr:
        offset = 0
        ops: list[Expr] = []

        offset, e = read_next(vaa, offset, self.version)
        ops.append(e)

        offset, e = read_next(vaa, offset, self.index)
        ops.append(e)

        offset, e = read_next(vaa, offset, self.siglen)
        ops.append(e)

        # Increase offset to skip over sigs && digest
        # since these should be checked by the wormhole core contract
        ops.append(
            (digest_vaa := ScratchVar()).store(
                Suffix(vaa, Int(offset) + (self.siglen.get() * Int(66)))
            )
        )

        # Reset the offset now that we have const length elements
        offset = 0
        offset, e = read_next(digest_vaa.load(), offset, self.timestamp)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.nonce)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.chain)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.emitter)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.sequence)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.consistency)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.type)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.amount)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.contract)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.from_chain)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.to_address)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.to_chain)
        ops.append(e)
        offset, e = read_next(digest_vaa.load(), offset, self.from_address)
        ops.append(e)
        # Rest is payload
        ops.append(self.payload.set(Suffix(digest_vaa.load(), Int(offset))))

        return Seq(*ops)


app = Application("TunnelFi", state=TunnelState)


# create method that initializes global state
@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()


# opt_into_asset method that opts the contract account into an ASA
@app.external(authorize=Authorize.only(Global.creator_address()))
def opt_into_asset(asset: abi.Asset) -> Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Send the transaction to opt in
        # Opt == transfer of 0 amount from/to the same account
        # Send a 0 asset transfer, of asset, from contract to contract
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_receiver: Global.current_application_address(),
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_amount: Int(0),
                # Nomrally fees are 0.0001 ALGO
                # An inner transaction is 0.0001 ALGO
                # Setting inner transaction fee to 0, means outer fee must be 0.0002 ALGO
                TxnField.fee: Int(0),
            }
        ),
    )


@app.external(authorize=Authorize.only(Global.creator_address()))
def add_collateral(
    asset_id: abi.Uint64,
    collateral: Collateral,
) -> Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return app.state.supported_collaterals[asset_id].set(collateral)


@app.external(authorize=Authorize.only(Global.creator_address()))
def add_pair(pair0: abi.Byte, pair1: abi.Byte) -> Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(app.state.pairs[pair0].set(pair1))


@app.external(authorize=Authorize.only(Global.creator_address()))
def set_target_id(sourceChain: abi.Uint64, address: abi.Byte) -> Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(app.state.sourceIds[sourceChain].set(address))


@app.external
def supply(payment: abi.PaymentTransaction) -> Expr:
    # Temporary variables
    supply = Supply()

    amount = abi.Uint64()
    start_at = abi.Uint64()

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Check the receiver is the contract address
        Assert(
            payment.get().receiver() == Global.current_application_address(),
            comment="Receiver not valid",
        ),
        # Check user does not have a supply position
        Assert(
            app.state.supplies[Txn.sender()].exists() == Int(0),
            comment="Already has a position",
        ),
        # Check the supply amount is sufficient
        Assert(
            payment.get().amount() >= app.state.min_supply.get(),
            comment="Amount not sufficient",
        ),
        # Update total supply
        app.state.total_supply.set(
            app.state.total_supply.get() + payment.get().amount()
        ),
        # Initialize user position
        amount.set(payment.get().amount()),
        start_at.set(Global.latest_timestamp()),
        # Set user position
        supply.set(amount, start_at),
        # Update user position
        app.state.supplies[Txn.sender()].set(supply),
    )


@app.external
def supply_profile(address: abi.Address, *, output: Supply) -> Expr:
    # Temporary variables
    supply = app.state.supplies[address].get()

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq()


@app.external
def borrow() -> Expr:
    return Seq()


# @app.external
# def repay(payment: abi.PaymentTransaction) -> Expr:
#     # Temporary variables
#     borrow = app.state.borrows[Txn.sender()]
#     principal = abi.Uint64()

#     # On-chain logic that uses multiple expressions, always goes in the returned Seq
#     return Seq(
#         Assert(borrow.exists(), comment="You dont have a borrow position"),
#         #
#         Assert(payment.get().amount() >= principal.get()),
#         borrow.delete(),
#     )


# @app.external
# def withdraw() -> Expr:
#     # Temporary variables
#     supply = app.state.supplies[Txn.sender()]

#     # On-chain logic that uses multiple expressions, always goes in the returned Seq
#     return Seq(supply.delete())


@app.external
def portal_transfer(vaa: abi.DynamicBytes, *, output: abi.DynamicBytes) -> Expr:
    # Temporary variables
    (data := ContractTransferVAA()).decode(vaa.get())

    # TODO

    xfer = ScratchVar(TealType.uint64)
    amount = ScratchVar(TealType.uint64)
    receiver = ScratchVar(TealType.bytes)
    freeze = ScratchVar(TealType.uint64)

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        xfer.store(Int(1234)),
        amount.store(Int(0)),
        receiver.store(Bytes("test")),
        freeze.store(Int(0)),
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: xfer.load(),
                TxnField.asset_amount: amount.load(),
                TxnField.asset_receiver: receiver.load(),
                TxnField.sender: Global.current_application_address(),
                TxnField.freeze_asset: freeze.load(),
                TxnField.fee: Int(0),
            }
        ),
    )


@app.external
def un_bridge(sourceChain: abi.Uint64) -> Expr:
    # Temporary variables
    message = Bytes("Hello World")
    payload = ScratchVar(TealType.bytes)
    publish_signature = Bytes("publishMessage")

    borrow = app.state.borrows[Txn.sender()]

    sourceId = app.state.sourceIds[sourceChain]

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        Assert(borrow.exists() == Int(0), comment="You have a borrow position"),
        Assert(sourceId.exists(), comment="Target does not exists"),
        payload.store(
            Concat(
                # Type: its a payload3
                Bytes("base16", "03"),
                # Amount: 0 amount
                BytesZero(Int(32)),
                # AssetId: 0 for algos, even tho we're not sending anything
                BytesZero(Int(32)),
                # FromChain: (0008 is Algorand)
                Bytes("base16", "0008"),
                # ToAddress
                # sourceId.get(),
                BytesZero(Int(24)),
                Global.current_application_address(),
                # ToChain
                Bytes("base16", "0001"),
                # FromAddress
                Global.current_application_address(),
                # Payload
                message,
            )
        ),
        InnerTxnBuilder.Execute(
            {
                TxnField.on_completion: OnComplete.NoOp,
                TxnField.type_enum: TxnType.ApplicationCall,
                TxnField.application_id: app.state.relayer.get(),
                TxnField.application_args: [
                    publish_signature,
                    payload.load(),
                    Itob(Int(0)),
                ],
                TxnField.fee: Int(0),
            }
        ),
    )
