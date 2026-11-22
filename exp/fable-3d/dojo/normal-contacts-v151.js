// v15.1 通常技の接触同期データ（Claude 制作・実測）。生成: normal-art/v15_1/tools/build_contacts.mjs — 手で編集しない。
// contact/contactEnd = クリップ正規化時刻。reach = 攻撃側 root から打撃部位表面までの前方距離 [m]（相手の hurt radius .16 は判定側で加算）。
// activeReach = contact〜contactEnd を phase 0..1 としたときの実測の伸縮。status 'fix' は見た目の不一致が残る暫定値。
export const NORMAL_CONTACTS_VERSION="15.1-wip1";
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
     "reach": 0.415
    },
    {
     "phase": 0.5,
     "reach": 0.409
    },
    {
     "phase": 1,
     "reach": 0.396
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
     "reach": 0.463
    },
    {
     "phase": 0.5,
     "reach": 0.438
    },
    {
     "phase": 1,
     "reach": 0.403
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
   "reach": 0.457,
   "height": 0.199,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.457
    },
    {
     "phase": 0.5,
     "reach": 0.451
    },
    {
     "phase": 1,
     "reach": 0.439
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
     "reach": 0.386
    },
    {
     "phase": 0.5,
     "reach": 0.381
    },
    {
     "phase": 1,
     "reach": 0.369
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
     "reach": 0.427
    },
    {
     "phase": 0.5,
     "reach": 0.424
    },
    {
     "phase": 1,
     "reach": 0.427
    }
   ],
   "status": "ok",
   "gesture": "diveFistL",
   "motifContact": 0.37
  },
  "air_heavy": {
   "contact": 0.475,
   "contactEnd": 0.595,
   "attackPart": "legR",
   "attackBone": "foot.R",
   "reach": 0.269,
   "height": 0.083,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.269
    },
    {
     "phase": 0.5,
     "reach": 0.263
    },
    {
     "phase": 1,
     "reach": 0.251
    }
   ],
   "status": "fix",
   "issues": [
    "head が 0.098m 先に出ている"
   ],
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
     "reach": 0.376
    },
    {
     "phase": 0.5,
     "reach": 0.357
    },
    {
     "phase": 1,
     "reach": 0.332
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
     "reach": 0.335
    },
    {
     "phase": 0.5,
     "reach": 0.305
    },
    {
     "phase": 1,
     "reach": 0.264
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
   "height": 0.106,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.307
    },
    {
     "phase": 0.5,
     "reach": 0.303
    },
    {
     "phase": 1,
     "reach": 0.294
    }
   ],
   "status": "ok",
   "gesture": "shinSnapL",
   "motifContact": 0.32
  },
  "crouch_heavy": {
   "contact": 0.325,
   "contactEnd": 0.445,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.33,
   "height": 0.221,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.33
    },
    {
     "phase": 0.5,
     "reach": 0.324
    },
    {
     "phase": 1,
     "reach": 0.322
    }
   ],
   "status": "fix",
   "issues": [
    "head が 0.073m 先に出ている"
   ],
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
     "reach": 0.327
    },
    {
     "phase": 0.5,
     "reach": 0.326
    },
    {
     "phase": 1,
     "reach": 0.316
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
     "reach": 0.325
    },
    {
     "phase": 0.5,
     "reach": 0.323
    },
    {
     "phase": 1,
     "reach": 0.321
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
   "reach": 0.5,
   "height": 0.307,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.5
    },
    {
     "phase": 0.5,
     "reach": 0.486
    },
    {
     "phase": 1,
     "reach": 0.47
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
     "reach": 0.557
    },
    {
     "phase": 0.5,
     "reach": 0.554
    },
    {
     "phase": 1,
     "reach": 0.541
    }
   ],
   "status": "ok",
   "gesture": "doubleHammer",
   "motifContact": 0.61
  },
  "crouch_weak": {
   "contact": 0.45,
   "contactEnd": 0.525,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.426,
   "height": 0.265,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.426
    },
    {
     "phase": 0.5,
     "reach": 0.418
    },
    {
     "phase": 1,
     "reach": 0.408
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
     "reach": 0.446
    },
    {
     "phase": 0.5,
     "reach": 0.444
    },
    {
     "phase": 1,
     "reach": 0.429
    }
   ],
   "status": "ok",
   "gesture": "doubleGroundPound",
   "motifContact": 0.62
  },
  "air_weak": {
   "contact": 0.45,
   "contactEnd": 0.55,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.459,
   "height": 0.212,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.459
    },
    {
     "phase": 0.5,
     "reach": 0.457
    },
    {
     "phase": 1,
     "reach": 0.446
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
     "reach": 0.478
    },
    {
     "phase": 0.5,
     "reach": 0.473
    },
    {
     "phase": 1,
     "reach": 0.459
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
     "reach": 0.487
    },
    {
     "phase": 0.5,
     "reach": 0.468
    },
    {
     "phase": 1,
     "reach": 0.444
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
     "reach": 0.581
    },
    {
     "phase": 0.5,
     "reach": 0.571
    },
    {
     "phase": 1,
     "reach": 0.551
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
     "reach": 0.467
    },
    {
     "phase": 0.5,
     "reach": 0.456
    },
    {
     "phase": 1,
     "reach": 0.432
    }
   ],
   "status": "ok",
   "gesture": "lowPalmR",
   "motifContact": 0.38
  },
  "crouch_heavy": {
   "contact": 0.65,
   "contactEnd": 0.725,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "reach": 0.528,
   "height": 0.346,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.528
    },
    {
     "phase": 0.5,
     "reach": 0.524
    },
    {
     "phase": 1,
     "reach": 0.515
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
   "reach": 0.468,
   "height": 0.349,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.468
    },
    {
     "phase": 0.5,
     "reach": 0.459
    },
    {
     "phase": 1,
     "reach": 0.443
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
     "reach": 0.526
    },
    {
     "phase": 0.5,
     "reach": 0.52
    },
    {
     "phase": 1,
     "reach": 0.511
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
     "reach": 0.388
    },
    {
     "phase": 0.5,
     "reach": 0.384
    },
    {
     "phase": 1,
     "reach": 0.373
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
   "reach": 0.421,
   "height": 0.357,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.421
    },
    {
     "phase": 0.5,
     "reach": 0.409
    },
    {
     "phase": 1,
     "reach": 0.388
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
   "reach": 0.42,
   "height": 0.13,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.42
    },
    {
     "phase": 0.5,
     "reach": 0.417
    },
    {
     "phase": 1,
     "reach": 0.406
    }
   ],
   "status": "ok",
   "gesture": "lowClawSlide",
   "motifContact": 0.35
  },
  "crouch_heavy": {
   "contact": 0.475,
   "contactEnd": 0.595,
   "attackPart": "armL",
   "attackBone": "paw.L",
   "bothHands": true,
   "reach": 0.461,
   "height": 0.226,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.461
    },
    {
     "phase": 0.5,
     "reach": 0.457
    },
    {
     "phase": 1,
     "reach": 0.443
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
   "reach": 0.355,
   "height": 0.318,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.355
    },
    {
     "phase": 0.5,
     "reach": 0.347
    },
    {
     "phase": 1,
     "reach": 0.337
    }
   ],
   "status": "ok",
   "gesture": "airFeintClaw",
   "motifContact": 0.37
  },
  "air_heavy": {
   "contact": 0.525,
   "contactEnd": 0.585,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "bothHands": true,
   "reach": 0.404,
   "height": 0.253,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.404
    },
    {
     "phase": 0.5,
     "reach": 0.399
    },
    {
     "phase": 1,
     "reach": 0.388
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
     "reach": 0.591
    },
    {
     "phase": 0.5,
     "reach": 0.579
    },
    {
     "phase": 1,
     "reach": 0.559
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
     "reach": 0.544
    },
    {
     "phase": 0.5,
     "reach": 0.483
    },
    {
     "phase": 1,
     "reach": 0.405
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
   "reach": 0.661,
   "height": 0.062,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.661
    },
    {
     "phase": 0.5,
     "reach": 0.657
    },
    {
     "phase": 1,
     "reach": 0.643
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
   "reach": 0.601,
   "height": 0.402,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.601
    },
    {
     "phase": 0.5,
     "reach": 0.593
    },
    {
     "phase": 1,
     "reach": 0.585
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
     "reach": 0.542
    },
    {
     "phase": 0.5,
     "reach": 0.532
    },
    {
     "phase": 1,
     "reach": 0.493
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
     "reach": 0.615
    },
    {
     "phase": 0.5,
     "reach": 0.608
    },
    {
     "phase": 1,
     "reach": 0.596
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
     "reach": 0.388
    },
    {
     "phase": 0.5,
     "reach": 0.368
    },
    {
     "phase": 1,
     "reach": 0.372
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
     "reach": 0.45
    },
    {
     "phase": 0.5,
     "reach": 0.413
    },
    {
     "phase": 1,
     "reach": 0.355
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
   "reach": 0.445,
   "height": 0.099,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.445
    },
    {
     "phase": 0.5,
     "reach": 0.442
    },
    {
     "phase": 1,
     "reach": 0.434
    }
   ],
   "status": "fix",
   "issues": [
    "head が 0.037m 先に出ている"
   ],
   "gesture": "shadowSliceLow",
   "motifContact": 0.33
  },
  "crouch_heavy": {
   "contact": 0.45,
   "contactEnd": 0.51,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.481,
   "height": 0.112,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.481
    },
    {
     "phase": 0.5,
     "reach": 0.479
    },
    {
     "phase": 1,
     "reach": 0.467
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
     "reach": 0.342
    },
    {
     "phase": 0.5,
     "reach": 0.314
    },
    {
     "phase": 1,
     "reach": 0.27
    }
   ],
   "status": "ok",
   "gesture": "risingKnifeL",
   "motifContact": 0.32
  },
  "air_heavy": {
   "contact": 0.475,
   "contactEnd": 0.575,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.412,
   "height": 0.171,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.412
    },
    {
     "phase": 0.5,
     "reach": 0.41
    },
    {
     "phase": 1,
     "reach": 0.396
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
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.297,
   "height": 0.392,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.297
    },
    {
     "phase": 0.5,
     "reach": 0.284
    },
    {
     "phase": 1,
     "reach": 0.27
    }
   ],
   "status": "fix",
   "issues": [
    "head が 0.128m 先に出ている"
   ],
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
     "reach": 0.656
    },
    {
     "phase": 0.5,
     "reach": 0.643
    },
    {
     "phase": 1,
     "reach": 0.612
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
   "reach": 0.554,
   "height": -0.014,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.554
    },
    {
     "phase": 0.5,
     "reach": 0.538
    },
    {
     "phase": 1,
     "reach": 0.508
    }
   ],
   "status": "fix",
   "issues": [
    "打撃部位が床下 -0.014m"
   ],
   "gesture": "tailTipSnap",
   "motifContact": 0.36
  },
  "crouch_heavy": {
   "contact": 0.5,
   "contactEnd": 0.56,
   "attackPart": "tail",
   "attackBone": "tail",
   "reach": 0.637,
   "height": 0.001,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.637
    },
    {
     "phase": 0.5,
     "reach": 0.633
    },
    {
     "phase": 1,
     "reach": 0.615
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
   "height": 0.305,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.551
    },
    {
     "phase": 0.5,
     "reach": 0.53
    },
    {
     "phase": 1,
     "reach": 0.497
    }
   ],
   "status": "ok",
   "gesture": "airTailFlick",
   "motifContact": 0.34
  },
  "air_heavy": {
   "contact": 0.3,
   "contactEnd": 0.36,
   "attackPart": "armR",
   "attackBone": "paw.R",
   "reach": 0.226,
   "height": 0.236,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.226
    },
    {
     "phase": 0.5,
     "reach": 0.199
    },
    {
     "phase": 1,
     "reach": 0.162
    }
   ],
   "status": "fix",
   "issues": [
    "head が 0.15m 先に出ている",
    "打撃部位の前進が 0.071m しかない"
   ],
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
   "reach": 0.373,
   "height": 0.354,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.373
    },
    {
     "phase": 0.5,
     "reach": 0.36
    },
    {
     "phase": 1,
     "reach": 0.343
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
     "reach": 0.44
    },
    {
     "phase": 0.5,
     "reach": 0.392
    },
    {
     "phase": 1,
     "reach": 0.342
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
   "reach": 0.453,
   "height": 0.153,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.453
    },
    {
     "phase": 0.5,
     "reach": 0.451
    },
    {
     "phase": 1,
     "reach": 0.445
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
   "reach": 0.507,
   "height": 0.265,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.507
    },
    {
     "phase": 0.5,
     "reach": 0.502
    },
    {
     "phase": 1,
     "reach": 0.49
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
   "reach": 0.332,
   "height": 0.104,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.332
    },
    {
     "phase": 0.5,
     "reach": 0.322
    },
    {
     "phase": 1,
     "reach": 0.31
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
   "reach": 0.272,
   "height": 0.19,
   "activeReach": [
    {
     "phase": 0,
     "reach": 0.272
    },
    {
     "phase": 0.5,
     "reach": 0.265
    },
    {
     "phase": 1,
     "reach": 0.256
    }
   ],
   "status": "ok",
   "gesture": "darkSpinKick",
   "motifContact": 0.47
  }
 }
});
