import { Web3, Contract } from 'web3';
import Tunnel from '../../solidity/build/contracts/Tunnel.json';

// Signing Key and Address
const handlerEvmKey = process.env.EVM_PRIVATE_KEY!!;

const web3 = new Web3('https://bsc-testnet.public.blastapi.io');

export const tunnelAddr = Tunnel.networks[97].address;

export async function signTransaction(nonce: number, payload: Buffer) {
    const tunnel = new Contract(Tunnel.abi, tunnelAddr, web3);

    const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);
    web3.eth.accounts.wallet.add(signer);

    try {
        const gas = await tunnel.methods.receiveMessage(
            nonce, payload
        ).estimateGas({ from: signer.address });
        console.log('Gas: ', gas);

        const gasPrice = await web3.eth.getGasPrice();
        console.log('Gas Price: ', gasPrice);

        const { transactionHash } = await tunnel.methods.receiveMessage(
            nonce, payload
        ).send({
            from: signer.address,
            gasPrice: gasPrice.toString(),
            gas: gas.toString()
        });

        return transactionHash;
    } catch (error) {
        console.error('Transaction: ', error);
        return null;
    }
}

export function decodeOnEvm(payload: string): { assetId: number, amount: string, receiver: string; } {
    const data = web3.eth.abi.decodeParameters(['uint256', 'uint256', 'string'], payload);
    return { assetId: Number(data[0]), amount: String(data[1]), receiver: String(data[2]) };
}