# TunnelFi

Unlock the full potential of your real-world assets in a secure, transparent, and inclusive financial ecosystem.

[![Netlify Status](https://api.netlify.com/api/v1/badges/0358e0ac-16cb-44bd-a874-a6ba24dc785c/deploy-status)](https://app.netlify.com/sites/tunnelfi/deploys)

# Resources
[Website](https://tunnelfinance.site/) | [Dorahacks](https://dorahacks.io/buidl/7771) | [Pitch Deck](https://www.figma.com/proto/bRghIR6ZaP6sQqVOpt0HhU/TunnelFi?page-id=0%3A1&type=design&node-id=0-13&viewport=586%2C564%2C0.07&t=jiRrK6vt9sQelCRo-1&scaling=contain&mode=design) | [Video](https://youtu.be/b3bPKPWOWhM) | [X](https://twitter.com/tunnelfi) | [Email](devarogundade@gmail.com)

# Setting up relayer

```
git clone https://github.com/devarogundade/tunnel
```

```
cd relayer
```

```
npm install
```

```
touch .env
```

Add inside .env file
```
ALGO_PRIVATE_KEY="CONTACT US FOR THIS KEY"
EVM_PRIVATE_KEY="CONTACT US FOR THIS KEY"
```

Setup [Spy node and Redis](https://docs.wormhole.com/wormhole/explore-wormhole/spy) in docker then

```
npm run dev
```

# Code Highlights
```solidity
_wormhole.publishMessage{value: messageFee()}(
  _nonce,
  payload,
  CONSISTENCY_LEVEL
);
```

```py
InnerTxnBuilder.Begin(),
InnerTxnBuilder.SetFields(
  {
    TxnField.type_enum: TxnType.Payment,
    TxnField.receiver: wormhole_addr.get(),
    TxnField.amount: mfee.get(),
    TxnField.fee: Int(0),
  }
),
InnerTxnBuilder.Next(),
InnerTxnBuilder.SetFields(
  {
    TxnField.type_enum: TxnType.ApplicationCall,
    TxnField.application_id: wormhole.get(),
    TxnField.application_args: [
       Bytes("publishMessage"),
       payload.load(),
       Itob(Int(0)),
    ],
    TxnField.accounts: [storage_addr.get()],
    TxnField.note: Bytes("publishMessage"),
    TxnField.fee: Int(0),
  }
),
InnerTxnBuilder.Submit(),
```

```ts
const app = new StandardRelayerApp<StandardRelayerContext>(
  Environment.TESTNET,
  {
    name: "TunnelRelayer",
    missedVaaOptions: {
      startingSequenceConfig: {
        "8": BigInt(1)
      }
    }
  },
);
```

# Contract Ids

BSC
```
0x34795bA4E73954A4f6e6468eC45e4c2b287BB74c
```

ALGORAND
```
478376514
```

# Flow Diagram
<img width="2544" alt="arch" src="https://github.com/devarogundade/tunnel/assets/81397790/ef6bfae5-502f-41d9-bfde-3c4de69657a4">

# Preview
![Screenshot 2023-11-12 134727](https://github.com/devarogundade/tunnel/assets/81397790/e8abdc2e-100b-409f-8f88-ff0fb439adb6)


