import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const target=path.join(ROOT,'src/core/ui-contract.ts');
let text=readFileSync(target,'utf8');
const marker="version: 'ui-contract-v2'";
if(text.includes(marker)){
  console.log('unchanged src/core/ui-contract.ts');
  process.exit(0);
}
function replaceOnce(from,to,label){
  const count=text.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected one match, found ${count}`);
  text=text.replace(from,to);
}
replaceOnce("version: 'ui-contract-v1'","version: 'ui-contract-v2'",'UI contract version');
replaceOnce(
  "Object.freeze({ id: 'back', visibleOn: screens('character_select', 'move_list'), requiresConfirmation: false }),",
  "Object.freeze({ id: 'back', visibleOn: screens('character_select', 'character_detail', 'move_list'), requiresConfirmation: false }),\n    Object.freeze({ id: 'character_detail', visibleOn: screens('character_select'), requiresConfirmation: false }),",
  'character detail actions',
);
replaceOnce(
  "  ultTextOverlay: Object.freeze({ status: 'optional', bakedIntoSprite: false, token: 'ult_text_overlay' }),",
  "  characterDetail: Object.freeze({\n    screen: 'character_detail',\n    tabs: Object.freeze(['performance', 'moves', 'combos'] as const),\n    tabLabelsJa: Object.freeze({ performance: '性能', moves: 'わざ', combos: 'コンボ' }),\n    returnsTo: 'character_select',\n    preservesSelectedCharacter: true,\n    allRosterEntriesVisible: true,\n    battleAvailabilityUnchanged: true,\n    comboUnverifiedLabelJa: '未検証',\n    scrollStepLogicalPx: 260,\n    minimumPrimaryTargetLogicalPx: 74,\n  }),\n  ultTextOverlay: Object.freeze({ status: 'optional', bakedIntoSprite: false, token: 'ult_text_overlay' }),",
  'character detail contract',
);
replaceOnce(
  "  if (!contract.onlineDisconnect.confirmationRequired) throw new Error('online disconnect confirmation is required');",
  "  if (JSON.stringify(contract.characterDetail.tabs) !== JSON.stringify(['performance', 'moves', 'combos'])) throw new Error('character detail tabs must be performance/moves/combos');\n  if (!contract.characterDetail.preservesSelectedCharacter) throw new Error('character detail must preserve selected character');\n  if (!contract.characterDetail.allRosterEntriesVisible) throw new Error('all roster entries must expose character details');\n  if (!contract.characterDetail.battleAvailabilityUnchanged) throw new Error('character details must not alter battle availability');\n  if (contract.characterDetail.minimumPrimaryTargetLogicalPx < 74) throw new Error('character detail primary tap targets are too small');\n  if (contract.characterDetail.comboUnverifiedLabelJa !== '未検証') throw new Error('unverified combo label must remain explicit');\n  if (!contract.onlineDisconnect.confirmationRequired) throw new Error('online disconnect confirmation is required');",
  'character detail validation',
);
writeFileSync(target,text,'utf8');
console.log('patched src/core/ui-contract.ts');
