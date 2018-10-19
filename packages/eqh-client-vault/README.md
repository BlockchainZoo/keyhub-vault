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

### Build the project

```bash
npx lerna bootstrap --scope=keyhub-vault-web
```

### Start the Caddy HTTP server

```bash
cd ./keyhub-vault-web
caddy
```

**Note:** If "can not download /js/openpgp.worker.js" error appears, perform shift+refresh to ignore the cache

**Note:** after every change, run

```bash
npx lerna bootstrap --scope=keyhub-vault-web
```

You are now ready to use the offline wallet/vault.

## Deployment

1. Go to project directory
2. Run this command to run "prepare" script and build the project

```bash
npx lerna bootstrap --scope=keyhub-vault-web
```

/dist folder will appear inside the keyhub-vault-web directory

3. configure the AWS configure twith the key and secret key
4. Deploy /dist to S3 by deploying the files to S3, this action will produce /cloudfront/stack.ap-southeast-1.yaml which will be used by cloudfront to point to this specific S3

for `sandbox` environment

```bash
sls deploy
```

for `prod` environment

```bash
sls deploy --stage=prod
```

5. Check whether the files has been uploaded through aws S3 terminal
6. Check whether index.html can be accessed (no access denied)
7. Deploy cloudfront by going to /cloudfront then run

for `sandbox` environment

```bash
sls deploy
```

for `prod` environment

```bash
sls deploy --stage=prod
```

8. go to vault.keyhub.app to check the deployment
