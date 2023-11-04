export const bscTestnet = {
    id: 97,
    hex: "",
    wormholeId: "",
    name: "BSC",
    symbol: "BNB",
    image: "//images/bnb.png",
    rpc: ""
}

export const algorandTestnet = {
    id: 416002,
    hex: "",
    wormholeId: 8,
    name: "Algorand",
    symbol: "ALGO",
    image: "//images/algo.png",
    rpc: ""
}

export const wormholeSharesInBsc = {
    chainId: 97,
    address: "",
    name: "Wormhole Shares",
    symbol: "WShares",
    image: "//images/wormhole.png"
}

export const wormholeSharesInAlgo = {
    chainId: 416002,
    address: "", // id
    name: "Wormhole Shares",
    symbol: "WShares",
    image: "//images/wormhole.png"
}

export const tunnelBsc = {
    address: ""
}

export const tunnelAlgo = {
    address: ""
}

export function fineAddress(addr) {
    return addr.substring(0, 5) + '...' + addr.substring(addr.length - 5, addr.length)
}