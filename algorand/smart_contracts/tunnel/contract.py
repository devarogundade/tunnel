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
    # Collateral amoount dropped
    collateral: abi.Field[abi.Uint64]
    # Starting time of loan
    start_at: abi.Field[abi.Uint64]


class TunnelState:
    # Accepted collateral:
    collateral = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Supply apr: interest rate per seconds
    supply_apr = GlobalStateValue(stack_type=TealType.uint64, default=Int(1_050_000))

    # Borrow apr: interest rate per seconds
    borrow_apr = GlobalStateValue(stack_type=TealType.uint64, default=Int(1_030_000))

    # Total supply:
    total_supply = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Min supply: 1 Algo
    min_supply = GlobalStateValue(stack_type=TealType.uint64, default=Int(1_000_000))

    # Loan to value: Default 80 percent of collateral
    ltv = GlobalStateValue(stack_type=TealType.uint64, default=Int(800_000))

    # Total borrow:
    total_borrow = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Address -> Borrow borrow
    borrows = BoxMapping(key_type=abi.Address, value_type=Borrow)

    # Address -> Borrow borrow
    supplies = BoxMapping(key_type=abi.Address, value_type=Supply)

    # Rate divider
    rate_divider = GlobalStateValue(stack_type=TealType.uint64, default=Int(1_000_000))


def read_next(vaa: Expr, offset: int, t: abi.BaseType) -> tuple[int, Expr]:
    size = t.type_spec().byte_length_static()
    return offset + size, t.decode(vaa, start_index=Int(offset), length=Int(size))


app = Application("TunnelFi", state=TunnelState)


# STATEFUL FUNCTIONS


# create method that initializes global state
@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()


# opt_into_asset method that opts the contract account into an ASA
@app.external(authorize=Authorize.only(Global.creator_address()))
def opt_in_asset(asset: abi.Asset) -> Expr:
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
        app.state.collateral.set(asset.asset_id()),
    )


# create set tunnel collateral ASA
@app.external(authorize=Authorize.only(Global.creator_address()))
def set_collateral(name: abi.Byte, symbol: abi.Byte, supply: abi.Uint64) -> Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_name: Bytes("Wormhole Shares"),
                TxnField.config_asset_unit_name: Bytes("WSHARES"),
                TxnField.config_asset_clawback: Global.current_application_address(),
                TxnField.config_asset_reserve: Global.current_application_address(),
                TxnField.config_asset_freeze: Global.current_application_address(),
                TxnField.config_asset_manager: Global.current_application_address(),
                TxnField.config_asset_default_frozen: Int(1),
                TxnField.config_asset_total: supply.get(),
                TxnField.config_asset_decimals: Int(0),
            }
        )
    )


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
        app.state.total_supply.set(
            Add(app.state.total_supply.get(), payment.get().amount())
        ),
    )


# test func
@app.external
def weeeee(asset: abi.Asset, *, output: abi.Uint64) -> Expr:
    return Seq(
        balance := AssetHolding.balance(Txn.sender(), asset.asset_id()),
        Assert(balance.hasValue(), comment="Asset not frozen"),
        output.set(balance.value()),
        # output2.set(principalOf(balance.value(), Int(1))),
    )


@app.external
def borrow(asset: abi.Asset) -> Expr:
    # Temporary variables
    borrow = Borrow()
    start_at = abi.Uint64()

    principal = abi.Uint64()
    collateral = abi.Uint64()

    return Seq(
        # Check the asset is the collateral
        Assert(
            app.state.collateral.get() == asset.asset_id(),
            comment="Wrong collateral",
        ),
        # Check asset is frozen
        frozen := AssetHolding.frozen(Txn.sender(), asset.asset_id()),
        Assert(frozen.hasValue(), frozen.value() == Int(1), comment="Asset not frozen"),
        # Set start time
        start_at.set(Global.latest_timestamp()),
        # Get collateral
        balance := AssetHolding.balance(Txn.sender(), asset.asset_id()),
        Assert(balance.hasValue(), comment="Not balance found"),
        collateral.set(balance.value()),
        # Use collateral to calc principal
        principal.set(principalOf(balance.value(), Int(1))),
        # Transfer principal to address
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: principal.get(),
                TxnField.receiver: Txn.sender(),
                TxnField.sender: Global.current_application_address(),
                TxnField.fee: Int(0),
            }
        ),
        # Create their borrow position
        borrow.set(principal, collateral, start_at),
        app.state.borrows[Txn.sender()].set(borrow),
        app.state.total_borrow.set(Add(app.state.total_borrow.get(), principal.get())),
    )


@app.external
def repay(payment: abi.PaymentTransaction) -> Expr:
    # Temporary variables
    borrow = Borrow()

    interest = abi.Uint64()

    start_at = abi.Uint64()
    principal = abi.Uint64()

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Check if there is borrow position
        Assert(
            app.state.borrows[Txn.sender()].exists(),
            comment="You dont have a borrow position",
        ),
        # Store the borrow position
        app.state.borrows[Txn.sender()].store_into(borrow),
        # Check the rapayment amount
        borrow.principal.store_into(principal),
        borrow.start_at.store_into(start_at),
        # Earned interest
        interest.set(
            interestOf(principal.get(), start_at.get(), app.state.borrow_apr.get())
        ),
        # Check the repayment receiver
        Assert(payment.get().receiver() == Global.current_application_address()),
        # Check amount is sufficient
        Assert(
            payment.get().amount() >= Add(interest.get(), principal.get()),
            comment="Insufficient amount",
        ),
        # Delete user borrow position
        # app.state.borrows[Txn.sender()].delete(),
        app.state.total_borrow.set(
            Minus(app.state.total_borrow.get(), principal.get())
        ),
    )


@app.external
def withdraw() -> Expr:
    # Temporary variables
    supply = Supply()

    interest = abi.Uint64()

    start_at = abi.Uint64()
    principal = abi.Uint64()

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Check if sender has supply position
        Assert(
            app.state.supplies[Txn.sender()].exists(),
            comment="You have a supply position",
        ),
        # Store the position
        app.state.supplies[Txn.sender()].store_into(supply),
        # Store amount
        supply.start_at.store_into(start_at),
        supply.amount.store_into(principal),
        # Accrued interest
        interest.set(
            interestOf(principal.get(), start_at.get(), app.state.supply_apr.get())
        ),
        # Transfer principal to address
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: Add(interest.get(), principal.get()),
                TxnField.receiver: Txn.sender(),
                TxnField.sender: Global.current_application_address(),
                TxnField.fee: Int(0),
            }
        ),
        # Delete their position
        # app.state.supplies[Txn.sender()].delete(),
        # Total supply
        app.state.total_supply.set(
            Minus(app.state.total_supply.get(), principal.get())
        ),
    )


@app.external
def receiveMessage(
    nonce: abi.Uint64, asset: abi.Asset, amount: abi.Uint64, receiver: abi.Account
) -> Expr:
    # Temporary variables

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Send the asset to receiver
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_amount: amount.get(),
                TxnField.asset_receiver: receiver.address(),
                TxnField.asset_sender: Global.current_application_address(),
                TxnField.fee: Int(0),
            }
        )
    )


@app.external
def un_bridge(
    asset: abi.Asset, wormhole: abi.Application, wormhole_account: abi.Account
) -> Expr:
    # Temporary variables
    mfee = abi.Uint64()
    payload = ScratchVar(TealType.bytes)
    publish_signature = Bytes("publishMessage")

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Check the asset is the collateral
        Assert(
            app.state.collateral.get() == asset.asset_id(),
            comment="Wrong collateral",
        ),
        # Check if the user has a borrow position
        Assert(
            app.state.borrows[Txn.sender()].exists() == Int(0),
            comment="You have a borrow position",
        ),
        # Get the balance of the user
        balance := AssetHolding.balance(Txn.sender(), asset.asset_id()),
        Assert(balance.hasValue(), comment="Not balance found"),
        # Set Message fee
        mfee.set(getMessageFee(wormhole.application_id())),
        # Payload
        payload.store(
            Concat(
                Itob(app.state.collateral.get()), Itob(balance.value()), Txn.sender()
            )
        ),
        # Start transaction
        InnerTxnBuilder.Begin(),
        # Pay message fee
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: wormhole_account.address(),
                TxnField.amount: mfee.get(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Then unfreeze the asset
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetFreeze,
                TxnField.freeze_asset: asset.asset_id(),
                TxnField.freeze_asset_account: Txn.sender(),
                TxnField.freeze_asset_frozen: Int(0),
                TxnField.sender: Global.current_application_address(),
                TxnField.fee: Int(0),
            }
        ),
        # Send the asset to back to tunnel
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_amount: balance.value(),
                TxnField.asset_receiver: Global.current_application_address(),
                TxnField.asset_sender: Txn.sender(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Publish message
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.ApplicationCall,
                TxnField.application_id: wormhole.application_id(),
                TxnField.application_args: [
                    publish_signature,
                    payload.load(),
                    Itob(Int(0)),
                ],
                TxnField.accounts: [Txn.accounts[1]],
                TxnField.note: publish_signature,
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
    )


# VIEW


@app.external
def borrow_of(address: abi.Address, *, output: Borrow) -> Expr:
    return app.state.borrows[address.get()].store_into(output)


@app.external
def supply_of(address: abi.Address, *, output: Supply) -> Expr:
    return app.state.supplies[address.get()].store_into(output)


# PRIVATE FUNCTIONS


@Subroutine(TealType.uint64)
def getMessageFee(wormhole_id: Expr) -> Expr:
    return Seq(
        mfee := App.globalGetEx(wormhole_id, Bytes("MessageFee")),
        Assert(mfee.hasValue()),
        mfee.value(),
    )


@Subroutine(TealType.uint64)
def principalOf(collateral: Expr, collateral_value: Expr) -> Expr:
    return Div(
        Mul(Mul(collateral, collateral_value), app.state.ltv.get()),
        app.state.rate_divider.get(),
    )


@Subroutine(TealType.uint64)
def interestOf(amount: Expr, start_at: Expr, rate: Expr) -> Expr:
    return Div(
        Mul(Mul(amount, rate), Minus(Global.latest_timestamp(), start_at)),
        app.state.rate_divider.get(),
    )
