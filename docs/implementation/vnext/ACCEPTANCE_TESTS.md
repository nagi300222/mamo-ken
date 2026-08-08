# ACCEPTANCE TESTS

# Combat

- Normal Chain Limit 9char値
- H/M/L arbitrary order
- same Normal repeat
- BLOCK/WHIFF true chain end
- Modern history BLOCK persist
- Normal LOW common downなし
- OP 100/90/80/70
- Combo Scaling floor25
- common Normal knockback0
- HP/Guard 9char
- hidden GD taken multiplierなし

# Dodge

- CROUCH vs H/M/L
- SWAY vs H/M/L
- LUNGE vs H/M/L
- wrong evade Counter1.2
- correct completion18
- miss22
- Guard→Dodge 10F buffer
- Reach3 aloneでcorrect evade無効化しない

# Modern

全pattern HIT/BLOCK。
45F timeout。
reset event全部。
final normal replacement chain count。
resource unavailable fallback。
Takimaru Grab pending start14F。
pending cancel。

# Classic

HIT only。
formal input only。
Modern pattern不可。
16/16/14/12。
Command Grab。
same direct loop ban。
multiple cancel allowed。
scaling continuity。

# Focus

- gameplay gainしない
- auto slowしない
- HUDに出ない
- CPU logicで参照しない
- compatibility fieldが残ってもlive behaviorなし

# Resource

S gain table。
multi-hit once。
Roar cost/gain。
Ult carry 3→2。
unique gauges Round reset。

# Ability

Moguzo:
Guts30 / dmg1.10 / grit lethal incl Ult / one round。

Pisuke:
Normal HIT only / 12F / sway+lunge / recovery cancel / chain reset。

Godan:
stock3 / costs / armor windows / pierce / counter。

Hakuma:
gain/loss/no timeout / 3 spend buffs。

Chilka:
windows / first choice / feint reaction / delay+8 / delayed unblockable。

Takimaru:
pressure HIT/BLOCK / prequeue6 / active12 / startup12 / not guaranteed。

Yomikage:
ordinary Dodge only / Just5-9 / actionable14 vs18 / queue / windows。

Bullet:
A-A / A-B-A / A-normal-A / failed B / costs / Guard+15 / unblockable headbutt。

Dark:
compatible list / same move no chain / +30 / uses2 vs3 / 16 vs20 /
no midcombo activate / Body360 / startup buffs / dmg1.08 /
Classic priority / no scaling reset。

# Art / Size

- standing ratio 9char
- master face target
- every representative pose
- Mikiri
- Roar F1-F4
- Victory
- GetUp
- UltCharge
- Grabbed
- Down
- KO
- all 63 Commands F1-F4
- Godan replacement live
- Bullet tail excluded
- Dark common correction shared
- grounded Ground Line
- prone body floor
- no vertical pop on transitions
- P1/P2 same geometry
- combat hash unchanged by presentation

# Online / Build

- deterministic hash
- mock relay
- Gyuiin variants
- creator/joiner
- build:art
- build:mobile
- committed dist reproducible
- G00/G01/G02 scoped-diff contract
