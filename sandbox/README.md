# Code runner (reference implementation)

`runner.py` executes one untrusted Python/JavaScript program per request. Django
(`apps/execution`) is the only intended caller.

## Layers of isolation

| Layer | Provided by | Verified how |
|---|---|---|
| CPU / wall-clock / file-size / open-files / process limits, output cap, wiped env, throwaway cwd, kill whole process group | `runner.py` | `test_runner.py` (adversarial, run against a non-root runner) |
| **No network** (`network_mode: none` / internal network) | docker-compose | **Not testable in the dev sandbox — verify on your host** (see below) |
| Non-root user, read-only root FS, `cap_drop: ALL`, `no-new-privileges` | docker-compose | verify on your host |
| Memory & pids ceiling (cgroups), so a bomb can't take the host | docker-compose `mem_limit`, `pids_limit` | verify on your host |
| Caller authentication | `X-Sandbox-Token` shared secret; port never published | `test_runner.py` |

`runner.py` alone is NOT a sandbox against a determined attacker: a Python
process can still try to open sockets or read world-readable files. The
container flags are what contain that. For higher assurance (many untrusted
users), put gVisor/Firecracker under the container or use a hosted engine such
as Judge0/Piston instead of this file.

## Verify on your host after `docker compose up`

```bash
# 1. no network:
docker compose exec sandbox python -c "import socket;socket.create_connection(('1.1.1.1',53),3)"   # must fail
# 2. read-only root, non-root:
docker compose exec sandbox sh -c "id -u; touch /x"                                               # 10001, then 'Read-only file system'
# 3. adversarial suite (from a container on the same network):
docker compose run --rm -e RUNNER_URL=http://sandbox:9000 -e SANDBOX_TOKEN=$SANDBOX_TOKEN backend python /sandbox/test_runner.py
```

## Known limits
* Only Python and JavaScript. Add a language by extending `LANGUAGES` and installing its runtime in the image.
* The server runs 4 programs at a time (`MAX_CONCURRENT`) and answers 429 when busy; Django rate-limits per user (30/min).
* Time/memory/process limits are per run and configurable via env (`RUN_WALL_SECONDS`, `RUN_MEMORY_MB`, ...).
