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
