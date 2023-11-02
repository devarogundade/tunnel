const Tunnel = artifacts.require("Tunnel")

const wormhole = '0x68605AD7b15c732a30b1BbC62BE8F2A509D74b4D'

module.exports = async function (deployer, network, accounts) {
    // return
    await deployer.deploy(Tunnel, wormhole, 4)
};