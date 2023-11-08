const Tunnel = artifacts.require("Tunnel")
const WormholeShares = artifacts.require("WormholeShares")

const WORMHOLE_CORE = '0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D'

module.exports = async function (deployer, network, accounts) {
    await deployer.deploy(Tunnel, WORMHOLE_CORE)
    // await deployer.deploy(WormholeShares)
};