// v17 P3 通常技の接触同期データ（Claude 制作・実測）。生成: motion/v17/tools/contacts_v17.mjs — 手で編集しない。
// 定義は v15.1 の NORMAL_CONTACTS と同じ: contact/contactEnd = クリップ正規化時刻、reach = 攻撃側 root から打撃部位表面までの前方距離 [m]
// （相手の hurt radius は含まない）、activeReach = contact〜contactEnd を phase 0..1 としたときの実測の reach と打点の高さ。
// clip は motion/v17/<id>_normals_v17.glb の中のクリップ名。status 'fix' は見た目の不一致が残る暫定値。
export const NORMAL_CONTACTS_V17_VERSION="v17-p3-normals-1";
export const NORMAL_CONTACTS_V17=Object.freeze({
 "moguzo": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.397,
   "height": 0.363,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.397,
     "height": 0.363
    },
    {
     "phase": 0.5,
     "reach": 0.402,
     "height": 0.364
    },
    {
     "phase": 1,
     "reach": 0.398,
     "height": 0.363
    }
   ],
   "status": "ok",
   "name": "前手の直ジャブ"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.465,
   "height": 0.3,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.465,
     "height": 0.3
    },
    {
     "phase": 0.5,
     "reach": 0.495,
     "height": 0.296
    },
    {
     "phase": 1,
     "reach": 0.49,
     "height": 0.297
    }
   ],
   "status": "ok",
   "name": "踏み込みストレート"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.494,
   "height": 0.193,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.494,
     "height": 0.193
    },
    {
     "phase": 0.5,
     "reach": 0.502,
     "height": 0.2
    },
    {
     "phase": 1,
     "reach": 0.5,
     "height": 0.201
    }
   ],
   "status": "ok",
   "name": "しゃがみすくい打ち"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.451,
   "height": 0.17,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.451,
     "height": 0.17
    },
    {
     "phase": 0.5,
     "reach": 0.469,
     "height": 0.166
    },
    {
     "phase": 1,
     "reach": 0.466,
     "height": 0.166
    }
   ],
   "status": "ok",
   "name": "しゃがみ横払い"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.39,
   "height": 0.219,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.39,
     "height": 0.219
    },
    {
     "phase": 0.5,
     "reach": 0.394,
     "height": 0.215
    },
    {
     "phase": 1,
     "reach": 0.39,
     "height": 0.216
    }
   ],
   "status": "ok",
   "name": "空中の差し拳"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.294,
   "height": 0.085,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.294,
     "height": 0.085
    },
    {
     "phase": 0.5,
     "reach": 0.291,
     "height": 0.085
    },
    {
     "phase": 1,
     "reach": 0.29,
     "height": 0.082
    }
   ],
   "status": "ok",
   "name": "かかと落とし"
  }
 },
 "pisuke": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.379,
   "height": 0.4,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.379,
     "height": 0.4
    },
    {
     "phase": 0.5,
     "reach": 0.382,
     "height": 0.398
    },
    {
     "phase": 1,
     "reach": 0.378,
     "height": 0.397
    }
   ],
   "status": "ok",
   "name": "二拍子の前手"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.375,
   "height": 0.246,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.375,
     "height": 0.246
    },
    {
     "phase": 0.5,
     "reach": 0.392,
     "height": 0.262
    },
    {
     "phase": 1,
     "reach": 0.383,
     "height": 0.257
    }
   ],
   "status": "ok",
   "name": "背面回し蹴り"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.434,
   "height": 0.077,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.434,
     "height": 0.077
    },
    {
     "phase": 0.5,
     "reach": 0.44,
     "height": 0.075
    },
    {
     "phase": 1,
     "reach": 0.438,
     "height": 0.076
    }
   ],
   "status": "ok",
   "name": "地すれの手払い"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.392,
   "height": 0.044,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.392,
     "height": 0.044
    },
    {
     "phase": 0.5,
     "reach": 0.411,
     "height": 0.048
    },
    {
     "phase": 1,
     "reach": 0.407,
     "height": 0.045
    }
   ],
   "status": "ok",
   "name": "長い掃き蹴り"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.353,
   "height": 0.249,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.353,
     "height": 0.249
    },
    {
     "phase": 0.5,
     "reach": 0.357,
     "height": 0.243
    },
    {
     "phase": 1,
     "reach": 0.353,
     "height": 0.247
    }
   ],
   "status": "ok",
   "name": "膝を畳んだ差し拳"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.323,
   "height": 0.112,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.323,
     "height": 0.112
    },
    {
     "phase": 0.5,
     "reach": 0.317,
     "height": 0.107
    },
    {
     "phase": 1,
     "reach": 0.316,
     "height": 0.103
    }
   ],
   "status": "ok",
   "name": "止めて落とすかかと"
  }
 },
 "godan": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.3438,
   "contactEnd": 0.4688,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.463,
   "height": 0.379,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.463,
     "height": 0.379
    },
    {
     "phase": 0.5,
     "reach": 0.472,
     "height": 0.382
    },
    {
     "phase": 1,
     "reach": 0.467,
     "height": 0.374
    }
   ],
   "status": "ok",
   "name": "前腕の押し"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3889,
   "contactEnd": 0.4815,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.561,
   "height": 0.283,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.561,
     "height": 0.283
    },
    {
     "phase": 0.5,
     "reach": 0.606,
     "height": 0.246
    },
    {
     "phase": 1,
     "reach": 0.604,
     "height": 0.241
    }
   ],
   "status": "ok",
   "name": "踏み込み重拳"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.3438,
   "contactEnd": 0.4688,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.521,
   "height": 0.195,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.521,
     "height": 0.195
    },
    {
     "phase": 0.5,
     "reach": 0.532,
     "height": 0.194
    },
    {
     "phase": 1,
     "reach": 0.527,
     "height": 0.196
    }
   ],
   "status": "ok",
   "name": "低い押し払い"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3889,
   "contactEnd": 0.4815,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.552,
   "height": 0.337,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.552,
     "height": 0.337
    },
    {
     "phase": 0.5,
     "reach": 0.568,
     "height": 0.342
    },
    {
     "phase": 1,
     "reach": 0.566,
     "height": 0.343
    }
   ],
   "status": "ok",
   "name": "肩ごとの押し上げ"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.3438,
   "contactEnd": 0.4688,
   "attackPart": "armR",
   "attackLimb": "elbowR",
   "reach": 0.278,
   "height": 0.386,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.278,
     "height": 0.386
    },
    {
     "phase": 0.5,
     "reach": 0.284,
     "height": 0.366
    },
    {
     "phase": 1,
     "reach": 0.281,
     "height": 0.374
    }
   ],
   "status": "ok",
   "name": "空中の肘"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3889,
   "contactEnd": 0.5,
   "attackPart": "head",
   "attackLimb": "body",
   "reach": 0.46,
   "height": 0.263,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.46,
     "height": 0.263
    },
    {
     "phase": 0.5,
     "reach": 0.47,
     "height": 0.239
    },
    {
     "phase": 1,
     "reach": 0.47,
     "height": 0.239
    }
   ],
   "status": "ok",
   "name": "全身の落とし"
  }
 },
 "hakuma": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.365,
   "height": 0.485,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.365,
     "height": 0.485
    },
    {
     "phase": 0.5,
     "reach": 0.367,
     "height": 0.483
    },
    {
     "phase": 1,
     "reach": 0.366,
     "height": 0.485
    }
   ],
   "status": "ok",
   "name": "短い張り手"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "bothHands": true,
   "reach": 0.423,
   "height": 0.452,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.423,
     "height": 0.452
    },
    {
     "phase": 0.5,
     "reach": 0.435,
     "height": 0.443
    },
    {
     "phase": 1,
     "reach": 0.432,
     "height": 0.444
    }
   ],
   "status": "ok",
   "name": "踏み込み両掌突き"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.499,
   "height": 0.252,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.499,
     "height": 0.252
    },
    {
     "phase": 0.5,
     "reach": 0.504,
     "height": 0.252
    },
    {
     "phase": 1,
     "reach": 0.5,
     "height": 0.252
    }
   ],
   "status": "ok",
   "name": "守りの払い"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armR",
   "attackLimb": "elbowR",
   "reach": 0.406,
   "height": 0.269,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.406,
     "height": 0.269
    },
    {
     "phase": 0.5,
     "reach": 0.415,
     "height": 0.251
    },
    {
     "phase": 1,
     "reach": 0.414,
     "height": 0.252
    }
   ],
   "status": "ok",
   "name": "足元への肘"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.407,
   "height": 0.469,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.407,
     "height": 0.469
    },
    {
     "phase": 0.5,
     "reach": 0.408,
     "height": 0.471
    },
    {
     "phase": 1,
     "reach": 0.407,
     "height": 0.469
    }
   ],
   "status": "ok",
   "name": "空中の前掌"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "bothHands": true,
   "reach": 0.453,
   "height": 0.391,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.453,
     "height": 0.391
    },
    {
     "phase": 0.5,
     "reach": 0.46,
     "height": 0.37
    },
    {
     "phase": 1,
     "reach": 0.461,
     "height": 0.369
    }
   ],
   "status": "ok",
   "name": "合わせ降り掌"
  }
 },
 "chirka": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.38,
   "height": 0.286,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.38,
     "height": 0.286
    },
    {
     "phase": 0.5,
     "reach": 0.385,
     "height": 0.287
    },
    {
     "phase": 1,
     "reach": 0.38,
     "height": 0.285
    }
   ],
   "status": "ok",
   "name": "ずらし爪"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.434,
   "height": 0.311,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.434,
     "height": 0.311
    },
    {
     "phase": 0.5,
     "reach": 0.449,
     "height": 0.305
    },
    {
     "phase": 1,
     "reach": 0.446,
     "height": 0.304
    }
   ],
   "status": "ok",
   "name": "逆ひねり爪"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.482,
   "height": 0.041,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.482,
     "height": 0.041
    },
    {
     "phase": 0.5,
     "reach": 0.49,
     "height": 0.042
    },
    {
     "phase": 1,
     "reach": 0.484,
     "height": 0.04
    }
   ],
   "status": "ok",
   "name": "視線先行の足元爪"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "legL",
   "attackLimb": "footL",
   "reach": 0.338,
   "height": 0.045,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.338,
     "height": 0.045
    },
    {
     "phase": 0.5,
     "reach": 0.349,
     "height": 0.046
    },
    {
     "phase": 1,
     "reach": 0.344,
     "height": 0.045
    }
   ],
   "status": "ok",
   "name": "低い横蹴り"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.354,
   "height": 0.191,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.354,
     "height": 0.191
    },
    {
     "phase": 0.5,
     "reach": 0.359,
     "height": 0.186
    },
    {
     "phase": 1,
     "reach": 0.355,
     "height": 0.19
    }
   ],
   "status": "ok",
   "name": "空中のずらし爪"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3913,
   "contactEnd": 0.4783,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.35,
   "height": 0.222,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.35,
     "height": 0.222
    },
    {
     "phase": 0.5,
     "reach": 0.394,
     "height": 0.15
    },
    {
     "phase": 1,
     "reach": 0.391,
     "height": 0.149
    }
   ],
   "status": "ok",
   "name": "溜め振り爪"
  }
 },
 "takimaru": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.492,
   "height": 0.59,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.492,
     "height": 0.59
    },
    {
     "phase": 0.5,
     "reach": 0.494,
     "height": 0.593
    },
    {
     "phase": 1,
     "reach": 0.494,
     "height": 0.59
    }
   ],
   "status": "ok",
   "name": "探る掌"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armR",
   "attackLimb": "shoulderR",
   "reach": 0.439,
   "height": 0.278,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.439,
     "height": 0.278
    },
    {
     "phase": 0.5,
     "reach": 0.444,
     "height": 0.259
    },
    {
     "phase": 1,
     "reach": 0.444,
     "height": 0.26
    }
   ],
   "status": "ok",
   "name": "寄せる肩打ち"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.602,
   "height": 0.23,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.602,
     "height": 0.23
    },
    {
     "phase": 0.5,
     "reach": 0.607,
     "height": 0.229
    },
    {
     "phase": 1,
     "reach": 0.603,
     "height": 0.229
    }
   ],
   "status": "ok",
   "name": "足元の払い"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "bothHands": true,
   "reach": 0.515,
   "height": 0.562,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.515,
     "height": 0.562
    },
    {
     "phase": 0.5,
     "reach": 0.523,
     "height": 0.606
    },
    {
     "phase": 1,
     "reach": 0.519,
     "height": 0.611
    }
   ],
   "status": "ok",
   "name": "すくい上げ"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armR",
   "attackLimb": "elbowR",
   "reach": 0.285,
   "height": 0.449,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.285,
     "height": 0.449
    },
    {
     "phase": 0.5,
     "reach": 0.285,
     "height": 0.437
    },
    {
     "phase": 1,
     "reach": 0.287,
     "height": 0.446
    }
   ],
   "status": "fix",
   "issues": [
    "前へ出切るのは u=0.5（接触 u=0.3214 より 0.04m 先）"
   ],
   "name": "落とし肘"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "head",
   "attackLimb": "body",
   "reach": 0.457,
   "height": 0.354,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.457,
     "height": 0.354
    },
    {
     "phase": 0.5,
     "reach": 0.466,
     "height": 0.331
    },
    {
     "phase": 1,
     "reach": 0.466,
     "height": 0.329
    }
   ],
   "status": "ok",
   "name": "丸めた体落とし"
  }
 },
 "yomikage": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.341,
   "height": 0.424,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.341,
     "height": 0.424
    },
    {
     "phase": 0.5,
     "reach": 0.349,
     "height": 0.42
    },
    {
     "phase": 1,
     "reach": 0.344,
     "height": 0.423
    }
   ],
   "status": "ok",
   "name": "手首返しの小突き"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3913,
   "contactEnd": 0.4783,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.425,
   "height": 0.396,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.425,
     "height": 0.396
    },
    {
     "phase": 0.5,
     "reach": 0.468,
     "height": 0.378
    },
    {
     "phase": 1,
     "reach": 0.465,
     "height": 0.377
    }
   ],
   "status": "ok",
   "name": "一歩の手刀斬り"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.349,
   "height": 0.145,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.349,
     "height": 0.145
    },
    {
     "phase": 0.5,
     "reach": 0.36,
     "height": 0.151
    },
    {
     "phase": 1,
     "reach": 0.353,
     "height": 0.144
    }
   ],
   "status": "ok",
   "name": "足首の払い"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "legL",
   "attackLimb": "kneeL+elbowR",
   "reach": 0.284,
   "height": 0.159,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.284,
     "height": 0.159
    },
    {
     "phase": 0.5,
     "reach": 0.29,
     "height": 0.17
    },
    {
     "phase": 1,
     "reach": 0.286,
     "height": 0.167
    }
   ],
   "status": "fix",
   "issues": [
    "head が 0.036m 先に出ている"
   ],
   "name": "迎えの膝と肘"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.329,
   "height": 0.343,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.329,
     "height": 0.343
    },
    {
     "phase": 0.5,
     "reach": 0.332,
     "height": 0.343
    },
    {
     "phase": 1,
     "reach": 0.328,
     "height": 0.344
    }
   ],
   "status": "ok",
   "name": "空中の短い掌"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.279,
   "height": 0.178,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.279,
     "height": 0.178
    },
    {
     "phase": 0.5,
     "reach": 0.287,
     "height": 0.147
    },
    {
     "phase": 1,
     "reach": 0.286,
     "height": 0.148
    }
   ],
   "status": "fix",
   "issues": [
    "head が 0.049m 先に出ている"
   ],
   "name": "下突き"
  }
 },
 "bullet": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.4,
   "height": 0.379,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.4,
     "height": 0.379
    },
    {
     "phase": 0.5,
     "reach": 0.405,
     "height": 0.38
    },
    {
     "phase": 1,
     "reach": 0.401,
     "height": 0.378
    }
   ],
   "status": "ok",
   "name": "測る前手"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.4167,
   "contactEnd": 0.5,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": 0.609,
   "height": 0.199,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.609,
     "height": 0.199
    },
    {
     "phase": 0.5,
     "reach": 0.645,
     "height": 0.172
    },
    {
     "phase": 1,
     "reach": 0.654,
     "height": 0.166
    }
   ],
   "status": "fix",
   "issues": [
    "前へ出切るのは u=0.525（接触 u=0.4167 より 0.056m 先）"
   ],
   "name": "長尾の横払い"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.399,
   "height": 0.226,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.399,
     "height": 0.226
    },
    {
     "phase": 0.5,
     "reach": 0.403,
     "height": 0.226
    },
    {
     "phase": 1,
     "reach": 0.4,
     "height": 0.225
    }
   ],
   "status": "ok",
   "name": "低い前手突き"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.4167,
   "contactEnd": 0.5,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": 0.672,
   "height": 0.116,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.672,
     "height": 0.116
    },
    {
     "phase": 0.5,
     "reach": 0.685,
     "height": 0.063
    },
    {
     "phase": 1,
     "reach": 0.686,
     "height": 0.056
    }
   ],
   "status": "ok",
   "name": "地すれの尾薙ぎ"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.3214,
   "contactEnd": 0.4286,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.392,
   "height": 0.241,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.392,
     "height": 0.241
    },
    {
     "phase": 0.5,
     "reach": 0.396,
     "height": 0.238
    },
    {
     "phase": 1,
     "reach": 0.393,
     "height": 0.239
    }
   ],
   "status": "ok",
   "name": "空中の前手"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.4167,
   "contactEnd": 0.5,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": 0.581,
   "height": 0,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.581,
     "height": 0
    },
    {
     "phase": 0.5,
     "reach": 0.552,
     "height": 0
    },
    {
     "phase": 1,
     "reach": 0.549,
     "height": 0
    }
   ],
   "status": "ok",
   "name": "溜め尾の振り下ろし"
  }
 },
 "dark_moguzo": {
  "stand_weak": {
   "clip": "v17_stand_weak",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.368,
   "height": 0.279,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.368,
     "height": 0.279
    },
    {
     "phase": 0.5,
     "reach": 0.381,
     "height": 0.275
    },
    {
     "phase": 1,
     "reach": 0.372,
     "height": 0.276
    }
   ],
   "status": "ok",
   "name": "低い差し返し"
  },
  "stand_heavy": {
   "clip": "v17_stand_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.45,
   "height": 0.256,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.45,
     "height": 0.256
    },
    {
     "phase": 0.5,
     "reach": 0.453,
     "height": 0.256
    },
    {
     "phase": 1,
     "reach": 0.445,
     "height": 0.256
    }
   ],
   "status": "ok",
   "name": "滑り込みの振り抜き"
  },
  "crouch_weak": {
   "clip": "v17_crouch_weak",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.489,
   "height": 0.08,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.489,
     "height": 0.08
    },
    {
     "phase": 0.5,
     "reach": 0.502,
     "height": 0.078
    },
    {
     "phase": 1,
     "reach": 0.493,
     "height": 0.077
    }
   ],
   "status": "ok",
   "name": "潜り突き"
  },
  "crouch_heavy": {
   "clip": "v17_crouch_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.462,
   "height": 0.063,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.462,
     "height": 0.063
    },
    {
     "phase": 0.5,
     "reach": 0.48,
     "height": 0.073
    },
    {
     "phase": 1,
     "reach": 0.473,
     "height": 0.072
    }
   ],
   "status": "ok",
   "name": "地を切る横払い"
  },
  "air_weak": {
   "clip": "v17_air_weak",
   "contact": 0.2917,
   "contactEnd": 0.4167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.295,
   "height": 0.222,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.295,
     "height": 0.222
    },
    {
     "phase": 0.5,
     "reach": 0.311,
     "height": 0.216
    },
    {
     "phase": 1,
     "reach": 0.305,
     "height": 0.219
    }
   ],
   "status": "ok",
   "name": "ひねり差し"
  },
  "air_heavy": {
   "clip": "v17_air_heavy",
   "contact": 0.3696,
   "contactEnd": 0.4565,
   "attackPart": "legL",
   "attackLimb": "footL",
   "reach": 0.3,
   "height": 0.063,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.3,
     "height": 0.063
    },
    {
     "phase": 0.5,
     "reach": 0.302,
     "height": 0.069
    },
    {
     "phase": 1,
     "reach": 0.301,
     "height": 0.067
    }
   ],
   "status": "ok",
   "name": "斜めの蹴り下ろし"
  }
 }
});
