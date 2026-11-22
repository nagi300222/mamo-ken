# v15.1 integration candidate — reciprocal review and vertical-contact follow-up

Base: user-approved PR195 b92717c. Codex lane PR197 33f73a2. Claude art lane PR198 b8256ea (motion source unchanged from 99c6c7d; height/bounds and evidence added).

- Codex reviewed all nine before/after contact sheets, editable fix specifications, builder changes and surface measurement code. Original model/movies are preserved. The initial six flagged moves (seven findings) were returned to Claude; the second delivery resolves all 54 contact flags, including head/tail misclassification and low-tail floor penetration.
- Thirty motions receive local pose/weight edits; the other 24 keep the v15 gesture angles (common thigh-fix rig following remains). Art-owned data and sources retain their own Git history and Draft.
- `normalMove` reads reach and activeReach from Claude's measured contacts, and timing/damage/levels/cancels from the independent performance table. The latter has no hidden reach extension. `normalClipTime` reads contact/contactEnd from the same shared data.
- The game interpolates striking reach during active frames and prohibits normal hits behind the locked facing. Both startup contact pose and hitstop are verified in the real WebGL browser. The extended browser test compares the actual skinned striking surface to the contact metadata within 1.5cm, for all 54 moves.
- Relative performance: fast grounded jabs4F, Moguzo5F, Godan7F. Godan retains high damage and one weak only; Bullet's tail is actual long-range, with punishable recovery. Raw jab advantage stays below next startup, including perfect corner inputs. Strong hits recover first, while guarded/whiffed strong attacks remain risky.

Claude reviewed the contact connection and the 06c1478 vertical follow-up and recorded no blocking request on PR197 (comments 7081616697 / 7081781041). Its data check covers all 648 grounded-move/victim/pose combinations with no unintended grounded misses. The 134 Node tests, all 54 forward/height contact WebGL tests, 81 cinematic pairings and general browser regression pass on 06c1478. All nine comparison videos and the final review README are archived from art HEAD e774053. Source pose data is unchanged from 99c6c7d; the later revision adds height/hurt bounds and evidence.

Remaining limits: physical iPhone FPS/heat and final competitive balance are unverified. A 6cm vertical band around the measured foremost striking point models limb thickness; it is not full mesh collision. Ground normals do not reach feet above about 0.48m, so dedicated anti-air specials remain necessary. Short kicks and long tail/hand reaches are intentional measured tradeoffs; the small head/fist silhouette ambiguity and Dark Moguzo's 4mm opposite-hand lead remain future polish candidates.

No main or original Draft has been merged.
