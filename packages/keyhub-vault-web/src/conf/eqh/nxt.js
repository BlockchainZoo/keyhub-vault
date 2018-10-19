if (process.env.STAGE === 'sandbox') {
  module.exports = {
    "url": "https://nxt1.vault.keyhub.app",
    "isTestNet": false,
    "adminPassword": "",
    "lastKnownBlock": {
      "id": "15547113949993887183",
      "height": "712",
    },
  }
} else {
  module.exports = {
    "url": "http://localhost:6876",
    "isTestNet": false,
    "adminPassword": "",
    "lastKnownBlock": {
      "id": "000000000000",
      "height": "000",
    },
  }
}
