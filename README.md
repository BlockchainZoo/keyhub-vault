# Keyhub-Vault Monorepo

This is the monorepo for the Keyhub Vault component using [Lerna](https://lernajs.io/).

- [What are Monorepos](https://medium.com/@maoberlehner/monorepos-in-the-wild-33c6eb246cb9)
- [Reasons for Monorepo](https://hackernoon.com/one-vs-many-why-we-moved-from-multiple-git-repos-to-a-monorepo-and-how-we-set-it-up-f4abb0cfe469)

## List of Packages

- [**keyhub-vault-web**](packages/keyhub-vault-web) - The vault that lives on the Web (browser-based).

## Install IDE Plugins

- Visual Studio Code IDE: Install `ESLint` and `Prettier - Code formatter` extensions via the sidebar.

## Bootstrap Dependencies

```bash
npm install -g npm@latest # Recommended
npm install # This will also run lerna bootstrap
```

## Reinstall All Dependencies

```bash
npx lerna clean --yes
npx lerna bootstrap
```

## Running keyhub locally and using local blockchain

1. edit `epochBeginning` and `genesisAccountId` in to match the local blockchain running `/home/capt4ce/works/bcz/keyhub-vault/packages/keyhub-vault-web/src/conf/equinehub-dev/constants.js`

2. edit `url`, `id` and `height` of lastKnownBlocks mathching the local blockchain
   for example

```js
module.exports = {
  url: 'https://localhost:20822',
  isTestNet: false,
  adminPassword: '',
  lastKnownBlock: {
    id: '12561374543856956095',
    height: '0',
  },
}
```

3. change `https://nxt1.vault.keyhub.app` to your blockchain url in Caddyfile of keyhub

```
Content-Security-Policy "sandbox allow-same-origin allow-modals allow-scripts; default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; manifest-src 'self'; style-src 'self'; img-src 'self'; media-src 'self'; font-src 'self'; frame-src 'none'; worker-src blob: data:; child-src blob: data:; script-src blob: 'self' 'sha384-rPMBYwDhb6zrv3/mO71SlMxpVbRnWUX4Brw4sLnlTGd3OcEFZjcRHS0L2yTUHq4Q'; connect-src 'self' https://nxt1.vault.keyhub.app; require-sri-for script style"
```

4. compile the keyhub by running `lerna bootstrap` keyhub root directory

5. run keyhub's caddy

6. run the local blockchain

7. use caddy for the local blockchain so that it can be accessed with `https`
   cady example for the local blockchain

```
localhost:20822 {
	proxy / localhost:2082/ {
		transparent
	}
	tls self_signed
}
```
