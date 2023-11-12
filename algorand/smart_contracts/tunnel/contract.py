from beaker import *
from pyteal import *
from beaker.lib.storage import BoxMapping
from typing import Literal

# TYPES

Bytes32 = abi.StaticBytes[Literal[32]]

# TUPLES


class Supply(abi.NamedTuple):
    # Amount in Algo supplied
    principal: abi.Field[abi.Uint64]
    # Starting time of supply
    start_at: abi.Field[abi.Uint64]


class Borrow(abi.NamedTuple):
    # Loan amount in Algo
    principal: abi.Field[abi.Uint64]
    # Collateral amoount dropped
    collateral: abi.Field[abi.Uint64]
    # Starting time of loan
    start_at: abi.Field[abi.Uint64]


# STATE


class TunnelState:
    # Global States

    # Accepted collateral: ASA
    collateral = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Supply apr: interest rate per seconds
    supply_apr = GlobalStateValue(stack_type=TealType.uint64, default=Int(100))

    # Borrow apr: interest rate per seconds
    borrow_apr = GlobalStateValue(stack_type=TealType.uint64, default=Int(120))

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

    # SnipeAble Amount: Liquidate ASAs
    snipeable_amount = GlobalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Snipe Rate: Rate of sniping to market value
    snipe_rate = GlobalStateValue(stack_type=TealType.uint64, default=Int(1_050_000))

    # Local States

    # Amount of borrow
    borrowed_amount = LocalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Start time of borrow
    borrowed_start_at = LocalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Amount of supply
    supplied_amount = LocalStateValue(stack_type=TealType.uint64, default=Int(0))

    # Start time of supply
    supplied_start_at = LocalStateValue(stack_type=TealType.uint64, default=Int(0))


# APP

app = Application(
    name="TunnelFi", state=TunnelState, descr="RWA Bridge and Lending Platform"
)


# STATEFUL FUNCTIONS


# create method that initializes global state
@app.create(bare=True)
def create() -> Expr:
    return app.initialize_global_state()


# opt_into_app method that allows accounts to opt in to local state
@app.opt_in(bare=True)
def opt_in() -> Expr:
    return Seq(
        app.state.borrowed_amount[Txn.sender()].set_default(),
        app.state.borrowed_start_at[Txn.sender()].set_default(),
        app.state.supplied_amount[Txn.sender()].set_default(),
        app.state.supplied_start_at[Txn.sender()].set_default(),
    )


# Provide liquidity
@app.external
def supply(payment: abi.PaymentTransaction) -> Expr:
    # Temporary variables
    supply = Supply()

    principal = abi.Uint64()
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
        # Set start time
        start_at.set(Global.latest_timestamp()),
        # Set principal
        principal.set(payment.get().amount()),
        # Update local position
        app.state.supplied_amount[Txn.sender()].set(principal.get()),
        app.state.supplied_start_at[Txn.sender()].set(start_at.get()),
        # Update global position
        supply.set(principal, start_at),
        app.state.supplies[Txn.sender()].set(supply),
        # Update total supply
        app.state.total_supply.set(
            Add(app.state.total_supply.get(), payment.get().amount())
        ),
    )


# Withdraw liquidity
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
            comment="You dont have a supply position",
        ),
        # Store the position
        app.state.supplies[Txn.sender()].store_into(supply),
        # Store amount
        supply.start_at.store_into(start_at),
        supply.principal.store_into(principal),
        # Earned interest
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
        # Update local position
        app.state.supplied_amount[Txn.sender()].set(Int(0)),
        app.state.supplied_start_at[Txn.sender()].set(Int(0)),
        # Update global position
        Pop(app.state.supplies[Txn.sender()].delete()),
        # Update total supply
        app.state.total_supply.set(
            Minus(app.state.total_supply.get(), principal.get())
        ),
    )


# Borrow algo with asset
@app.external
def borrow(asset: abi.Asset, amount: abi.Uint64) -> Expr:
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
        # Set start time
        start_at.set(Global.latest_timestamp()),
        # Set collateral
        balance := AssetHolding.balance(Txn.sender(), asset.asset_id()),
        Assert(balance.hasValue(), comment="Not balance found"),
        # Check balance is sufficient
        Assert(balance.value() >= amount.get(), comment="Insufficient balance"),
        # Set collateral
        collateral.set(amount.get()),
        # Use collateral to calc principal
        principal.set(principalOf(collateral.get(), Int(1))),
        # Begin inner transaction
        InnerTxnBuilder.Begin(),
        # Then unfreeze the asset
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetFreeze,
                TxnField.freeze_asset: asset.asset_id(),
                TxnField.freeze_asset_account: Txn.sender(),
                TxnField.freeze_asset_frozen: Int(0),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Send the asset to tunnel
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_amount: collateral.get(),
                TxnField.asset_receiver: Global.current_application_address(),
                TxnField.asset_sender: Txn.sender(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Then freeze the asset
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetFreeze,
                TxnField.freeze_asset: asset.asset_id(),
                TxnField.freeze_asset_account: Txn.sender(),
                TxnField.freeze_asset_frozen: Int(1),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Transfer principal to address
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.amount: principal.get(),
                TxnField.receiver: Txn.sender(),
                TxnField.sender: Global.current_application_address(),
                TxnField.fee: Int(0),
            }
        ),
        # Submit inner transaction
        InnerTxnBuilder.Submit(),
        # Update local position
        app.state.borrowed_amount[Txn.sender()].set(principal.get()),
        app.state.borrowed_start_at[Txn.sender()].set(start_at.get()),
        # Update global position
        borrow.set(principal, collateral, start_at),
        app.state.borrows[Txn.sender()].set(borrow),
        # Update total borrow
        app.state.total_borrow.set(Add(app.state.total_borrow.get(), principal.get())),
    )


# Settle loan position
@app.external
def repay(payment: abi.PaymentTransaction) -> Expr:
    # Temporary variables
    borrow = Borrow()

    interest = abi.Uint64()

    start_at = abi.Uint64()
    principal = abi.Uint64()
    collateral = abi.Uint64()

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
        borrow.collateral.store_into(collateral),
        borrow.principal.store_into(principal),
        borrow.start_at.store_into(start_at),
        # Accrued interest
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
        # Send the asset to back to borrower
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_amount: collateral.get(),
                TxnField.xfer_asset: app.state.collateral.get(),
                TxnField.asset_receiver: Txn.sender(),
                TxnField.asset_sender: Global.current_application_address(),
                TxnField.fee: Int(0),
            }
        ),
        # Update local position
        app.state.borrowed_amount[Txn.sender()].set(Int(0)),
        app.state.borrowed_start_at[Txn.sender()].set(Int(0)),
        # Update global position
        Pop(app.state.borrows[Txn.sender()].delete()),
        # Update total borrow
        app.state.total_borrow.set(
            Minus(app.state.total_borrow.get(), principal.get())
        ),
    )


# Bridge back assets
@app.external
def un_bridge(
    asset: abi.Asset,
    amount: abi.Uint64,
    wormhole: abi.Uint64,
    wormhole_addr: abi.Address,
    storage_addr: abi.Address,
) -> Expr:
    # Temporary variables
    mfee = abi.Uint64()

    payload = ScratchVar(TealType.bytes)

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Check the asset is the collateral
        Assert(
            app.state.collateral.get() == asset.asset_id(),
            comment="Wrong collateral",
        ),
        # Get the balance of the user
        balance := AssetHolding.balance(Txn.sender(), asset.asset_id()),
        Assert(balance.hasValue(), comment="Not balance found"),
        # Check balance is sufficient
        Assert(balance.value() >= amount.get(), comment="Insufficient balance"),
        # Set Message fee
        mfee.set(getMessageFee(wormhole)),
        # Payload
        payload.store(
            Concat(Itob(app.state.collateral.get()), Itob(amount.get()), Txn.sender())
        ),
        # Begin inner transaction
        InnerTxnBuilder.Begin(),
        # Then unfreeze the asset
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetFreeze,
                TxnField.freeze_asset: asset.asset_id(),
                TxnField.freeze_asset_account: Txn.sender(),
                TxnField.freeze_asset_frozen: Int(0),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Send the asset to back to tunnel
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_amount: amount.get(),
                TxnField.asset_receiver: Global.current_application_address(),
                TxnField.asset_sender: Txn.sender(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Then freeze the asset
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.AssetFreeze,
                TxnField.freeze_asset: asset.asset_id(),
                TxnField.freeze_asset_account: Txn.sender(),
                TxnField.freeze_asset_frozen: Int(1),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Submit(),
        ############# WORMHOLE ###############
        # Begin inner transaction
        InnerTxnBuilder.Begin(),
        # Pay message fee
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: wormhole_addr.get(),
                TxnField.amount: mfee.get(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Publish message
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.ApplicationCall,
                TxnField.application_id: wormhole.get(),
                TxnField.application_args: [
                    Bytes("publishMessage"),
                    payload.load(),
                    Itob(Int(0)),
                ],
                TxnField.accounts: [storage_addr.get()],  # storage account
                TxnField.note: Bytes("publishMessage"),
                TxnField.fee: Int(0),
            }
        ),
        # Submit inner transaction
        InnerTxnBuilder.Submit(),
    )


# Snipe liquidated position
@app.external
def snipe(
    payment: abi.PaymentTransaction,
    wormhole: abi.Uint64,
    wormhole_addr: abi.Address,
    storage_addr: abi.Address,
) -> Expr:
    # Temporary variables
    mfee = abi.Uint64()

    payload = ScratchVar(TealType.bytes)

    snipe_amount = abi.Uint64()

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Check the receiver is the contract address
        Assert(
            payment.get().receiver() == Global.current_application_address(),
            comment="Receiver not valid",
        ),
        # Calculate snipe amount
        snipe_amount.set(snipeOf(payment.get().amount())),
        # Check the snipeable amount is sufficient
        Assert(
            app.state.snipeable_amount.get() >= snipe_amount.get(),
            comment="Insufficient amount",
        ),
        # Update snipeable_amount
        app.state.snipeable_amount.set(
            Minus(app.state.snipeable_amount.get(), snipe_amount.get())
        ),
        # Check if the user has a borrow position
        Assert(
            app.state.borrows[Txn.sender()].exists() == Int(0),
            comment="You have a borrow position",
        ),
        # Set Message fee
        mfee.set(getMessageFee(wormhole)),
        # Payload
        payload.store(
            Concat(
                Itob(app.state.collateral.get()), Itob(snipe_amount.get()), Txn.sender()
            )
        ),
        ############# WORMHOLE ###############
        # Begin inner transaction
        InnerTxnBuilder.Begin(),
        # Pay message fee
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.Payment,
                TxnField.receiver: wormhole_addr.get(),
                TxnField.amount: mfee.get(),
                TxnField.fee: Int(0),
            }
        ),
        InnerTxnBuilder.Next(),
        # Publish message
        InnerTxnBuilder.SetFields(
            {
                TxnField.type_enum: TxnType.ApplicationCall,
                TxnField.application_id: wormhole.get(),
                TxnField.application_args: [
                    Bytes("publishMessage"),
                    payload.load(),
                    Itob(Int(0)),
                ],
                TxnField.accounts: [storage_addr.get()],  # storage account
                TxnField.note: Bytes("publishMessage"),
                TxnField.fee: Int(0),
            }
        ),
        # Submit inner transaction
        InnerTxnBuilder.Submit(),
    )


# AUTHORIZED FUNCTIONS


# opt_into_asset method that opts the contract account into an ASA
@app.external(authorize=Authorize.only(Global.creator_address()))
def set_collateral(asset_id: abi.Uint64) -> Expr:
    return app.state.collateral.set(asset_id.get())


# create set tunnel collateral ASA
@app.external(authorize=Authorize.only(Global.creator_address()))
def create_collateral(
    name: abi.String, unit_name: abi.String, supply: abi.Uint64
) -> Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetConfig,
                TxnField.config_asset_name: name.get(),
                TxnField.config_asset_unit_name: unit_name.get(),
                TxnField.config_asset_clawback: Global.current_application_address(),
                TxnField.config_asset_reserve: Global.current_application_address(),
                TxnField.config_asset_manager: Global.current_application_address(),
                TxnField.config_asset_freeze: Global.current_application_address(),
                # Default asset frozen
                TxnField.config_asset_default_frozen: Int(1),
                TxnField.config_asset_total: supply.get(),
                TxnField.config_asset_decimals: Int(6),
            }
        )
    )


# Receive worhmole message
@app.external(authorize=Authorize.only(Global.creator_address()))
def receiveMessage(
    nonce: abi.Uint64, asset: abi.Asset, amount: abi.Uint64, receiver: abi.Address
) -> Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Validate nonce # Should be improved
        Assert(nonce.get() >= Int(0), comment="Invalid nonce"),
        # Check asset id
        Assert(asset.asset_id() == app.state.collateral.get(), comment="Invalid asset"),
        # Send the asset to receiver
        InnerTxnBuilder.Execute(
            {
                TxnField.type_enum: TxnType.AssetTransfer,
                TxnField.asset_amount: amount.get(),
                TxnField.xfer_asset: asset.asset_id(),
                TxnField.asset_receiver: receiver.get(),
                TxnField.asset_sender: Global.current_application_address(),
                TxnField.fee: Int(0),
            }
        ),
    )


# Liquidate borrower position
@app.external(authorize=Authorize.only(Global.creator_address()))
def liquidate(borrower: abi.Account) -> Expr:
    # Temporary variables
    borrow = Borrow()

    principal = abi.Uint64()
    collateral = abi.Uint64()

    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return Seq(
        # Check if there is borrow position
        Assert(
            app.state.borrows[borrower.address()].exists(),
            comment="Address dont have a borrow position",
        ),
        # Store the borrow position
        app.state.borrows[borrower.address()].store_into(borrow),
        # Check the rapayment amount
        borrow.principal.store_into(principal),
        borrow.collateral.store_into(collateral),
        # Update local position
        app.state.borrowed_amount[borrower.address()].set(Int(0)),
        app.state.borrowed_start_at[borrower.address()].set(Int(0)),
        # Update global position
        Pop(app.state.borrows[borrower.address()].delete()),
        # Update total borrow
        app.state.total_borrow.set(
            Minus(app.state.total_borrow.get(), principal.get())
        ),
        # Update snipeable amount
        app.state.snipeable_amount.set(
            Add(app.state.snipeable_amount.get(), collateral.get())
        ),
    )


# PRIVATE FUNCTIONS


# Get wormhole message fee
@Subroutine(TealType.uint64)
def getMessageFee(wormhole_id: abi.Uint64) -> Expr:
    return Seq(
        mfee := App.globalGetEx(wormhole_id.get(), Bytes("MessageFee")),
        Assert(mfee.hasValue(), comment="No value"),
        mfee.value(),
    )


# Calculate borrowable amount of collateral
@Subroutine(TealType.uint64)
def principalOf(collateral: Expr, collateral_value: Expr) -> Expr:
    return Div(
        Mul(Mul(collateral, collateral_value), app.state.ltv.get()),
        app.state.rate_divider.get(),
    )


# Get interest of borrow or supply position
@Subroutine(TealType.uint64)
def interestOf(amount: Expr, start_at: Expr, rate: Expr) -> Expr:
    return Div(
        Mul(Mul(amount, rate), Minus(Global.latest_timestamp(), start_at)),
        app.state.rate_divider.get(),
    )


# Get the snipe amount of capital
@Subroutine(TealType.uint64)
def snipeOf(amount: Expr) -> Expr:
    return Div(
        Mul(amount, app.state.snipe_rate.get()),
        app.state.rate_divider.get(),
    )
