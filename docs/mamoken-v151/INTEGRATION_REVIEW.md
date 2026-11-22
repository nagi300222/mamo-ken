# v15.1 integration candidate — reciprocal review in progress

Base: user-approved PR195 b92717c. Codex lane PR197 33f73a2. Claude art lane PR198 99c6c7d.

- Codex reviewed all nine before/after contact sheets, editable fix specifications, builder changes and surface measurement code. Original model/movies are preserved. The initial six flagged moves (seven findings) were returned to Claude; the second delivery resolves all 54 contact flags, including head/tail misclassification and low-tail floor penetration.
- Thirty motions receive local pose/weight edits; the other 24 keep the v15 gesture angles (common thigh-fix rig following remains). Art-owned data and sources retain their own Git history and Draft.
- `normalMove` reads reach and activeReach from Claude's measured contacts, and timing/damage/levels/cancels from the independent performance table. The latter has no hidden reach extension. `normalClipTime` reads contact/contactEnd from the same shared data.
- The game interpolates striking reach during active frames and prohibits normal hits behind the locked facing. Both startup contact pose and hitstop are verified in the real WebGL browser. The extended browser test compares the actual skinned striking surface to the contact metadata within 1.5cm, for all 54 moves.
- Relative performance: fast grounded jabs4F, Moguzo5F, Godan7F. Godan retains high damage and one weak only; Bullet's tail is actual long-range, with punishable recovery. Raw jab advantage stays below next startup, including perfect corner inputs. Strong hits recover first, while guarded/whiffed strong attacks remain risky.

Pending at candidate publication: Claude's review of the integrated contact-clock code, final before/after animation movies, final six-pattern CPU audit and complete integrated browser/ultimate regression. No main or original Draft has been merged. This candidate does not certify physical iPhone FPS/heat or final tournament balance.
