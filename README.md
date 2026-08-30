# Cove

Product Y for [Product OS (LOOP)](https://github.com/saurabh4269/product-os) — a real Next.js storefront (fork of [Epic-Design-Labs/nextjs-ecommerce-starter](https://github.com/Epic-Design-Labs/nextjs-ecommerce-starter)), wired so the OS can observe checkout, voice, and feature flags.

Not a dummy one-page shop. Catalog, cart, checkout, accounts UI from the starter; LOOP owns signals and live flags.

## Demo surface

| Path | What Product OS sees |
|------|----------------------|
| `/checkout` | Pay SDK version from live flags. If `pay_sdk_4_3=on`, place-order hangs and posts a Type A signal. |
| `/feedback` | Customer voice → OS rooms. |
| `/api/loop/flags` | Merged `config/flags.json` + OS `/api/tenant/.../live-flags`. |
| `/api/loop/ingest` | Proxies signals/voice to the OS. |

`config/flags.json` is the file the OS opens a GitHub PR against when a HIGH change is approved (OS never merges or deploys Cove).

## Env

```
LOOP_OS_URL=https://loop-5uy6fkd7bq-uc.a.run.app
LOOP_TENANT_ID=acme
LOOP_TENANT_TOKEN=<same as Connect>
```

## Local

```bash
npm ci
npm run dev
```

## Deploy (Cloud Run)

```bash
export LOOP_TENANT_TOKEN=…
./scripts/deploy.sh
```

Then on Product OS → Connect: repo `saurabh4269/cove`, deploy URL from the script, flags path `config/flags.json`.

## License

MIT (upstream starter). Product OS wire is original to this fork.
