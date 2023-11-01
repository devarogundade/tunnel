import { readContract, prepareWriteContract, writeContract, waitForTransaction, fetchBalance, erc20ABI } from '@wagmi/core'

export async function ercBalance(chainId = chains[0].id, token, owner) {
    try {
        const { value } = await fetchBalance({ chainId: chainId, token: token, address: owner })
        return value
    } catch (error) {
        return null
    }
}

export async function getErcAllocation(chainId = chains[0].id, token, owner, spender) {
    try {
        return await readContract({
            address: token,
            abi: erc20ABI,
            functionName: 'allowance',
            args: [owner, spender],
            chainId: chainId
        })
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function ercApprove(chainId = chains[0].id, token, amount, spender = swapContract) {
    try {
        const config = await prepareWriteContract({
            address: token,
            abi: erc20ABI,
            functionName: 'approve',
            args: [spender, amount],
            chainId: chainId
        })

        const { hash } = await writeContract(config)

        return await waitForTransaction({ hash: hash })
    } catch (error) {
        console.error(error);
        return null
    }
}

export async function addToMetaMask(address, symbol) {
    try {
        // eslint-disable-next-line no-undef
        await ethereum.request({
            method: 'wallet_watchAsset',
            params: {
                type: 'ERC20',
                options: {
                    address: address,
                    symbol: symbol,
                    decimals: '18',
                    image: 'https://luckycats2.netlify.app/images/' + symbol + '.png',
                },
            },
        });
        return true
    } catch (error) {
        console.error(error)
        return false
    }
}