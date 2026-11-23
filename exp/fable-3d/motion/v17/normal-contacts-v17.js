// v17 P3 通常技 54 本の接触同期データ（Claude 制作・実測）。clip は motion/v17/<id>_normals_v17.glb のクリップ名。battleActive は dojo/normal-balance-v151.js の active の写し。
// 生成: motion/v17/tools/contacts_exact_v17.mjs — 手で編集しない。実ゲームのページ（WebGL）で、元 GLB のスキンメッシュを**正確なクリップ時刻**に置いて全頂点から実測（補間なし）。
// reach = 攻撃側 root から打撃部位表面の最前頂点までの前方距離 [m]（相手の hurt radius は含まない）。
// height = その頂点の高さ [m]。root 基準の**符号付き**で、0 に丸めていない（空中技で尾や足が root より下へ来る演技は負）。判定側は strikeY = a.y + height。
// activeReach[i] = Battle の持続フレーム i（phase = i/(active-1)、battleActive 枚）に対応する正確時刻の reach / height。
// contact / contactEnd = クリップ正規化時刻。再生契約は v15.1 と同じ（発生 F → contact、持続の最終 F → contactEnd）。
export const NORMAL_CONTACTS_V17_VERSION="v17-p3-normals-1-exact";
export const NORMAL_CONTACTS_V17=Object.freeze({
 "moguzo": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "前手の直ジャブ",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4018,
   "height": 0.3639,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4018,
     "height": 0.3639,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4018,
     "height": 0.3639,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4018,
     "height": 0.3639,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "踏み込みストレート",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4953,
   "height": 0.296,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4953,
     "height": 0.296,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.4953,
     "height": 0.296,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.4953,
     "height": 0.296,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.4953,
     "height": 0.296,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "しゃがみすくい打ち",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.5022,
   "height": 0.2004,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5022,
     "height": 0.2004,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.5022,
     "height": 0.2004,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.5022,
     "height": 0.2004,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "しゃがみ横払い",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4689,
   "height": 0.1655,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4689,
     "height": 0.1655,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.4689,
     "height": 0.1655,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.4689,
     "height": 0.1655,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.4689,
     "height": 0.1655,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "空中の差し拳",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.394,
   "height": 0.2152,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.394,
     "height": 0.2152,
     "part": "armL"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.394,
     "height": 0.2152,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.394,
     "height": 0.2152,
     "part": "armL"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.394,
     "height": 0.2152,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.394,
     "height": 0.2152,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "かかと落とし",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.291,
   "height": 0.0848,
   "battleActive": 6,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.291,
     "height": 0.0848,
     "part": "legR"
    },
    {
     "phase": 0.2,
     "frame": 1,
     "reach": 0.291,
     "height": 0.0848,
     "part": "legR"
    },
    {
     "phase": 0.4,
     "frame": 2,
     "reach": 0.291,
     "height": 0.0848,
     "part": "legR"
    },
    {
     "phase": 0.6,
     "frame": 3,
     "reach": 0.291,
     "height": 0.0848,
     "part": "legR"
    },
    {
     "phase": 0.8,
     "frame": 4,
     "reach": 0.291,
     "height": 0.0848,
     "part": "legR"
    },
    {
     "phase": 1,
     "frame": 5,
     "reach": 0.291,
     "height": 0.0848,
     "part": "legR"
    }
   ],
   "status": "ok"
  }
 },
 "pisuke": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "二拍子の前手",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3823,
   "height": 0.3984,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3823,
     "height": 0.3984,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.3823,
     "height": 0.3984,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "背面回し蹴り",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.3917,
   "height": 0.262,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3917,
     "height": 0.262,
     "part": "legR"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.3917,
     "height": 0.262,
     "part": "legR"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.3917,
     "height": 0.262,
     "part": "legR"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "地すれの手払い",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4397,
   "height": 0.0753,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4397,
     "height": 0.0753,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.4397,
     "height": 0.0753,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "長い掃き蹴り",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.4114,
   "height": 0.0476,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4114,
     "height": 0.0476,
     "part": "legR"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.4114,
     "height": 0.0476,
     "part": "legR"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.4114,
     "height": 0.0476,
     "part": "legR"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.4114,
     "height": 0.0476,
     "part": "legR"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "膝を畳んだ差し拳",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3568,
   "height": 0.2431,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3568,
     "height": 0.2431,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.3568,
     "height": 0.2431,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.3568,
     "height": 0.2431,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.3568,
     "height": 0.2431,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "止めて落とすかかと",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.3172,
   "height": 0.1068,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3172,
     "height": 0.1068,
     "part": "legR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.3172,
     "height": 0.1068,
     "part": "legR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.3172,
     "height": 0.1068,
     "part": "legR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.3172,
     "height": 0.1068,
     "part": "legR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.3172,
     "height": 0.1068,
     "part": "legR"
    }
   ],
   "status": "ok"
  }
 },
 "godan": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "前腕の押し",
   "contact": 0.3438,
   "contactEnd": 0.4688,
   "contactSeconds": 0.1833,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4722,
   "height": 0.3819,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4722,
     "height": 0.3819,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4722,
     "height": 0.3819,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4722,
     "height": 0.3819,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "踏み込み重拳",
   "contact": 0.3889,
   "contactEnd": 0.4815,
   "contactSeconds": 0.35,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.6064,
   "height": 0.2463,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.6064,
     "height": 0.2463,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.6064,
     "height": 0.2463,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.6064,
     "height": 0.2463,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.6064,
     "height": 0.2463,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.6064,
     "height": 0.2463,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "低い押し払い",
   "contact": 0.3438,
   "contactEnd": 0.4688,
   "contactSeconds": 0.1833,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.5323,
   "height": 0.1939,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5323,
     "height": 0.1939,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.5323,
     "height": 0.1939,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.5323,
     "height": 0.1939,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "肩ごとの押し上げ",
   "contact": 0.3889,
   "contactEnd": 0.4815,
   "contactSeconds": 0.35,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.5684,
   "height": 0.3415,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5684,
     "height": 0.3415,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.5684,
     "height": 0.3415,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.5684,
     "height": 0.3415,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.5684,
     "height": 0.3415,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.5684,
     "height": 0.3415,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "空中の肘",
   "contact": 0.3438,
   "contactEnd": 0.4688,
   "contactSeconds": 0.1833,
   "attackPart": "armR",
   "attackLimb": "elbowR",
   "reach": 0.2838,
   "height": 0.3659,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.2838,
     "height": 0.3659,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.2838,
     "height": 0.3659,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.2838,
     "height": 0.3659,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.2838,
     "height": 0.3659,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.2838,
     "height": 0.3659,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "全身の落とし",
   "contact": 0.3889,
   "contactEnd": 0.5,
   "contactSeconds": 0.35,
   "attackPart": "head",
   "attackLimb": "body",
   "reach": 0.4704,
   "height": 0.2388,
   "battleActive": 6,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4704,
     "height": 0.2388,
     "part": "head"
    },
    {
     "phase": 0.2,
     "frame": 1,
     "reach": 0.4704,
     "height": 0.2388,
     "part": "head"
    },
    {
     "phase": 0.4,
     "frame": 2,
     "reach": 0.4704,
     "height": 0.2388,
     "part": "head"
    },
    {
     "phase": 0.6,
     "frame": 3,
     "reach": 0.4704,
     "height": 0.2388,
     "part": "head"
    },
    {
     "phase": 0.8,
     "frame": 4,
     "reach": 0.4704,
     "height": 0.2388,
     "part": "head"
    },
    {
     "phase": 1,
     "frame": 5,
     "reach": 0.4704,
     "height": 0.2388,
     "part": "head"
    }
   ],
   "status": "ok"
  }
 },
 "hakuma": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "短い張り手",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3675,
   "height": 0.4828,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3675,
     "height": 0.4828,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.3675,
     "height": 0.4828,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.3675,
     "height": 0.4828,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.3675,
     "height": 0.4828,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "踏み込み両掌突き",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.4354,
   "height": 0.4431,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4354,
     "height": 0.4431,
     "part": "armL"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.4354,
     "height": 0.4431,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.4354,
     "height": 0.4431,
     "part": "armL"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.4354,
     "height": 0.4431,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.4354,
     "height": 0.4431,
     "part": "armL"
    }
   ],
   "status": "ok",
   "bothHands": true
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "守りの払い",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.5044,
   "height": 0.2524,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5044,
     "height": 0.2524,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.5044,
     "height": 0.2524,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.5044,
     "height": 0.2524,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.5044,
     "height": 0.2524,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "足元への肘",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armR",
   "attackLimb": "elbowR",
   "reach": 0.4148,
   "height": 0.2513,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4148,
     "height": 0.2513,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.4148,
     "height": 0.2513,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.4148,
     "height": 0.2513,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.4148,
     "height": 0.2513,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.4148,
     "height": 0.2513,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "空中の前掌",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4077,
   "height": 0.4712,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4077,
     "height": 0.4712,
     "part": "armL"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.4077,
     "height": 0.4712,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.4077,
     "height": 0.4712,
     "part": "armL"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.4077,
     "height": 0.4712,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.4077,
     "height": 0.4712,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "合わせ降り掌",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.4604,
   "height": 0.3704,
   "battleActive": 6,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4604,
     "height": 0.3704,
     "part": "armL"
    },
    {
     "phase": 0.2,
     "frame": 1,
     "reach": 0.4604,
     "height": 0.3704,
     "part": "armL"
    },
    {
     "phase": 0.4,
     "frame": 2,
     "reach": 0.4604,
     "height": 0.3704,
     "part": "armL"
    },
    {
     "phase": 0.6,
     "frame": 3,
     "reach": 0.4604,
     "height": 0.3704,
     "part": "armL"
    },
    {
     "phase": 0.8,
     "frame": 4,
     "reach": 0.4604,
     "height": 0.3704,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 5,
     "reach": 0.4604,
     "height": 0.3704,
     "part": "armL"
    }
   ],
   "status": "ok",
   "bothHands": true
  }
 },
 "chirka": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "ずらし爪",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3846,
   "height": 0.2869,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3846,
     "height": 0.2869,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.3846,
     "height": 0.2869,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "逆ひねり爪",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4494,
   "height": 0.3052,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4494,
     "height": 0.3052,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4494,
     "height": 0.3052,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4494,
     "height": 0.3052,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "視線先行の足元爪",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4898,
   "height": 0.0424,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4898,
     "height": 0.0424,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.4898,
     "height": 0.0424,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "低い横蹴り",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "legL",
   "attackLimb": "footL",
   "reach": 0.3492,
   "height": 0.0457,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3492,
     "height": 0.0457,
     "part": "legL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.3492,
     "height": 0.0457,
     "part": "legL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.3492,
     "height": 0.0457,
     "part": "legL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.3492,
     "height": 0.0457,
     "part": "legL"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "空中のずらし爪",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3594,
   "height": 0.1864,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3594,
     "height": 0.1864,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.3594,
     "height": 0.1864,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.3594,
     "height": 0.1864,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.3594,
     "height": 0.1864,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "溜め振り爪",
   "contact": 0.3913,
   "contactEnd": 0.4783,
   "contactSeconds": 0.3,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.3935,
   "height": 0.1499,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3935,
     "height": 0.1499,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.3935,
     "height": 0.1499,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.3935,
     "height": 0.1499,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.3935,
     "height": 0.1499,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.3935,
     "height": 0.1499,
     "part": "armR"
    }
   ],
   "status": "ok"
  }
 },
 "takimaru": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "探る掌",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4944,
   "height": 0.5925,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4944,
     "height": 0.5925,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4944,
     "height": 0.5925,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4944,
     "height": 0.5925,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "寄せる肩打ち",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armR",
   "attackLimb": "shoulderR",
   "reach": 0.4443,
   "height": 0.259,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4443,
     "height": 0.259,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.4443,
     "height": 0.259,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.4443,
     "height": 0.259,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.4443,
     "height": 0.259,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "足元の払い",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.6066,
   "height": 0.2291,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.6066,
     "height": 0.2291,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.6066,
     "height": 0.2291,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.6066,
     "height": 0.2291,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "すくい上げ",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.5227,
   "height": 0.6063,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5227,
     "height": 0.6063,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.5227,
     "height": 0.6063,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.5227,
     "height": 0.6063,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.5227,
     "height": 0.6063,
     "part": "armL"
    }
   ],
   "status": "ok",
   "bothHands": true
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "落とし肘",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armR",
   "attackLimb": "elbowR",
   "reach": 0.285,
   "height": 0.4374,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.285,
     "height": 0.4374,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.285,
     "height": 0.4374,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.285,
     "height": 0.4374,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.285,
     "height": 0.4374,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.285,
     "height": 0.4374,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "丸めた体落とし",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "head",
   "attackLimb": "body",
   "reach": 0.4657,
   "height": 0.3309,
   "battleActive": 6,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4657,
     "height": 0.3309,
     "part": "head"
    },
    {
     "phase": 0.2,
     "frame": 1,
     "reach": 0.4657,
     "height": 0.3309,
     "part": "head"
    },
    {
     "phase": 0.4,
     "frame": 2,
     "reach": 0.4657,
     "height": 0.3309,
     "part": "head"
    },
    {
     "phase": 0.6,
     "frame": 3,
     "reach": 0.4657,
     "height": 0.3309,
     "part": "head"
    },
    {
     "phase": 0.8,
     "frame": 4,
     "reach": 0.4657,
     "height": 0.3309,
     "part": "head"
    },
    {
     "phase": 1,
     "frame": 5,
     "reach": 0.4657,
     "height": 0.3309,
     "part": "head"
    }
   ],
   "status": "ok"
  }
 },
 "yomikage": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "手首返しの小突き",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "contactSeconds": 0.1167,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3486,
   "height": 0.4196,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3486,
     "height": 0.4196,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.3486,
     "height": 0.4196,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "一歩の手刀斬り",
   "contact": 0.3913,
   "contactEnd": 0.4783,
   "contactSeconds": 0.3,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4677,
   "height": 0.3775,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4677,
     "height": 0.3775,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4677,
     "height": 0.3775,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4677,
     "height": 0.3775,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "足首の払い",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "contactSeconds": 0.1167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.3601,
   "height": 0.1507,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3601,
     "height": 0.1507,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.3601,
     "height": 0.1507,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "迎えの膝と肘",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "legL",
   "attackLimb": "kneeL+elbowR",
   "reach": 0.3373,
   "height": 0.1609,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3373,
     "height": 0.1609,
     "part": "legL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.3373,
     "height": 0.1609,
     "part": "legL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.3373,
     "height": 0.1609,
     "part": "legL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.3373,
     "height": 0.1609,
     "part": "legL"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "空中の短い掌",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "contactSeconds": 0.1167,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3323,
   "height": 0.3427,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3323,
     "height": 0.3427,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.3323,
     "height": 0.3427,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.3323,
     "height": 0.3427,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.3323,
     "height": 0.3427,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "下突き",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.2685,
   "height": 0.2215,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.2685,
     "height": 0.2215,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.2685,
     "height": 0.2215,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.2685,
     "height": 0.2215,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.2685,
     "height": 0.2215,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.2685,
     "height": 0.2215,
     "part": "armR"
    }
   ],
   "status": "ok"
  }
 },
 "bullet": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "測る前手",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4055,
   "height": 0.3802,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4055,
     "height": 0.3802,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4055,
     "height": 0.3802,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4055,
     "height": 0.3802,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "長尾の横払い",
   "contact": 0.5208,
   "contactEnd": 0.6042,
   "contactSeconds": 0.4167,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": 0.6425,
   "height": 0.1913,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.6425,
     "height": 0.1913,
     "part": "tail"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.6542,
     "height": 0.1754,
     "part": "tail"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.624,
     "height": 0.1674,
     "part": "tail"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.568,
     "height": 0.1638,
     "part": "tail"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "低い前手突き",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4031,
   "height": 0.2257,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4031,
     "height": 0.2257,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4031,
     "height": 0.2257,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4031,
     "height": 0.2257,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "地すれの尾薙ぎ",
   "contact": 0.4167,
   "contactEnd": 0.5,
   "contactSeconds": 0.3333,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": 0.6802,
   "height": 0.107,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.6802,
     "height": 0.107,
     "part": "tail"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.6856,
     "height": 0.0697,
     "part": "tail"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.6853,
     "height": 0.0574,
     "part": "tail"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.6862,
     "height": 0.0555,
     "part": "tail"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "空中の前手",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.3965,
   "height": 0.2378,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3965,
     "height": 0.2378,
     "part": "armL"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.3965,
     "height": 0.2378,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.3965,
     "height": 0.2378,
     "part": "armL"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.3965,
     "height": 0.2378,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.3965,
     "height": 0.2378,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "溜め尾の振り下ろし",
   "contact": 0.4167,
   "contactEnd": 0.5,
   "contactSeconds": 0.3333,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": 0.5827,
   "height": -0.0724,
   "battleActive": 6,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5827,
     "height": -0.0724,
     "part": "tail"
    },
    {
     "phase": 0.2,
     "frame": 1,
     "reach": 0.5661,
     "height": -0.1317,
     "part": "tail"
    },
    {
     "phase": 0.4,
     "frame": 2,
     "reach": 0.5535,
     "height": -0.1608,
     "part": "tail"
    },
    {
     "phase": 0.6,
     "frame": 3,
     "reach": 0.548,
     "height": -0.1647,
     "part": "tail"
    },
    {
     "phase": 0.8,
     "frame": 4,
     "reach": 0.5475,
     "height": -0.1688,
     "part": "tail"
    },
    {
     "phase": 1,
     "frame": 5,
     "reach": 0.5491,
     "height": -0.1697,
     "part": "tail"
    }
   ],
   "status": "ok"
  }
 },
 "dark_moguzo": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "name": "低い差し返し",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "contactSeconds": 0.1167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.3809,
   "height": 0.2749,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3809,
     "height": 0.2749,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.3809,
     "height": 0.2749,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "name": "滑り込みの振り抜き",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4527,
   "height": 0.2557,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4527,
     "height": 0.2557,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.4527,
     "height": 0.2557,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.4527,
     "height": 0.2557,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "name": "潜り突き",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "contactSeconds": 0.1167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.5023,
   "height": 0.0777,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5023,
     "height": 0.0777,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.5023,
     "height": 0.0777,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "name": "地を切る横払い",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.48,
   "height": 0.0726,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.48,
     "height": 0.0726,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.48,
     "height": 0.0726,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.48,
     "height": 0.0726,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.48,
     "height": 0.0726,
     "part": "armL"
    }
   ],
   "status": "ok"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "name": "ひねり差し",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "contactSeconds": 0.1167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.3111,
   "height": 0.2157,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3111,
     "height": 0.2157,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.3111,
     "height": 0.2157,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.3111,
     "height": 0.2157,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.3111,
     "height": 0.2157,
     "part": "armR"
    }
   ],
   "status": "ok"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "name": "斜めの蹴り下ろし",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "contactSeconds": 0.2833,
   "attackPart": "legL",
   "attackLimb": "footL",
   "reach": 0.3017,
   "height": 0.0689,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3017,
     "height": 0.0689,
     "part": "legL"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.3017,
     "height": 0.0689,
     "part": "legL"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.3017,
     "height": 0.0689,
     "part": "legL"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.3017,
     "height": 0.0689,
     "part": "legL"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.3017,
     "height": 0.0689,
     "part": "legL"
    }
   ],
   "status": "ok"
  }
 }
});
