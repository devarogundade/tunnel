import Web3 from 'web3';

const Tunnel = require('../Tunnel.json');

// Signing Key and Address
const handlerEvmKey = process.env.EVM_PRIVATE_KEY!!;

const web3 = new Web3('https://bsc-testnet.public.blastapi.io');

export const TUNNEL_ADDRESS = Tunnel.networks[97].address;

const s = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);
console.log(s.address);


export async function signTransaction(nonce: number, assetId: number, amount: number, receiver: string) {
    const tunnel = new web3.eth.Contract(Tunnel.abi, TUNNEL_ADDRESS);

    const signer = web3.eth.accounts.privateKeyToAccount(handlerEvmKey);
    web3.eth.accounts.wallet.add(signer);

    try {
        const gas = await tunnel.methods.receiveMessage(
            nonce, assetId, amount, receiver
        ).estimateGas({ from: signer.address });
        console.log('Gas: ', gas);

        const gasPrice = await web3.eth.getGasPrice();
        console.log('Gas Price: ', gasPrice);

        const { transactionHash } = await tunnel.methods.receiveMessage(
            nonce, assetId, amount, receiver
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