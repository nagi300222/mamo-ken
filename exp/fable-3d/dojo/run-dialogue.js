// Original dialogue preserved from main/dist/mamoken_mobile.html (legacy 2D).
export const ARCADE_DIALOGUE={ // Issue本文§Pre-fight dialogueの承認済み台詞をそのまま使用(新規生成しない)。dark_moguzoは掛け合い対象外(別途narration-only分岐)
  moguzo:{challenge:['（正面から勝つ！）','（最後まで立ってるのはオレだ！）'],response:['（逃げずに来い！）','（この拳で決める！）']},
  pisuke:{challenge:['（ついて来られる？）','（先に当てるよ！）'],response:['（遅い方が負け！）','（捕まえられるならね！）']},
  godan:{challenge:['（力比べだ）','（小細工はいらん）'],response:['（受け止めてみろ）','（一撃で沈める）']},
  hakuma:{challenge:['（焦らず、受けて返す）','（その力を見せてください）'],response:['（攻めるほど崩れます）','（守りは破らせません）']},
  chirka:{challenge:['（本物はどっちかな？）','（じわじわと倒してあげる）'],response:['（もう引っかかってるよ）','（強くなさそうね）']},
  takimaru:{challenge:['（掴んだら離さねえぜ？）','（胸貸してやるよ）'],response:['（近づいた時点で終わりだ！）','（まとめて投げ飛ばす！）']},
  yomikage:{challenge:['（手合わせ願う）','（影の力、見せてやる）'],response:['（……楽しませてもらおう）','（本気で来い）']},
  bullet:{challenge:['（止めてみろ、この力！）','（耐えられるか、この一撃）'],response:['（全部ひっくり返してやる！）','（圧が足りてないな！）']}
};

export function runDialogue(player,opponent,index=0){
 if(player==='dark_moguzo'||opponent==='dark_moguzo')return [{speaker:'',text:'闇の力が高まっている……！'}];
 return [{speaker:opponent,text:ARCADE_DIALOGUE[opponent].challenge[index%2]},{speaker:player,text:ARCADE_DIALOGUE[player].response[index%2]}];
}
