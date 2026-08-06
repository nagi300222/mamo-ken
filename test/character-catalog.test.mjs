import assert from 'node:assert/strict';
import {
  CATALOG_MOVE_COUNT,
  CHARACTER_CATALOG,
  CHARACTER_CATALOG_BY_ID,
  CHARACTER_CATALOG_VERSION,
  exportCharacterCatalog,
  hashCharacterCatalog,
  validateCharacterCatalog,
  validateCurrentCommandCatalogParity,
} from '../src/core/character-catalog.ts';
import { CURRENT_CONTRACT } from '../src/core/constants.ts';

const EXPECTED_IDS = ['moguzo','pisuke','godan','hakuma','chirka','takimaru','yomikage','bullet','dark_moguzo'];
const EXPECTED_STATS = {
  moguzo:[3,3,3,3,3,1],
  pisuke:[2,5,2,4,2,2],
  godan:[5,1,4,1,4,1],
  hakuma:[2,2,5,3,2,2],
  chirka:[2,4,2,5,5,4],
  takimaru:[4,2,4,3,5,2],
  yomikage:[4,3,2,5,1,3],
  bullet:[5,2,3,5,3,3],
  dark_moguzo:[4,4,3,5,3,5],
};
const EXPECTED_MOVES = {
  moguzo:[
    ['地走り','→↓＋中'],['昇撃','↓→＋上'],['引き寄せ投げ','←→＋つかみ'],['砂払い','↓←＋下'],
    ['山越え拳','→→＋上'],['胴押し','←↓＋中'],['土煙突き','←↓→＋中'],
  ],
  pisuke:[
    ['二連牙','→→＋中'],['スライディング','↓←＋下'],['宙返り蹴','←→＋上'],['かすみ連打','↓→＋中'],
    ['風切り爪','→↓＋上'],['すり抜け足','→←＋下'],['つむじ返し','↓→→＋中'],
  ],
  godan:[
    ['地割れ','↓↓＋下'],['山掴み','→↓＋つかみ'],['巌の構え','←←＋中'],['岩砕き','↓→＋中'],
    ['天蓋落とし','→→＋上'],['根こそぎ','←↓＋下'],['大山押し','←↓→＋中'],
  ],
  hakuma:[
    ['雪壁掌','←↓＋中'],['氷柱返し','↓→＋上'],['雪崩抱え','←→＋つかみ'],['地伏せ','↓←＋下'],
    ['不動押し','←←＋中'],['白峰打ち','→↓＋上'],['雪煙崩し','←↓→＋中'],
  ],
  chirka:[
    ['だまし突き','→↓＋中'],['空鳴り爪','↓→＋上'],['すかし抱き','←→＋つかみ'],['影踏み','↓←＋下'],
    ['つんのめり','→←→＋中'],['戻り蹴り','←↓→＋上'],['あと出し頭突き','↓→↓＋中'],
  ],
  takimaru:[
    ['丸抱え','→↓＋つかみ'],['巻き投げ','←→＋つかみ'],['ぶちかまし','→→＋中'],['足さらい','↓←＋下'],
    ['熊手払い','↓→＋上'],['肩車崩し','←↓＋つかみ'],['大回転落とし','←↓→＋つかみ'],
  ],
  yomikage:[
    ['影縫い','→↓＋中'],['霞落とし','↓←＋下'],['月かすめ','←→＋上'],['腕返し','←↓＋つかみ'],
    ['後の先・天','→→＋上'],['後の先・地','↓↓＋下'],['後の先・芯','←↓→＋中'],
  ],
  bullet:[
    ['弾み突き','→↓＋中'],['尾払い','↓←＋下'],['跳ね上げ','↓→＋上'],['蓄圧タックル','→→＋中'],
    ['抱え弾き','←→＋つかみ'],['圧抜き掌','←←＋中'],['弾丸頭突き','←↓→→＋中'],
  ],
  dark_moguzo:[
    ['黒走り','→↓＋中'],['逆昇撃','↓→＋上'],['闇引き','←→＋つかみ'],['黒砂払い','↓←＋下'],
    ['裏山越え','→→＋上'],['闇押し','←↓＋中'],['黒煙突き','←↓→＋中'],
  ],
};

validateCharacterCatalog();
validateCurrentCommandCatalogParity(CURRENT_CONTRACT);

assert.equal(CHARACTER_CATALOG_VERSION,'character-catalog-v1');
assert.deepEqual(CHARACTER_CATALOG.map((character)=>character.id),EXPECTED_IDS);
assert.equal(CATALOG_MOVE_COUNT,63);
assert.equal(CHARACTER_CATALOG.flatMap((character)=>character.moves).length,63);
assert.equal(CHARACTER_CATALOG.flatMap((character)=>character.moves).filter((move)=>move.implementationStatus==='current_runtime').length,9);

for(const id of EXPECTED_IDS){
  const character=CHARACTER_CATALOG_BY_ID[id];
  assert.ok(character,`missing catalog entry: ${id}`);
  assert.equal(character.moves.length,7);
  const stats=character.displayStats;
  assert.deepEqual([stats.atk,stats.spd,stats.def,stats.tec,stats.brk,character.difficulty],EXPECTED_STATS[id]);
  assert.deepEqual(character.moves.map((move)=>[move.nameJa,move.command.notationJa]),EXPECTED_MOVES[id]);
  assert.deepEqual(character.combos.map((combo)=>combo.category),['beginner','basic','practical','advanced','max']);
  assert.ok(character.combos.every((combo)=>combo.status==='unverified_move_spec'&&combo.routeJa.length===0));
  assert.equal(character.roar.affectsGyuiin,false);
  assert.ok(character.cpuPlanJa.length>0);
}

assert.equal(CHARACTER_CATALOG_BY_ID.pisuke.moves.some((move)=>move.attribute==='GRAB'),false,'Piske intentionally relies on universal grab');
assert.deepEqual(
  CHARACTER_CATALOG.flatMap((character)=>character.specials.filter((special)=>special.status==='candidate').map((special)=>[character.id,special.id])),
  [['takimaru','follow_hug']],
);
for(const move of CHARACTER_CATALOG.flatMap((character)=>character.moves).filter((move)=>move.reach===3)){
  assert.ok(move.balanceConstraints.length>=2,`Reach 3 constraints missing: ${move.nameJa}`);
}

const exportA=exportCharacterCatalog();
const exportB=exportCharacterCatalog();
assert.equal(exportA,exportB);
const parsed=JSON.parse(exportA);
assert.equal(parsed.version,CHARACTER_CATALOG_VERSION);
assert.equal(parsed.characters.length,9);
const hashA=hashCharacterCatalog();
const hashB=hashCharacterCatalog();
assert.equal(hashA,hashB);
assert.match(hashA,/^[0-9a-f]{8}$/);

const broken=structuredClone(CHARACTER_CATALOG);
broken[0].moves[6].balanceConstraints=[];
assert.throws(()=>validateCharacterCatalog(broken),/Reach 3 move requires at least two constraints/);

console.log(`character catalog tests passed; characters=9; moves=${CATALOG_MOVE_COUNT}; runtime=9; combos=45-unverified; hash=${hashA}`);
