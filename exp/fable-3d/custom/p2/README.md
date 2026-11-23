# P2 physical donor part runtime

P2 was explicitly approved after the owner's P1 review. This directory implements a new opt-in physical-mesh path; it does not rename the v16 dimension grafts or replace existing saved choices. `appearance.parts` keeps its original meaning. `appearance.meshParts` selects an authored donor per slot. Same-slot foreign dimension graft + physical mesh is rejected; an unavailable saved module produces an error and remains saved unchanged.

## Asset contract

`assets/manifest.json` is `{schemaVersion:1,version:"p2-exchange-1",coordinateSystem:"gltf-y-up-metres-host-bind-local",modules:[...]}`. The exact parser/catalog contract is `part-contract.js`. Initial target/donor rigs: Moguzo, Godan, Bullet. Self-donor retains the existing part. Foreign head/ears/hands/feet are enabled only after their actual host-compatible asset exists. Moguzo↔Godan short tails may be authored; Bullet's six-bone tail cannot cross to/from a three-bone tail in this version. Accessories remain unavailable until explicitly authored. LOD is explicitly 0, one level, with no GPU-performance claim.

Each module requires `id,targetBaseId,donorId,slot,file,meshNames,bytes,sha256,lod,morphTargets,jointNames,palette,seams,socket,source`. Files are under `modules/` relative to the manifest directory. `meshNames` identifies GLTF nodes/containers whose actual SkinnedMesh children belong to that slot, including both head skin and eyes when relevant. Skin bones and inverse binds are those of the **target host**, not the foreign donor rest rig. Position/normal/UV/skin and `_AVATAR_REGION`/`_AVATAR_PART` semantics remain present. Four relative morph channels preserve names and order: `paw_open.L`, `paw_open.R`, `blink`, `brow_angry`. Original textures/UVs remain usable, and `palette` records the donor reference colors for part-by-part color selection rather than treating the donor's old pigment as the target's reference.

Example entry (hashes/size are illustrative, not shipped assets):

```json
{"id":"moguzo-head-godan","targetBaseId":"moguzo","donorId":"godan","slot":"head","file":"modules/moguzo/head_godan.glb","meshNames":["p2_head_godan_for_moguzo"],"bytes":123456,"sha256":"64 lowercase hex digits","lod":0,"morphTargets":["paw_open.L","paw_open.R","blink","brow_angry"],"jointNames":["all actual host joints in exported skin order"],"palette":{"fur":"#664224","belly":"#b28547","muzzle":"#bd9457","paw":"#33241a","foot":"#30241c","ear":"#40291a","tail":"#664224","accent":"#0f0f12"},"seams":{"kind":"matched-host-boundary","tolerance":0.00002},"socket":{"bone":"head","position":[0,0,0],"space":"host-bind-local"},"source":{"path":"editable/source/path","sha256":"64 lowercase hex digits"}}
```

A socket position is a bone-local offset in the host bind rig. `measureMeshPartSockets(avatar)` returns its actual animated host-bone position in avatar-local metres. It does not substitute a guessed gameplay reach.

## Runtime safeguards

`loadMeshPartManifest()` retries after failure; `meshPartOptions(manifest,baseId,slot)` reports availability/reasons without inventing missing assets. `loadMeshPartModules()` checks byte length and SHA-256 before parsing. `assembleMeshParts()` validates real meshes, finite normalized skin attributes, all four morphs, host bone names, inverse-bind matrices and coordinate system. It remaps indices and binds every replacement to the existing host Skeleton. No donor bones or hidden second actor are attached. If validation fails, all original host nodes remain in place.

UV duplicate positions are welded only for boundary-edge counting, without changing authored topology. Every exchange boundary must coincide with another retained/swapped host part, with position ≤ declared tolerance (maximum 0.1mm), morph delta within the same tolerance, weights ≤0.0002 and normal-vector difference ≤0.035. Original host geometry also has some intrinsic open surface edges, notably foot sole cutoffs. Only edges matching that exact same-slot native open boundary are retained; their position, normals, weights and four morph deltas are independently checked and their count is reported separately. Arbitrary unmatched donor boundaries fail.

AvatarFactory retains the original resources and 37 clips, adds physical meshes to `avatar.meshes`, expands all original/normal morph streams to every module, exposes `avatar.partAssembly` and per-mesh `userData.meshPart={id,targetBaseId,slot,donorId,sha256,lod}`, and includes exchanged slots in the existing changed-surface measurement guard. Existing `measureContacts`, `measureSpecialContact` and projectile socket measurement sample the actual replacement meshes. No balance values are changed here.

## Verification and status

Run `node --test exp/fable-3d/custom/p2/part-runtime.test.mjs`. Its CPU runner parses the shipped GLBs on all three representative hosts and performs 15 **same-host control swaps**, preserving every triangle and all 18 measured normal surfaces. It verifies shared Skeletons and animated morph/skin seams, and rejects bad download hashes, skin corruption, a 2mm seam opening and changed inverse bind matrices without destroying the host. Image decoding is stubbed: this is not WebGL, shader, native-device or FPS evidence.

The runner also loads every authored module in the production manifest through the real Factory and measures its normal surfaces. An empty manifest honestly means no foreign donor module has been delivered yet; control swaps are never published as donor artwork. The current authored-asset count is recorded in `MAMOKEN_EVIDENCE/parts-cpu.json`. Actual Claude assets, browser appearance/motion review and physical iPhone performance remain separate gates. Original nine GLBs and all v16 asset binaries are unchanged.
