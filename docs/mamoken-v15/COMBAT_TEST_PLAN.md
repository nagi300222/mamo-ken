# v15 Combat implementation gates
- Weak→weak, weak→strong, normal→direction+special only after a real hit/block, with hitstop buffer and per-character limits
- Nine air speeds and accelerations, dash frames/recovery, light/heavy startup/recovery
- Normal damage values kept as baseline; any multi-hit linked damage is scaled
- Preserve unique counters, feints, chase, dark chains, 9 ultimates and orientation-locked game
- No replacement of Claude's original v14 animation, only code-based normal clip restarting. Full new normal attack motion source is separate Claude task
- New numbers provisional pending player assessment; main and upstream Draft remain unmerged
