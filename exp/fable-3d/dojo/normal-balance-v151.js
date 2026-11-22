// v15.1 performance proposal. All 54 moves are explicit; no blanket character offsets.
// Reach and active trajectories are authored separately in NORMAL_CONTACTS.
// Performance never extends the visible striking surface.
export const NORMAL_BALANCE_VERSION="15.1";
export const NORMAL_BALANCE=Object.freeze({
 moguzo:Object.freeze({
  stand_weak:Object.freeze({"startup":5,"active":3,"recovery":12,"damage":38,"level":"mid","anim":"stand_light","hitstun":18,"blockstun":11,"knockback":0.045,"blockPushback":0.045,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy","s1"]}),
  stand_heavy:Object.freeze({"startup":12,"active":4,"recovery":22,"damage":80,"level":"mid","anim":"stand_heavy","hitstun":28,"blockstun":14,"knockback":0.1,"blockPushback":0.09,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":6,"active":3,"recovery":13,"damage":33,"level":"low","anim":"stand_light","hitstun":18,"blockstun":11,"knockback":0.045,"blockPushback":0.045,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy","s1"]}),
  crouch_heavy:Object.freeze({"startup":13,"active":4,"recovery":24,"damage":76,"level":"low","anim":"stand_heavy","hitstun":30,"blockstun":13,"knockback":0.11,"blockPushback":0.1,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":6,"active":5,"recovery":12,"damage":39,"level":"air","anim":"stand_light","hitstun":16,"blockstun":10,"knockback":0.07,"blockPushback":0.06,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":11,"active":6,"recovery":18,"damage":77,"level":"air","anim":"stand_heavy","hitstun":25,"blockstun":13,"knockback":0.11,"blockPushback":0.09,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 pisuke:Object.freeze({
  stand_weak:Object.freeze({"startup":4,"active":2,"recovery":12,"damage":31,"level":"mid","anim":"stand_light","hitstun":16,"blockstun":9,"knockback":0.035,"blockPushback":0.04,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":11,"active":3,"recovery":22,"damage":68,"level":"mid","anim":"stand_heavy","hitstun":27,"blockstun":12,"knockback":0.08,"blockPushback":0.085,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":5,"active":2,"recovery":13,"damage":27,"level":"low","anim":"stand_light","hitstun":16,"blockstun":9,"knockback":0.035,"blockPushback":0.04,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":11,"active":4,"recovery":24,"damage":65,"level":"low","anim":"stand_heavy","hitstun":30,"blockstun":12,"knockback":0.09,"blockPushback":0.095,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":4,"active":4,"recovery":11,"damage":33,"level":"air","anim":"stand_light","hitstun":15,"blockstun":9,"knockback":0.05,"blockPushback":0.05,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":9,"active":5,"recovery":18,"damage":66,"level":"air","anim":"stand_heavy","hitstun":24,"blockstun":12,"knockback":0.09,"blockPushback":0.08,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 godan:Object.freeze({
  stand_weak:Object.freeze({"startup":7,"active":3,"recovery":14,"damage":47,"level":"mid","anim":"stand_light","hitstun":23,"blockstun":12,"knockback":0.04,"blockPushback":0.06,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":16,"active":5,"recovery":26,"damage":96,"level":"mid","anim":"stand_heavy","hitstun":33,"blockstun":15,"knockback":0.14,"blockPushback":0.12,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":8,"active":3,"recovery":15,"damage":41,"level":"low","anim":"stand_light","hitstun":23,"blockstun":12,"knockback":0.04,"blockPushback":0.06,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":17,"active":5,"recovery":28,"damage":91,"level":"low","anim":"stand_heavy","hitstun":35,"blockstun":14,"knockback":0.15,"blockPushback":0.13,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":10,"active":5,"recovery":16,"damage":48,"level":"air","anim":"stand_light","hitstun":20,"blockstun":12,"knockback":0.1,"blockPushback":0.08,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":16,"active":6,"recovery":25,"damage":93,"level":"air","anim":"stand_heavy","hitstun":32,"blockstun":14,"knockback":0.15,"blockPushback":0.12,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 hakuma:Object.freeze({
  stand_weak:Object.freeze({"startup":7,"active":4,"recovery":13,"damage":39,"level":"mid","anim":"stand_light","hitstun":20,"blockstun":12,"knockback":0.05,"blockPushback":0.05,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":14,"active":5,"recovery":24,"damage":82,"level":"mid","anim":"stand_heavy","hitstun":32,"blockstun":15,"knockback":0.13,"blockPushback":0.1,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":8,"active":4,"recovery":14,"damage":34,"level":"low","anim":"stand_light","hitstun":20,"blockstun":12,"knockback":0.05,"blockPushback":0.05,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":15,"active":5,"recovery":26,"damage":78,"level":"low","anim":"stand_heavy","hitstun":34,"blockstun":14,"knockback":0.13,"blockPushback":0.11,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":8,"active":5,"recovery":13,"damage":40,"level":"air","anim":"stand_light","hitstun":18,"blockstun":11,"knockback":0.08,"blockPushback":0.06,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":13,"active":6,"recovery":20,"damage":79,"level":"air","anim":"stand_heavy","hitstun":27,"blockstun":14,"knockback":0.12,"blockPushback":0.1,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 chirka:Object.freeze({
  stand_weak:Object.freeze({"startup":4,"active":2,"recovery":11,"damage":32,"level":"mid","anim":"stand_light","hitstun":16,"blockstun":9,"knockback":0.035,"blockPushback":0.04,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":11,"active":3,"recovery":22,"damage":68,"level":"mid","anim":"stand_heavy","hitstun":27,"blockstun":12,"knockback":0.08,"blockPushback":0.08,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":5,"active":2,"recovery":12,"damage":28,"level":"low","anim":"stand_light","hitstun":18,"blockstun":9,"knockback":0.035,"blockPushback":0.04,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":12,"active":4,"recovery":24,"damage":65,"level":"low","anim":"stand_heavy","hitstun":30,"blockstun":12,"knockback":0.09,"blockPushback":0.09,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":5,"active":4,"recovery":11,"damage":34,"level":"air","anim":"stand_light","hitstun":16,"blockstun":9,"knockback":0.06,"blockPushback":0.05,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":10,"active":5,"recovery":18,"damage":68,"level":"air","anim":"stand_heavy","hitstun":24,"blockstun":12,"knockback":0.1,"blockPushback":0.08,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 takimaru:Object.freeze({
  stand_weak:Object.freeze({"startup":7,"active":3,"recovery":14,"damage":41,"level":"mid","anim":"stand_light","hitstun":21,"blockstun":11,"knockback":0.025,"blockPushback":0.035,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":14,"active":4,"recovery":26,"damage":85,"level":"mid","anim":"stand_heavy","hitstun":33,"blockstun":13,"knockback":0.055,"blockPushback":0.06,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":8,"active":3,"recovery":15,"damage":35,"level":"low","anim":"stand_light","hitstun":21,"blockstun":11,"knockback":0.025,"blockPushback":0.035,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":15,"active":4,"recovery":28,"damage":80,"level":"low","anim":"stand_heavy","hitstun":35,"blockstun":13,"knockback":0.06,"blockPushback":0.07,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":8,"active":5,"recovery":14,"damage":42,"level":"air","anim":"stand_light","hitstun":18,"blockstun":11,"knockback":0.07,"blockPushback":0.06,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":13,"active":6,"recovery":23,"damage":81,"level":"air","anim":"stand_heavy","hitstun":30,"blockstun":13,"knockback":0.1,"blockPushback":0.09,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 yomikage:Object.freeze({
  stand_weak:Object.freeze({"startup":5,"active":2,"recovery":12,"damage":35,"level":"mid","anim":"stand_light","hitstun":18,"blockstun":10,"knockback":0.04,"blockPushback":0.04,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":12,"active":3,"recovery":24,"damage":74,"level":"mid","anim":"stand_heavy","hitstun":30,"blockstun":13,"knockback":0.09,"blockPushback":0.09,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":6,"active":2,"recovery":13,"damage":30,"level":"low","anim":"stand_light","hitstun":19,"blockstun":10,"knockback":0.04,"blockPushback":0.04,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":13,"active":4,"recovery":26,"damage":71,"level":"low","anim":"stand_heavy","hitstun":33,"blockstun":13,"knockback":0.1,"blockPushback":0.1,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":6,"active":4,"recovery":12,"damage":36,"level":"air","anim":"stand_light","hitstun":17,"blockstun":10,"knockback":0.07,"blockPushback":0.06,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":11,"active":5,"recovery":20,"damage":73,"level":"air","anim":"stand_heavy","hitstun":26,"blockstun":13,"knockback":0.11,"blockPushback":0.09,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 bullet:Object.freeze({
  stand_weak:Object.freeze({"startup":6,"active":3,"recovery":14,"damage":34,"level":"mid","anim":"stand_light","hitstun":20,"blockstun":10,"knockback":0.04,"blockPushback":0.045,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":13,"active":4,"recovery":26,"damage":79,"level":"mid","anim":"stand_heavy","hitstun":32,"blockstun":13,"knockback":0.12,"blockPushback":0.11,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":6,"active":3,"recovery":15,"damage":29,"level":"low","anim":"stand_light","hitstun":20,"blockstun":10,"knockback":0.04,"blockPushback":0.045,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":14,"active":4,"recovery":28,"damage":76,"level":"low","anim":"stand_heavy","hitstun":34,"blockstun":13,"knockback":0.13,"blockPushback":0.12,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":6,"active":5,"recovery":14,"damage":35,"level":"air","anim":"stand_light","hitstun":18,"blockstun":10,"knockback":0.08,"blockPushback":0.06,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":14,"active":6,"recovery":24,"damage":72,"level":"air","anim":"stand_heavy","hitstun":31,"blockstun":13,"knockback":0.12,"blockPushback":0.1,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
 dark_moguzo:Object.freeze({
  stand_weak:Object.freeze({"startup":4,"active":2,"recovery":13,"damage":29,"level":"mid","anim":"stand_light","hitstun":17,"blockstun":8,"knockback":0.025,"blockPushback":0.035,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  stand_heavy:Object.freeze({"startup":11,"active":3,"recovery":24,"damage":65,"level":"mid","anim":"stand_heavy","hitstun":29,"blockstun":11,"knockback":0.07,"blockPushback":0.08,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  crouch_weak:Object.freeze({"startup":5,"active":2,"recovery":14,"damage":25,"level":"low","anim":"stand_light","hitstun":17,"blockstun":8,"knockback":0.025,"blockPushback":0.035,"cancelWindow":{"hit":[0,6],"block":[0,2]},"cancelOnHit":["weak","heavy","s1","s2","s3"],"cancelOnBlock":["weak","heavy"]}),
  crouch_heavy:Object.freeze({"startup":11,"active":4,"recovery":26,"damage":62,"level":"low","anim":"stand_heavy","hitstun":32,"blockstun":11,"knockback":0.08,"blockPushback":0.09,"cancelWindow":{"hit":[0,5],"block":[0,2]},"cancelOnHit":["s1","s2","s3"],"cancelOnBlock":[]}),
  air_weak:Object.freeze({"startup":4,"active":4,"recovery":12,"damage":31,"level":"air","anim":"stand_light","hitstun":16,"blockstun":9,"knockback":0.05,"blockPushback":0.05,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
  air_heavy:Object.freeze({"startup":9,"active":5,"recovery":20,"damage":64,"level":"air","anim":"stand_heavy","hitstun":26,"blockstun":12,"knockback":0.09,"blockPushback":0.08,"cancelWindow":{"hit":null,"block":null},"cancelOnHit":[],"cancelOnBlock":[]}),
 }),
});
export function normalPerformance(id,slot){
 const m=NORMAL_BALANCE[id]?.[slot];if(!m)throw Error("unknown normal: "+id+"/"+slot);
 return {...m,cancelWindow:{...m.cancelWindow},cancelOnHit:[...m.cancelOnHit],cancelOnBlock:[...m.cancelOnBlock]};
}
