# Key Vault

This is the offline key vault (a.k.a. "wallet") for the Horse project.

## Running the Local Offline Vault

To run the vault/wallet in offline mode on your computer, follow the instructions below:

### Install Caddy HTTP server

Download and install executables from the official caddy website: [https://caddyserver.com/download](https://caddyserver.com/download)

On MacOS or Ubuntu you may try the installation command below in a terminal:

```bash
sudo apt install caddy || sudo yum install caddy || brew install caddy
```

### Start the Caddy HTTP server

```bash
cd ./eqh-client-vault
caddy
```

You are now ready to use the offline wallet/vault.
