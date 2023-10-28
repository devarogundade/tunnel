import beaker
import pyteal as pt

class Position(pt.abi.NamedTuple):
    # Loan amount in Algo
    principal: pt.abi.Field[pt.abi.Uint64]
    # Loan asset type
    principal_asa: pt.abi.Field[pt.abi.Unit64]
    # Starting time of loan
    start_at: pt.abi.Field[pt.abi.Uint64]
    # Repaid time of loan
    repaid_at: pt.abi.Field[pt.abi.Uint64]
    # Collateral amoount dropped
    collateral: pt.abi.Field[pt.abi.Uint64]
    # Collateral asset type
    collateral_asa: pt.abi.Field[pt.abi.Unit64]
    # Liquidation time
    liquidate_at: pt.abi.Field[pt.abi.Uint8]

class Collateral(pt.abi.NamedTuple):
    # Price in Algo: Should be an oracle instead
    value: pt.abi.Field[pt.abi.Unit64]

class TunnelState:
    # ASA: ID of the ASA being supplied and borrowed
    pool_asa = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # Supply apr: 
    supply_apr = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # Borrow apr: 
    borrow_apr = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # Total supply: 
    total_supply = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # Min supply: 1 Algo
    min_supply = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(1_000_000))

    # Loan to value: Default 80 percent
    ltv = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(8_000))

    # Total borrow:
    total_borrow = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # Borrows
    borrows = beaker.GlobalStateValue(stack_type=pt.TealType.uint64, default=pt.Int(0))

    # Address pairs
    # pairs = beaker.GlobalStateValue(stack_type=pt.Ma, default=pt.Array())


app = beaker.Application("Tunnel", state=TunnelState)


# create method that initializes global state
@app.create(bare=True)
def create() -> pt.Expr:
    return app.initialize_global_state()


# opt_into_asset method that opts the contract account into an ASA
@app.external(authorize=beaker.Authorize.only(pt.Global.creator_address()))
def opt_into_pool_asset(asset_id: pt.abi.Uint64) -> pt.Expr:
    # On-chain logic that uses multiple expressions, always goes in the returned Seq
    return pt.Seq(
        # Check the asa in state hasn't already been set
        pt.Assert(app.state.pool_asa == pt.Int(0)),
        app.state.pool_asa.set(asset_id),
        # Send the transaction to opt in
        # Opt == transfer of 0 amount from/to the same account
        # Send a 0 asset transfer, of asset, from contract to contract
        pt.InnerTxnBuilder.Execute(
            {
                pt.TxnField.type_enum: pt.TxnType.AssetTransfer,
                pt.TxnField.asset_receiver: pt.Global.current_application_address(),
                pt.TxnField.xfer_asset: asset_id,
                pt.TxnField.asset_amount: pt.Int(0),
                # Nomrally fees are 0.0001 ALGO
                # An inner transaction is 0.0001 ALGO
                # Setting inner transaction fee to 0, means outer fee must be 0.0002 ALGO
                pt.TxnField.fee: pt.Int(0),
            }
        ),
    )


@app.external
def supply(payment: pt.abi.PaymentTransaction) -> pt.Expr:
    total_supply = pt.ScratchVar(pt.TealType.uint64)
    return pt.Seq(
        # Assert the asset id is the pool asset
        pt.Assert(payment.get().asa() == app.state.asa.get()),
        # Assert the receiver is the contract address
        pt.Assert(payment.get().receiver() == pt.Global.current_application_address()),
        total_supply.store(app.state.total_supply.get()),
        # Assert the supply amount is sufficient
        pt.Assert(total_supply.load() >= app.min_supply.get()),

        app.state.total_supply.set(total_supply.load() + payment.get().amount()),
    )


@app.external
def borrow() -> pt.Expr:
    return pt.Seq()


@app.external
def repay() -> pt.Expr:
    return pt.Seq()


@app.external
def un_bridge() -> pt.Expr:
    return pt.Seq()


@app.external
def un_bridge() -> pt.Expr:
    return pt.Seq()
