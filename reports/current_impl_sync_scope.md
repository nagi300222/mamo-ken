# T00 current implementation sync scope

- Source: `prototype/mamoken_prototype_v01.html`
- Server boundary: `server/src/worker.mjs`
- Lockstep queues: `NET.localQ`, `NET.peerQ`, `NET.matchSeq`, `NET.simF`, `NET.capTick`, `NET.delayF`
- Online minigame input events found: `atk`, `cmd`, `dodge`, `grab`, `mgHit`, `mgPick`, `mgTap`, `mikiri`, `roar`, `ult`
- localStorage references: none
- Math.random/rng call count: 50
- Potential Math.random core-risk calls after heuristic filter: 1
- Source/dist string checks: balBufSame=false, cmdBufferSame=false, cmdBufFSame=false, roarSame=false, serverRelayMentionsCmd=true

## Notes

- Client lockstep advances B.flow only when both delayed inputs for the same sim frame are present.
- Server relays cmd/pick-like payloads without interpreting battle semantics.
- Gyuiin minigames use mgPick/mgTap/mgHit through the same lockstep cmd queue online.
