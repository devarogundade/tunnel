import Web3 from 'web3';
import Tunnel from '../../solidity/build/contracts/Tunnel.json';

// Signing Key and Address
const handlerEvmKey = process.env.EVM_PRIVATE_KEY!!;
const handlerEvmAddress = process.env.EVM_PUBLIC_KEY!!;

const web3 = new Web3('https://bsc-testnet.public.blastapi.io');

export async function signTransaction(nonce: number, payload: Buffer) {
    const tunnel = new web3.eth.Contract(Tunnel.abi, "0x83ee2EF8f1c8b4669B94F018F6467A9cC736719B");

    const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);
    web3.eth.accounts.wallet.add(signer);

    try {
        const gas = await tunnel.methods.receiveMessage(
            nonce, payload
        ).estimateGas({ from: handlerEvmAddress });
        console.log('Gas: ', gas);

        const gasPrice = await web3.eth.getGasPrice();
        console.log('Gas Price: ', gasPrice);

        const { transactionHash } = await tunnel.methods.receiveMessage(
            nonce, payload
        ).send({
            from: handlerEvmAddress,
            gasPrice: gasPrice.toString(),
            gas: gas.toString()
        });

        return transactionHash;
    } catch (error) {
        console.error('Transaction: ', error);
        return null;
    }
}

export function decodeOnEvm(payload: Buffer): { assetId: number, amount: string, receiver: string; } {
    const data = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'bytes32'], payload.toString());
    return { assetId: Number(data[0]), amount: String(data[1]), receiver: String(data[2]) };
}