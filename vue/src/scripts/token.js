import { readContract, prepareWriteContract, writeContract, waitForTransaction, fetchBalance, erc20ABI } from '@wagmi/core'
import WormholeSharesJson from '../contracts/WormholeShares.json'
import TunnelJson from '../contracts/Tunnel.json'

export async function trySyncWallets(algoWallet) {
    try {
        const config = await prepareWriteContract({
            address: TunnelJson.networks[97].address,
            abi: TunnelJson.abi,
            functionName: 'createWallet',
            args: [algoWallet]
        });

        const { hash } = await writeContract(config);

        return await waitForTransaction({ hash: hash });
    } catch (error) {
        console.error(error);
        return null;
    }
}

export async function tryGetAlgoWallet(evmWallet) {
    try {
        return await readContract({
            address: TunnelJson.networks[97].address,
            abi: TunnelJson.abi,
            functionName: 'getAlgoWallet',
            args: [evmWallet]
        });
    } catch (error) {
        console.error(error);
        return null;
    }
}



export async function tryAllow() {
    try {
        const config = await prepareWriteContract({
            address: WormholeSharesJson.networks[97].address,
            abi: WormholeSharesJson.abi,
            functionName: 'allow',
        })

        const { hash } = await writeContract(config)

        return await waitForTransaction({ hash: hash })
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryFaucet() {
    try {
        const config = await prepareWriteContract({
            address: WormholeSharesJson.networks[97].address,
            abi: WormholeSharesJson.abi,
            functionName: 'faucet',
            args: ['10000000000000000000'] // 10 Units
        })

        const { hash } = await writeContract(config)

        return await waitForTransaction({ hash: hash })
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryErcBalance(owner) {
    try {
        const { value } = await fetchBalance({
            token: WormholeSharesJson.networks[97].address,
            address: owner
        })
        return value
    } catch (error) {
        return 0
    }
}

export async function tryErcAllocation(owner) {
    try {
        return await readContract({
            address: WormholeSharesJson.networks[97].address,
            abi: erc20ABI,
            functionName: 'allowance',
            args: [owner, TunnelJson.networks[97].address],

        })
    } catch (error) {
        console.error(error);
        return 0
    }
}

export async function tryErcApprove(amount) {
    try {
        const config = await prepareWriteContract({
            address: WormholeSharesJson.networks[97].address,
            abi: erc20ABI,
            functionName: 'approve',
            args: [TunnelJson.networks[97].address, amount],

        })

        const { hash } = await writeContract(config)

        return await waitForTransaction({ hash: hash })
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function tryAddToMetaMask(symbol, imageName) {
    try {
        // eslint-disable-next-line no-undef
        await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: WormholeSharesJson.networks[97].address,
                    symbol: symbol,
                    decimals: '18',
                    image: 'https://tunnelfinance.site/images/' + imageName + '.png',
                },
            },
        });
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}