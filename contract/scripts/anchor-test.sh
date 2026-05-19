#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="http://127.0.0.1:8898"
WS_URL="ws://127.0.0.1:8901"
LEDGER_DIR="/tmp/solstake-anchor-test-ledger"
VALIDATOR_PID=""

cleanup() {
  if [[ -n "${VALIDATOR_PID}" ]]; then
    kill "${VALIDATOR_PID}" >/dev/null 2>&1 || true
    wait "${VALIDATOR_PID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

cd "${ROOT_DIR}"
export ANCHOR_WALLET="${ANCHOR_WALLET:-$HOME/.config/solana/id.json}"

solana-test-validator \
  --ledger "${LEDGER_DIR}" \
  --reset \
  --quiet \
  --rpc-port 8898 \
  --faucet-port 9901 \
  --bpf-program 33vQPdG6AQCQ5QGHQjqJra49n4a64PjZLEYgEXdX6T39 target/deploy/contract.so \
  >/tmp/solstake-anchor-test-validator.log 2>&1 &
VALIDATOR_PID="$!"

for _ in {1..30}; do
  if solana cluster-version --url "${RPC_URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

solana cluster-version --url "${RPC_URL}" >/dev/null
ANCHOR_TEST_RPC_URL="${RPC_URL}" ANCHOR_TEST_WS_URL="${WS_URL}" cargo test -p tests -- --ignored --test-threads=1
