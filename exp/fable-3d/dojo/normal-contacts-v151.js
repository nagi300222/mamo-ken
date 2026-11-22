// v15.1 通常技の接触同期データ（Claude 制作・実測）。生成: normal-art/v15_1/tools/build_contacts.mjs — 手で編集しない。
// contact/contactEnd = クリップ正規化時刻。reach = 攻撃側 root から打撃部位表面までの前方距離 [m]（相手の hurt radius .16 は判定側で加算）。
// activeReach = contact〜contactEnd を phase 0..1 としたときの実測の伸縮。各点の height はその時刻の打撃表面（最前頂点）の高さ [m]（root 基準、地上クリップで測定。空中技は攻撃側の y を足す）。
// status 'fix' は見た目の不一致が残る暫定値。
// NORMAL_HURT_BOUNDS = 相手側の被弾範囲の高さ [m]（root 基準）。元GLBのスキン後頂点のうち body+head+leg（腕と尾は除く）の高さ分布から、
//   top = 98パーセンタイル（耳先など上位2%の突起を除く）、bottom = 0（足裏）。stand は idle（4時刻）と guard_stand の高い方、crouch は crouch と guard_crouch の高い方。detail に内訳。
export const NORMAL_CONTACTS_VERSION="15.1-r3";
export const NORMAL_CONTACTS=Object.freeze({
 "moguzo": {
  "stand_weak": {
   "contact": 0.225,
   "contactEnd": 0.3,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.415,
   "height": 0.34,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.415,
     "height": 0.34
    },
    {
     "phase": 0.5,
     "reach": 0.409,
     "height": 0.322
    },
    {
     "phase": 1,
     "reach": 0.396,
     "height": 0.294
    }
   ],
   "status": "ok",
   "gesture": "straightL",
   "motifContact": 0.34
  },
  "stand_heavy": {
   "contact": 0.3,
   "contactEnd": 0.36,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.463,
   "height": 0.247,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.463,
     "height": 0.247
    },
    {
     "phase": 0.5,
     "reach": 0.438,
     "height": 0.228
    },
    {
     "phase": 1,
     "reach": 0.403,
     "height": 0.214
    }
   ],
   "status": "ok",
   "gesture": "risingR",
   "motifContact": 0.43
  },
  "crouch_weak": {
   "contact": 0.375,
   "contactEnd": 0.495,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.46,
   "height": 0.188,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.46,
     "height": 0.188
    },
    {
     "phase": 0.5,
     "reach": 0.454,
     "height": 0.19
    },
    {
     "phase": 1,
     "reach": 0.442,
     "height": 0.192
    }
   ],
   "status": "ok",
   "gesture": "lowPalmStep",
   "motifContact": 0.36
  },
  "crouch_heavy": {
   "contact": 0.5,
   "contactEnd": 0.575,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.386,
   "height": 0.15,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.386,
     "height": 0.15
    },
    {
     "phase": 0.5,
     "reach": 0.381,
     "height": 0.151
    },
    {
     "phase": 1,
     "reach": 0.369,
     "height": 0.152
    }
   ],
   "status": "ok",
   "gesture": "groundPound",
   "motifContact": 0.48
  },
  "air_weak": {
   "contact": 0.35,
   "contactEnd": 0.47,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.427,
   "height": 0.324,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.427,
     "height": 0.324
    },
    {
     "phase": 0.5,
     "reach": 0.424,
     "height": 0.341
    },
    {
     "phase": 1,
     "reach": 0.427,
     "height": 0.326
    }
   ],
   "status": "ok",
   "gesture": "diveFistL",
   "motifContact": 0.37
  },
  "air_heavy": {
   "contact": 0.475,
   "contactEnd": 0.535,
   "attackPart": "legR",
   "attackBone": "foot.R",
   "reach": 0.297,
   "height": 0.098,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.297,
     "height": 0.098
    },
    {
     "phase": 0.5,
     "reach": 0.282,
     "height": 0.107
    },
    {
     "phase": 1,
     "reach": 0.262,
     "height": 0.126
    }
   ],
   "status": "ok",
   "gesture": "overheadHeel",
   "motifContact": 0.46
  }
 },
 "pisuke": {
  "stand_weak": {
   "contact": 0.2,
   "contactEnd": 0.26,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.376,
   "height": 0.371,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.376,
     "height": 0.371
    },
    {
     "phase": 0.5,
     "reach": 0.357,
     "height": 0.347
    },
    {
     "phase": 1,
     "reach": 0.332,
     "height": 0.329
    }
   ],
   "status": "ok",
   "gesture": "snapJabL",
   "motifContact": 0.27
  },
  "stand_heavy": {
   "contact": 0.3,
   "contactEnd": 0.36,
   "attackPart": "legR",
   "attackBone": "foot.R",
   "reach": 0.335,
   "height": 0.252,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.335,
     "height": 0.252
    },
    {
     "phase": 0.5,
     "reach": 0.305,
     "height": 0.268
    },
    {
     "phase": 1,
     "reach": 0.264,
     "height": 0.289
    }
   ],
   "status": "ok",
   "gesture": "roundKickR",
   "motifContact": 0.39
  },
  "crouch_weak": {
   "contact": 0.325,
   "contactEnd": 0.445,
   "attackPart": "legL",
   "attackBone": "foot.L",
   "reach": 0.307,
   "height": 0.102,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.307,
     "height": 0.102
    },
    {
     "phase": 0.5,
     "reach": 0.303,
     "height": 0.099
    },
    {
     "phase": 1,
     "reach": 0.293,
     "height": 0.077
    }
   ],
   "status": "ok",
   "gesture": "shinSnapL",
   "motifContact": 0.32
  },
  "crouch_heavy": {
   "contact": 0.4,
   "contactEnd": 0.46,
   "attackPart": "legR",
   "attackBone": "foot.R",
   "reach": 0.395,
   "height": 0.069,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.395,
     "height": 0.069
    },
    {
     "phase": 0.5,
     "reach": 0.389,
     "height": 0.067
    },
    {
     "phase": 1,
     "reach": 0.372,
     "height": 0.063
    }
   ],
   "status": "ok",
   "gesture": "lowSpinKick",
   "motifContact": 0.4
  },
  "air_weak": {
   "contact": 0.45,
   "contactEnd": 0.57,
   "attackPart": "legL",
   "attackBone": "foot.L",
   "reach": 0.327,
   "height": 0.211,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.327,
     "height": 0.211
    },
    {
     "phase": 0.5,
     "reach": 0.326,
     "height": 0.198
    },
    {
     "phase": 1,
     "reach": 0.316,
     "height": 0.184
    }
   ],
   "status": "ok",
   "gesture": "airSnapKick",
   "motifContact": 0.31
  },
  "air_heavy": {
   "contact": 0.425,
   "contactEnd": 0.545,
   "attackPart": "legR",
   "attackBone": "foot.R",
   "reach": 0.325,
   "height": 0.142,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.325,
     "height": 0.142
    },
    {
     "phase": 0.5,
     "reach": 0.323,
     "height": 0.179
    },
    {
     "phase": 1,
     "reach": 0.321,
     "height": 0.167
    }
   ],
   "status": "ok",
   "gesture": "heelDiveR",
   "motifContact": 0.46
  }
 },
 "godan": {
  "stand_weak": {
   "contact": 0.425,
   "contactEnd": 0.485,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.459,
   "height": 0.28,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.459,
     "height": 0.28
    },
    {
     "phase": 0.5,
     "reach": 0.449,
     "height": 0.281
    },
    {
     "phase": 1,
     "reach": 0.437,
     "height": 0.283
    }
   ],
   "status": "ok",
   "gesture": "shortBodyR",
   "motifContact": 0.4
  },
  "stand_heavy": {
   "contact": 0.45,
   "contactEnd": 0.57,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "bothHands": true,
   "reach": 0.557,
   "height": 0.18,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.557,
     "height": 0.18
    },
    {
     "phase": 0.5,
     "reach": 0.554,
     "height": 0.17
    },
    {
     "phase": 1,
     "reach": 0.541,
     "height": 0.158
    }
   ],
   "status": "ok",
   "gesture": "doubleHammer",
   "motifContact": 0.61
  },
  "crouch_weak": {
   "contact": 0.45,
   "contactEnd": 0.55,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.426,
   "height": 0.256,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.426,
     "height": 0.256
    },
    {
     "phase": 0.5,
     "reach": 0.419,
     "height": 0.251
    },
    {
     "phase": 1,
     "reach": 0.408,
     "height": 0.241
    }
   ],
   "status": "ok",
   "gesture": "sideElbowL",
   "motifContact": 0.43
  },
  "crouch_heavy": {
   "contact": 0.5,
   "contactEnd": 0.575,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "bothHands": true,
   "reach": 0.446,
   "height": 0.197,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.446,
     "height": 0.197
    },
    {
     "phase": 0.5,
     "reach": 0.444,
     "height": 0.146
    },
    {
     "phase": 1,
     "reach": 0.429,
     "height": 0.086
    }
   ],
   "status": "ok",
   "gesture": "doubleGroundPound",
   "motifContact": 0.62
  },
  "air_weak": {
   "contact": 0.475,
   "contactEnd": 0.535,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.466,
   "height": 0.187,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.466,
     "height": 0.187
    },
    {
     "phase": 0.5,
     "reach": 0.454,
     "height": 0.188
    },
    {
     "phase": 1,
     "reach": 0.442,
     "height": 0.194
    }
   ],
   "status": "ok",
   "gesture": "descendingForearm",
   "motifContact": 0.46
  },
  "air_heavy": {
   "contact": 0.325,
   "contactEnd": 0.445,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "bothHands": true,
   "reach": 0.478,
   "height": 0.18,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.478,
     "height": 0.18
    },
    {
     "phase": 0.5,
     "reach": 0.473,
     "height": 0.117
    },
    {
     "phase": 1,
     "reach": 0.459,
     "height": 0.052
    }
   ],
   "status": "ok",
   "gesture": "bodyCrush",
   "motifContact": 0.59
  }
 },
 "hakuma": {
  "stand_weak": {
   "contact": 0.275,
   "contactEnd": 0.335,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.487,
   "height": 0.336,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.487,
     "height": 0.336
    },
    {
     "phase": 0.5,
     "reach": 0.468,
     "height": 0.304
    },
    {
     "phase": 1,
     "reach": 0.444,
     "height": 0.277
    }
   ],
   "status": "ok",
   "gesture": "palmPushL",
   "motifContact": 0.35
  },
  "stand_heavy": {
   "contact": 0.3,
   "contactEnd": 0.36,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "bothHands": true,
   "reach": 0.581,
   "height": 0.313,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.581,
     "height": 0.313
    },
    {
     "phase": 0.5,
     "reach": 0.571,
     "height": 0.287
    },
    {
     "phase": 1,
     "reach": 0.551,
     "height": 0.269
    }
   ],
   "status": "ok",
   "gesture": "doublePalmPush",
   "motifContact": 0.48
  },
  "crouch_weak": {
   "contact": 0.275,
   "contactEnd": 0.335,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.467,
   "height": 0.258,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.467,
     "height": 0.258
    },
    {
     "phase": 0.5,
     "reach": 0.456,
     "height": 0.207
    },
    {
     "phase": 1,
     "reach": 0.432,
     "height": 0.16
    }
   ],
   "status": "ok",
   "gesture": "lowPalmR",
   "motifContact": 0.38
  },
  "crouch_heavy": {
   "contact": 0.625,
   "contactEnd": 0.725,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.532,
   "height": 0.38,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.532,
     "height": 0.38
    },
    {
     "phase": 0.5,
     "reach": 0.528,
     "height": 0.323
    },
    {
     "phase": 1,
     "reach": 0.515,
     "height": 0.265
    }
   ],
   "status": "ok",
   "gesture": "risingPalmL",
   "motifContact": 0.44
  },
  "air_weak": {
   "contact": 0.425,
   "contactEnd": 0.485,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.467,
   "height": 0.336,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.467,
     "height": 0.336
    },
    {
     "phase": 0.5,
     "reach": 0.46,
     "height": 0.334
    },
    {
     "phase": 1,
     "reach": 0.445,
     "height": 0.332
    }
   ],
   "status": "ok",
   "gesture": "shortPalmR",
   "motifContact": 0.41
  },
  "air_heavy": {
   "contact": 0.5,
   "contactEnd": 0.575,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "bothHands": true,
   "reach": 0.526,
   "height": 0.235,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.526,
     "height": 0.235
    },
    {
     "phase": 0.5,
     "reach": 0.52,
     "height": 0.239
    },
    {
     "phase": 1,
     "reach": 0.511,
     "height": 0.237
    }
   ],
   "status": "ok",
   "gesture": "hammerPalmPair",
   "motifContact": 0.51
  }
 },
 "chirka": {
  "stand_weak": {
   "contact": 0.225,
   "contactEnd": 0.325,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.388,
   "height": 0.321,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.388,
     "height": 0.321
    },
    {
     "phase": 0.5,
     "reach": 0.384,
     "height": 0.304
    },
    {
     "phase": 1,
     "reach": 0.373,
     "height": 0.283
    }
   ],
   "status": "ok",
   "gesture": "feintClawL",
   "motifContact": 0.4
  },
  "stand_heavy": {
   "contact": 0.45,
   "contactEnd": 0.51,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.4,
   "height": 0.352,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.4,
     "height": 0.352
    },
    {
     "phase": 0.5,
     "reach": 0.391,
     "height": 0.344
    },
    {
     "phase": 1,
     "reach": 0.374,
     "height": 0.342
    }
   ],
   "status": "ok",
   "gesture": "diagonalClawR",
   "motifContact": 0.44
  },
  "crouch_weak": {
   "contact": 0.375,
   "contactEnd": 0.495,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.398,
   "height": 0.146,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.398,
     "height": 0.146
    },
    {
     "phase": 0.5,
     "reach": 0.395,
     "height": 0.146
    },
    {
     "phase": 1,
     "reach": 0.385,
     "height": 0.148
    }
   ],
   "status": "ok",
   "gesture": "lowClawSlide",
   "motifContact": 0.35
  },
  "crouch_heavy": {
   "contact": 0.5,
   "contactEnd": 0.575,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "bothHands": true,
   "reach": 0.451,
   "height": 0.226,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.451,
     "height": 0.226
    },
    {
     "phase": 0.5,
     "reach": 0.445,
     "height": 0.182
    },
    {
     "phase": 1,
     "reach": 0.431,
     "height": 0.123
    }
   ],
   "status": "ok",
   "gesture": "crossClawPair",
   "motifContact": 0.5
  },
  "air_weak": {
   "contact": 0.4,
   "contactEnd": 0.52,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.357,
   "height": 0.323,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.357,
     "height": 0.323
    },
    {
     "phase": 0.5,
     "reach": 0.349,
     "height": 0.323
    },
    {
     "phase": 1,
     "reach": 0.34,
     "height": 0.322
    }
   ],
   "status": "ok",
   "gesture": "airFeintClaw",
   "motifContact": 0.37
  },
  "air_heavy": {
   "contact": 0.525,
   "contactEnd": 0.6,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "bothHands": true,
   "reach": 0.368,
   "height": 0.261,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.368,
     "height": 0.261
    },
    {
     "phase": 0.5,
     "reach": 0.362,
     "height": 0.263
    },
    {
     "phase": 1,
     "reach": 0.35,
     "height": 0.27
    }
   ],
   "status": "ok",
   "gesture": "pounceClawPair",
   "motifContact": 0.52
  }
 },
 "takimaru": {
  "stand_weak": {
   "contact": 0.275,
   "contactEnd": 0.335,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.591,
   "height": 0.418,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.591,
     "height": 0.418
    },
    {
     "phase": 0.5,
     "reach": 0.579,
     "height": 0.376
    },
    {
     "phase": 1,
     "reach": 0.559,
     "height": 0.342
    }
   ],
   "status": "ok",
   "gesture": "bearHookL",
   "motifContact": 0.42
  },
  "stand_heavy": {
   "contact": 0.35,
   "contactEnd": 0.41,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.544,
   "height": 0.163,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.544,
     "height": 0.163
    },
    {
     "phase": 0.5,
     "reach": 0.483,
     "height": 0.104
    },
    {
     "phase": 1,
     "reach": 0.405,
     "height": 0.16
    }
   ],
   "status": "ok",
   "gesture": "grapplerHammerR",
   "motifContact": 0.55
  },
  "crouch_weak": {
   "contact": 0.375,
   "contactEnd": 0.495,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.621,
   "height": 0.09,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.621,
     "height": 0.09
    },
    {
     "phase": 0.5,
     "reach": 0.619,
     "height": 0.105
    },
    {
     "phase": 1,
     "reach": 0.608,
     "height": 0.127
    }
   ],
   "status": "ok",
   "gesture": "lowReachAnkle",
   "motifContact": 0.37
  },
  "crouch_heavy": {
   "contact": 0.575,
   "contactEnd": 0.65,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "bothHands": true,
   "reach": 0.607,
   "height": 0.386,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.607,
     "height": 0.386
    },
    {
     "phase": 0.5,
     "reach": 0.598,
     "height": 0.337
    },
    {
     "phase": 1,
     "reach": 0.588,
     "height": 0.297
    }
   ],
   "status": "ok",
   "gesture": "risingGrabPair",
   "motifContact": 0.5
  },
  "air_weak": {
   "contact": 0.25,
   "contactEnd": 0.31,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.542,
   "height": 0.265,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.542,
     "height": 0.265
    },
    {
     "phase": 0.5,
     "reach": 0.532,
     "height": 0.245
    },
    {
     "phase": 1,
     "reach": 0.493,
     "height": 0.257
    }
   ],
   "status": "ok",
   "gesture": "airBearSwipe",
   "motifContact": 0.38
  },
  "air_heavy": {
   "contact": 0.525,
   "contactEnd": 0.625,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "bothHands": true,
   "reach": 0.615,
   "height": 0.224,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.615,
     "height": 0.224
    },
    {
     "phase": 0.5,
     "reach": 0.608,
     "height": 0.256
    },
    {
     "phase": 1,
     "reach": 0.596,
     "height": 0.263
    }
   ],
   "status": "ok",
   "gesture": "airBearHammer",
   "motifContact": 0.56
  }
 },
 "yomikage": {
  "stand_weak": {
   "contact": 0.25,
   "contactEnd": 0.37,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.388,
   "height": 0.355,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.388,
     "height": 0.355
    },
    {
     "phase": 0.5,
     "reach": 0.368,
     "height": 0.325
    },
    {
     "phase": 1,
     "reach": 0.372,
     "height": 0.328
    }
   ],
   "status": "ok",
   "gesture": "knifeHandL",
   "motifContact": 0.3
  },
  "stand_heavy": {
   "contact": 0.3,
   "contactEnd": 0.36,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.45,
   "height": 0.27,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.45,
     "height": 0.27
    },
    {
     "phase": 0.5,
     "reach": 0.413,
     "height": 0.242
    },
    {
     "phase": 1,
     "reach": 0.355,
     "height": 0.247
    }
   ],
   "status": "ok",
   "gesture": "crescentSlashR",
   "motifContact": 0.44
  },
  "crouch_weak": {
   "contact": 0.35,
   "contactEnd": 0.47,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.417,
   "height": 0.154,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.417,
     "height": 0.154
    },
    {
     "phase": 0.5,
     "reach": 0.415,
     "height": 0.153
    },
    {
     "phase": 1,
     "reach": 0.409,
     "height": 0.154
    }
   ],
   "status": "ok",
   "gesture": "shadowSliceLow",
   "motifContact": 0.33
  },
  "crouch_heavy": {
   "contact": 0.475,
   "contactEnd": 0.535,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.437,
   "height": 0.124,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.437,
     "height": 0.124
    },
    {
     "phase": 0.5,
     "reach": 0.429,
     "height": 0.124
    },
    {
     "phase": 1,
     "reach": 0.415,
     "height": 0.125
    }
   ],
   "status": "ok",
   "gesture": "sweepingBladeR",
   "motifContact": 0.45
  },
  "air_weak": {
   "contact": 0.25,
   "contactEnd": 0.31,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.342,
   "height": 0.254,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.342,
     "height": 0.254
    },
    {
     "phase": 0.5,
     "reach": 0.314,
     "height": 0.227
    },
    {
     "phase": 1,
     "reach": 0.27,
     "height": 0.201
    }
   ],
   "status": "ok",
   "gesture": "risingKnifeL",
   "motifContact": 0.32
  },
  "air_heavy": {
   "contact": 0.45,
   "contactEnd": 0.525,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.408,
   "height": 0.19,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.408,
     "height": 0.19
    },
    {
     "phase": 0.5,
     "reach": 0.402,
     "height": 0.18
    },
    {
     "phase": 1,
     "reach": 0.389,
     "height": 0.167
    }
   ],
   "status": "ok",
   "gesture": "descendingBladeR",
   "motifContact": 0.45
  }
 },
 "bullet": {
  "stand_weak": {
   "contact": 0.4,
   "contactEnd": 0.46,
   "attackPart": "head",
   "attackBone": "head",
   "reach": 0.417,
   "height": 0.407,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.417,
     "height": 0.407
    },
    {
     "phase": 0.5,
     "reach": 0.409,
     "height": 0.412
    },
    {
     "phase": 1,
     "reach": 0.4,
     "height": 0.416
    }
   ],
   "status": "ok",
   "gesture": "headFlick",
   "motifContact": 0.35
  },
  "stand_heavy": {
   "contact": 0.45,
   "contactEnd": 0.51,
   "attackPart": "tail",
   "attackBone": "tail",
   "reach": 0.656,
   "height": 0.191,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.656,
     "height": 0.191
    },
    {
     "phase": 0.5,
     "reach": 0.643,
     "height": 0.247
    },
    {
     "phase": 1,
     "reach": 0.612,
     "height": 0.25
    }
   ],
   "status": "ok",
   "gesture": "tailWideRight",
   "motifContact": 0.46
  },
  "crouch_weak": {
   "contact": 0.375,
   "contactEnd": 0.435,
   "attackPart": "tail",
   "attackBone": "tail",
   "reach": 0.548,
   "height": 0.069,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.548,
     "height": 0.069
    },
    {
     "phase": 0.5,
     "reach": 0.532,
     "height": 0.023
    },
    {
     "phase": 1,
     "reach": 0.5,
     "height": 0
    }
   ],
   "status": "ok",
   "gesture": "tailTipSnap",
   "motifContact": 0.36
  },
  "crouch_heavy": {
   "contact": 0.5,
   "contactEnd": 0.56,
   "attackPart": "tail",
   "attackBone": "tail",
   "reach": 0.641,
   "height": 0.007,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.641,
     "height": 0.007
    },
    {
     "phase": 0.5,
     "reach": 0.621,
     "height": 0
    },
    {
     "phase": 1,
     "reach": 0.586,
     "height": 0
    }
   ],
   "status": "ok",
   "gesture": "tailGroundSmash",
   "motifContact": 0.5
  },
  "air_weak": {
   "contact": 0.35,
   "contactEnd": 0.41,
   "attackPart": "tail",
   "attackBone": "tail",
   "reach": 0.551,
   "height": 0.304,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.551,
     "height": 0.304
    },
    {
     "phase": 0.5,
     "reach": 0.531,
     "height": 0.303
    },
    {
     "phase": 1,
     "reach": 0.497,
     "height": 0.308
    }
   ],
   "status": "ok",
   "gesture": "airTailFlick",
   "motifContact": 0.34
  },
  "air_heavy": {
   "contact": 0.475,
   "contactEnd": 0.55,
   "attackPart": "tail",
   "attackBone": "tail",
   "reach": 0.552,
   "height": 0.097,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.552,
     "height": 0.097
    },
    {
     "phase": 0.5,
     "reach": 0.546,
     "height": 0.137
    },
    {
     "phase": 1,
     "reach": 0.543,
     "height": 0.194
    }
   ],
   "status": "ok",
   "gesture": "airTailLash",
   "motifContact": 0.48
  }
 },
 "dark_moguzo": {
  "stand_weak": {
   "contact": 0.325,
   "contactEnd": 0.385,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.395,
   "height": 0.333,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.395,
     "height": 0.333
    },
    {
     "phase": 0.5,
     "reach": 0.386,
     "height": 0.336
    },
    {
     "phase": 1,
     "reach": 0.376,
     "height": 0.34
    }
   ],
   "status": "ok",
   "gesture": "reverseJabR",
   "motifContact": 0.28
  },
  "stand_heavy": {
   "contact": 0.3,
   "contactEnd": 0.36,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "bothHands": true,
   "reach": 0.44,
   "height": 0.18,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.44,
     "height": 0.18
    },
    {
     "phase": 0.5,
     "reach": 0.392,
     "height": 0.152
    },
    {
     "phase": 1,
     "reach": 0.342,
     "height": 0.16
    }
   ],
   "status": "ok",
   "gesture": "blackDoubleHook",
   "motifContact": 0.38
  },
  "crouch_weak": {
   "contact": 0.325,
   "contactEnd": 0.445,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.437,
   "height": 0.174,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.437,
     "height": 0.174
    },
    {
     "phase": 0.5,
     "reach": 0.435,
     "height": 0.174
    },
    {
     "phase": 1,
     "reach": 0.431,
     "height": 0.18
    }
   ],
   "status": "ok",
   "gesture": "lowBackfist",
   "motifContact": 0.3
  },
  "crouch_heavy": {
   "contact": 0.425,
   "contactEnd": 0.5,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.509,
   "height": 0.254,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.509,
     "height": 0.254
    },
    {
     "phase": 0.5,
     "reach": 0.504,
     "height": 0.252
    },
    {
     "phase": 1,
     "reach": 0.489,
     "height": 0.243
    }
   ],
   "status": "ok",
   "gesture": "shadowRushPunch",
   "motifContact": 0.43
  },
  "air_weak": {
   "contact": 0.35,
   "contactEnd": 0.41,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.336,
   "height": 0.113,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.336,
     "height": 0.113
    },
    {
     "phase": 0.5,
     "reach": 0.321,
     "height": 0.11
    },
    {
     "phase": 1,
     "reach": 0.305,
     "height": 0.111
    }
   ],
   "status": "ok",
   "gesture": "airSpikeFistR",
   "motifContact": 0.32
  },
  "air_heavy": {
   "contact": 0.475,
   "contactEnd": 0.595,
   "attackPart": "legR",
   "attackBone": "foot.R",
   "reach": 0.262,
   "height": 0.165,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.262,
     "height": 0.165
    },
    {
     "phase": 0.5,
     "reach": 0.255,
     "height": 0.19
    },
    {
     "phase": 1,
     "reach": 0.247,
     "height": 0.219
    }
   ],
   "status": "ok",
   "gesture": "darkSpinKick",
   "motifContact": 0.47
  }
 }
});
export const NORMAL_HURT_BOUNDS=Object.freeze({
 "moguzo": {
  "stand": {
   "bottom": 0,
   "top": 0.574
  },
  "crouch": {
   "bottom": 0,
   "top": 0.442
  },
  "detail": {
   "idleTop": 0.574,
   "guardStandTop": 0.547,
   "crouchTop": 0.399,
   "guardCrouchTop": 0.442,
   "idleTopMax": 0.596
  }
 },
 "pisuke": {
  "stand": {
   "bottom": 0,
   "top": 0.623
  },
  "crouch": {
   "bottom": 0,
   "top": 0.392
  },
  "detail": {
   "idleTop": 0.623,
   "guardStandTop": 0.586,
   "crouchTop": 0.336,
   "guardCrouchTop": 0.392,
   "idleTopMax": 0.642
  }
 },
 "godan": {
  "stand": {
   "bottom": 0,
   "top": 0.629
  },
  "crouch": {
   "bottom": 0,
   "top": 0.52
  },
  "detail": {
   "idleTop": 0.629,
   "guardStandTop": 0.591,
   "crouchTop": 0.471,
   "guardCrouchTop": 0.52,
   "idleTopMax": 0.649
  }
 },
 "hakuma": {
  "stand": {
   "bottom": 0,
   "top": 0.661
  },
  "crouch": {
   "bottom": 0,
   "top": 0.563
  },
  "detail": {
   "idleTop": 0.661,
   "guardStandTop": 0.629,
   "crouchTop": 0.519,
   "guardCrouchTop": 0.563,
   "idleTopMax": 0.685
  }
 },
 "chirka": {
  "stand": {
   "bottom": 0,
   "top": 0.554
  },
  "crouch": {
   "bottom": 0,
   "top": 0.383
  },
  "detail": {
   "idleTop": 0.554,
   "guardStandTop": 0.519,
   "crouchTop": 0.335,
   "guardCrouchTop": 0.383,
   "idleTopMax": 0.568
  }
 },
 "takimaru": {
  "stand": {
   "bottom": 0,
   "top": 0.702
  },
  "crouch": {
   "bottom": 0,
   "top": 0.568
  },
  "detail": {
   "idleTop": 0.702,
   "guardStandTop": 0.663,
   "crouchTop": 0.515,
   "guardCrouchTop": 0.568,
   "idleTopMax": 0.725
  }
 },
 "yomikage": {
  "stand": {
   "bottom": 0,
   "top": 0.615
  },
  "crouch": {
   "bottom": 0,
   "top": 0.456
  },
  "detail": {
   "idleTop": 0.615,
   "guardStandTop": 0.588,
   "crouchTop": 0.407,
   "guardCrouchTop": 0.456,
   "idleTopMax": 0.633
  }
 },
 "bullet": {
  "stand": {
   "bottom": 0,
   "top": 0.593
  },
  "crouch": {
   "bottom": 0,
   "top": 0.456
  },
  "detail": {
   "idleTop": 0.593,
   "guardStandTop": 0.564,
   "crouchTop": 0.411,
   "guardCrouchTop": 0.456,
   "idleTopMax": 0.614
  }
 },
 "dark_moguzo": {
  "stand": {
   "bottom": 0,
   "top": 0.565
  },
  "crouch": {
   "bottom": 0,
   "top": 0.422
  },
  "detail": {
   "idleTop": 0.565,
   "guardStandTop": 0.534,
   "crouchTop": 0.376,
   "guardCrouchTop": 0.422,
   "idleTopMax": 0.583
  }
 }
});
