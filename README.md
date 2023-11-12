# TunnelFi

Unlock the full potential of your real-world assets in a secure, transparent, and inclusive financial ecosystem.

[![Netlify Status](https://api.netlify.com/api/v1/badges/0358e0ac-16cb-44bd-a874-a6ba24dc785c/deploy-status)](https://app.netlify.com/sites/tunnelfi/deploys)

# Resources
[Website](https://tunnelfinance.site/) | [Dorahacks](https://dorahacks.io/buidl/7771) | [Pitch Deck](https://www.figma.com/proto/bRghIR6ZaP6sQqVOpt0HhU/TunnelFi?page-id=0%3A1&type=design&node-id=0-13&viewport=586%2C564%2C0.07&t=jiRrK6vt9sQelCRo-1&scaling=contain&mode=design)

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
    TxnField.accounts: [storage_addr.get()],  # storage account
    TxnField.note: Bytes("publishMessage"),
    TxnField.fee: Int(0),
  }
),
InnerTxnBuilder.Submit(),
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
<img width="2544" alt="arch" src="https://github.com/devarogundade/tunnel/assets/81397790/39368f30-2ff5-46e2-bd0a-68227ccc9341">

# Preview
![Preview](https://github.com/devarogundade/tunnel/assets/81397790/ad274cfb-0d38-4c21-bfd7-3333dc6edc14)


