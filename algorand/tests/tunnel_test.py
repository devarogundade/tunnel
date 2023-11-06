import pytest
from algokit_utils import (
    ApplicationClient,
    ApplicationSpecification,
    get_localnet_default_account,
)
from algosdk.v2client.algod import AlgodClient

from smart_contracts.tunnel import contract as tunnel_contract


@pytest.fixture(scope="session")
def tunnel_app_spec(algod_client: AlgodClient) -> ApplicationSpecification:
    return tunnel_contract.app.build(algod_client)


@pytest.fixture(scope="session")
def tunnel_client(
    algod_client: AlgodClient, tunnel_app_spec: ApplicationSpecification
) -> ApplicationClient:
    client = ApplicationClient(
        algod_client,
        app_spec=tunnel_app_spec,
        signer=get_localnet_default_account(algod_client),
    )
    client.create()
    return client
