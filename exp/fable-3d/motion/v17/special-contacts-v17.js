// v17 P3 必殺 27 本の接触同期データとキュー（Claude 制作・実測）。clip は motion/v17/<id>_specials_v17.glb のクリップ名。
// 生成: motion/v17/tools/contacts_exact_v17.mjs — 手で編集しない。実ゲームのページ（WebGL）で、元 GLB のスキンメッシュを**正確なクリップ時刻**に置いて全頂点から実測（補間なし）。
// reach = 攻撃側 root から打撃部位表面の最前頂点までの前方距離 [m]（相手の hurt radius は含まない）。
// height = その頂点の高さ [m]。root 基準の**符号付き**で、0 に丸めていない（空中技で尾や足が root より下へ来る演技は負）。判定側は strikeY = a.y + height。
// activeReach[i] = Battle の持続フレーム i（phase = i/(active-1)、battleActive 枚）に対応する正確時刻の reach / height。
// contact / contactEnd = クリップ正規化時刻。再生契約は v15.1 と同じ（発生 F → contact、持続の最終 F → contactEnd）。
// 必殺はクリップが素の時間なので、持続フレーム i の時刻は (接触フレーム + i)/60 秒。reachPeak は持続中の最大。対空は strikeAxis:'upward' で heightPeak（打撃部位のいちばん高い頂点）を見る。
// 飛び道具 6 本: socket = 接触（弾の発生）時刻の fx_anchor 骨の位置 {forward, height}（リグ root 座標。前方 = 向き、高さ = root から）。reach は放つ手・尾の表面で、弾の射程でも発射点でもない。
// cueTrack[] = {at: クリップ秒, type: sfx|vfx|shake, key, trigger: movement|contact, on: always|hit|guard, bone?}。movement は時刻で必ず鳴らす動作音。contact は時刻では鳴らさず Battle の実ヒット／ガードに委譲。
// referenceFrames は現行 balance.js の発生・持続・硬直の写し（変更していない）。hitstopSuggest は提案値。
export const SPECIAL_CONTACTS_V17_VERSION="v17-p3-specials-1-exact";
export const SPECIAL_CONTACTS_V17=Object.freeze({
 "moguzo": {
  "s1": {
   "clip": "s1_v17",
   "name": "大地の波",
   "contact": 0.3714,
   "contactEnd": 0.4,
   "contactSeconds": 0.2167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.5264,
   "height": 0.1669,
   "battleActive": 2,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.5264,
     "height": 0.1669,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 1,
     "reach": 0.4746,
     "height": 0.2964,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "projectile",
   "weight": "mid",
   "role": "中距離の牽制",
   "frames": 35,
   "reachPeak": 0.5264,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.3396,
   "reachMeans": "surface of the releasing limb (not projectile range; see socket)",
   "socket": {
    "bone": "pawR",
    "forward": 0.4688,
    "height": 0.1223,
    "at": "contact (projectile spawn frame)",
    "space": "rig root: forward = facing, height above root"
   },
   "referenceFrames": {
    "startup": 13,
    "active": 2,
    "recovery": 20
   },
   "projectileSpawnFrame": 13,
   "cueTrack": [
    {
     "at": 0.2167,
     "type": "sfx",
     "key": "special",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2167,
     "type": "vfx",
     "key": "special",
     "trigger": "movement",
     "on": "always",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "昇り拳",
   "contact": 0.15,
   "contactEnd": 0.325,
   "contactSeconds": 0.1,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.2215,
   "height": 0.7998,
   "battleActive": 8,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.2215,
     "height": 0.7998,
     "part": "armR"
    },
    {
     "phase": 0.1429,
     "frame": 1,
     "reach": 0.2016,
     "height": 0.8146,
     "part": "armR"
    },
    {
     "phase": 0.2857,
     "frame": 2,
     "reach": 0.1729,
     "height": 0.8251,
     "part": "armR"
    },
    {
     "phase": 0.4286,
     "frame": 3,
     "reach": 0.1402,
     "height": 0.8313,
     "part": "armR"
    },
    {
     "phase": 0.5714,
     "frame": 4,
     "reach": 0.1077,
     "height": 0.8334,
     "part": "armR"
    },
    {
     "phase": 0.7143,
     "frame": 5,
     "reach": 0.0783,
     "height": 0.8334,
     "part": "armR"
    },
    {
     "phase": 0.8571,
     "frame": 6,
     "reach": 0.0547,
     "height": 0.8334,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 7,
     "reach": 0.0394,
     "height": 0.8334,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "mid",
   "role": "切り返し対空",
   "frames": 40,
   "reachPeak": 0.2215,
   "reachPeakFrame": 0,
   "strikeAxis": "upward",
   "heightPeak": 0.8783,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 6,
    "active": 8,
    "recovery": 26
   },
   "airborneFrames": [
    5,
    26
   ],
   "cueTrack": [
    {
     "at": 0.05,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.0833,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    },
    {
     "at": 0.4333,
     "type": "sfx",
     "key": "clinch",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.4333,
     "type": "vfx",
     "key": "roar",
     "trigger": "movement",
     "on": "always",
     "bone": "root_ground"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "地走り",
   "contact": 0.3333,
   "contactEnd": 0.4444,
   "contactSeconds": 0.2,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.4896,
   "height": 0.3691,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4896,
     "height": 0.3691,
     "part": "armL"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.4894,
     "height": 0.3726,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.4892,
     "height": 0.3761,
     "part": "armL"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.4889,
     "height": 0.3796,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.4887,
     "height": 0.3831,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "rush",
   "weight": "mid",
   "role": "前進圧力",
   "frames": 36,
   "reachPeak": 0.4896,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.4321,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 12,
    "active": 5,
    "recovery": 19
   },
   "cueTrack": [
    {
     "at": 0.15,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.2,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.2,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.2,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.2,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  }
 },
 "pisuke": {
  "s1": {
   "clip": "s1_v17",
   "name": "風の気弾",
   "contact": 0.3793,
   "contactEnd": 0.3793,
   "contactSeconds": 0.1833,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.3455,
   "height": 0.2217,
   "battleActive": 1,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3455,
     "height": 0.2217,
     "part": "legR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "projectile",
   "weight": "light",
   "role": "軽い飛び道具",
   "frames": 29,
   "reachPeak": 0.3455,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.275,
   "reachMeans": "surface of the releasing limb (not projectile range; see socket)",
   "socket": {
    "bone": "footR",
    "forward": 0.2561,
    "height": 0.2111,
    "at": "contact (projectile spawn frame)",
    "space": "rig root: forward = facing, height above root"
   },
   "referenceFrames": {
    "startup": 11,
    "active": 1,
    "recovery": 17
   },
   "projectileSpawnFrame": 11,
   "cueTrack": [
    {
     "at": 0.1833,
     "type": "sfx",
     "key": "special",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1833,
     "type": "vfx",
     "key": "special",
     "trigger": "movement",
     "on": "always",
     "bone": "footR"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "空牙蹴り",
   "contact": 0.1667,
   "contactEnd": 0.3611,
   "contactSeconds": 0.1,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.1858,
   "height": 0.4363,
   "battleActive": 8,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.1858,
     "height": 0.4363,
     "part": "legR"
    },
    {
     "phase": 0.1429,
     "frame": 1,
     "reach": 0.1862,
     "height": 0.4474,
     "part": "legR"
    },
    {
     "phase": 0.2857,
     "frame": 2,
     "reach": 0.1852,
     "height": 0.4512,
     "part": "legR"
    },
    {
     "phase": 0.4286,
     "frame": 3,
     "reach": 0.184,
     "height": 0.449,
     "part": "legR"
    },
    {
     "phase": 0.5714,
     "frame": 4,
     "reach": 0.1835,
     "height": 0.4482,
     "part": "legR"
    },
    {
     "phase": 0.7143,
     "frame": 5,
     "reach": 0.1835,
     "height": 0.4482,
     "part": "legR"
    },
    {
     "phase": 0.8571,
     "frame": 6,
     "reach": 0.1835,
     "height": 0.4482,
     "part": "legR"
    },
    {
     "phase": 1,
     "frame": 7,
     "reach": 0.1835,
     "height": 0.4482,
     "part": "legR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "light",
   "role": "上方向への迎撃",
   "frames": 36,
   "reachPeak": 0.1862,
   "reachPeakFrame": 1,
   "strikeAxis": "upward",
   "heightPeak": 0.6726,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 6,
    "active": 8,
    "recovery": 22
   },
   "airborneFrames": [
    5,
    27
   ],
   "cueTrack": [
    {
     "at": 0.05,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.0833,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "footR"
    },
    {
     "at": 0.1,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "footR"
    },
    {
     "at": 0.45,
     "type": "sfx",
     "key": "clinch",
     "trigger": "movement",
     "on": "always"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "連脚",
   "contact": 0.1944,
   "contactEnd": 0.4167,
   "contactSeconds": 0.1167,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.3996,
   "height": 0.1293,
   "battleActive": 9,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3996,
     "height": 0.1293,
     "part": "legR"
    },
    {
     "phase": 0.125,
     "frame": 1,
     "reach": 0.3996,
     "height": 0.1293,
     "part": "legR"
    },
    {
     "phase": 0.25,
     "frame": 2,
     "reach": 0.3996,
     "height": 0.1293,
     "part": "legR"
    },
    {
     "phase": 0.375,
     "frame": 3,
     "reach": 0.317,
     "height": 0.1249,
     "part": "legR"
    },
    {
     "phase": 0.5,
     "frame": 4,
     "reach": 0.2199,
     "height": 0.1272,
     "part": "legR"
    },
    {
     "phase": 0.625,
     "frame": 5,
     "reach": 0.2644,
     "height": 0.1749,
     "part": "legR"
    },
    {
     "phase": 0.75,
     "frame": 6,
     "reach": 0.345,
     "height": 0.3361,
     "part": "legR"
    },
    {
     "phase": 0.875,
     "frame": 7,
     "reach": 0.345,
     "height": 0.3361,
     "part": "legR"
    },
    {
     "phase": 1,
     "frame": 8,
     "reach": 0.345,
     "height": 0.3361,
     "part": "legR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "rush",
   "weight": "light",
   "role": "前進連撃",
   "frames": 36,
   "reachPeak": 0.3996,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.3411,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 7,
    "active": 9,
    "recovery": 20
   },
   "cueTrack": [
    {
     "at": 0.0667,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1167,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "footR"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1167,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "footR"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  }
 },
 "godan": {
  "s1": {
   "clip": "s1_v17",
   "name": "地割り",
   "contact": 0.3889,
   "contactEnd": 0.463,
   "contactSeconds": 0.35,
   "attackPart": "legR",
   "attackLimb": "footR",
   "reach": 0.297,
   "height": 0.0079,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.297,
     "height": 0.0079,
     "part": "legR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.297,
     "height": 0.0079,
     "part": "legR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.297,
     "height": 0.0079,
     "part": "legR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.297,
     "height": 0.0079,
     "part": "legR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.297,
     "height": 0.0079,
     "part": "legR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "strike",
   "weight": "heavy",
   "role": "遅い下段大技",
   "frames": 54,
   "reachPeak": 0.297,
   "reachPeakFrame": 0,
   "strikeAxis": "upward",
   "heightPeak": 0.1934,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 21,
    "active": 5,
    "recovery": 28
   },
   "cueTrack": [
    {
     "at": 0,
     "type": "sfx",
     "key": "grunt",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.3,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.35,
     "type": "sfx",
     "key": "crash",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.35,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "footR"
    },
    {
     "at": 0.35,
     "type": "shake",
     "key": 0.016,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.35,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.35,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "footR"
    }
   ],
   "hitstopSuggest": {
    "hit": 9,
    "guard": 5
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "岩砕き",
   "contact": 0.2245,
   "contactEnd": 0.3469,
   "contactSeconds": 0.1833,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.1723,
   "height": 0.5815,
   "battleActive": 7,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.1723,
     "height": 0.5815,
     "part": "armL"
    },
    {
     "phase": 0.1667,
     "frame": 1,
     "reach": 0.1717,
     "height": 0.5826,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 2,
     "reach": 0.1712,
     "height": 0.5837,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 3,
     "reach": 0.1707,
     "height": 0.5849,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 4,
     "reach": 0.1702,
     "height": 0.586,
     "part": "armL"
    },
    {
     "phase": 0.8333,
     "frame": 5,
     "reach": 0.1697,
     "height": 0.5871,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 6,
     "reach": 0.1692,
     "height": 0.5882,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "heavy",
   "role": "装甲つき対空",
   "frames": 49,
   "reachPeak": 0.1723,
   "reachPeakFrame": 0,
   "strikeAxis": "upward",
   "heightPeak": 0.7671,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 11,
    "active": 7,
    "recovery": 31
   },
   "cueTrack": [
    {
     "at": 0,
     "type": "sfx",
     "key": "grunt",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1833,
     "type": "sfx",
     "key": "crash",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1833,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1833,
     "type": "shake",
     "key": 0.016,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1833,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1833,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 9,
    "guard": 5
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "肩当て突進",
   "contact": 0.3158,
   "contactEnd": 0.4211,
   "contactSeconds": 0.3,
   "attackPart": "body",
   "attackLimb": "shoulderL",
   "reach": 0.3893,
   "height": 0.2644,
   "battleActive": 7,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.3893,
     "height": 0.2644,
     "part": "body"
    },
    {
     "phase": 0.1667,
     "frame": 1,
     "reach": 0.3893,
     "height": 0.2644,
     "part": "body"
    },
    {
     "phase": 0.3333,
     "frame": 2,
     "reach": 0.3893,
     "height": 0.2644,
     "part": "body"
    },
    {
     "phase": 0.5,
     "frame": 3,
     "reach": 0.3893,
     "height": 0.2644,
     "part": "body"
    },
    {
     "phase": 0.6667,
     "frame": 4,
     "reach": 0.3893,
     "height": 0.2644,
     "part": "body"
    },
    {
     "phase": 0.8333,
     "frame": 5,
     "reach": 0.3893,
     "height": 0.2644,
     "part": "body"
    },
    {
     "phase": 1,
     "frame": 6,
     "reach": 0.3893,
     "height": 0.2644,
     "part": "body"
    }
   ],
   "status": "ok",
   "origin": "v17 revised",
   "kind": "rush",
   "weight": "heavy",
   "role": "高リスク突進",
   "frames": 57,
   "reachPeak": 0.3893,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.4754,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 18,
    "active": 7,
    "recovery": 32
   },
   "cueTrack": [
    {
     "at": 0,
     "type": "sfx",
     "key": "grunt",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.25,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.3,
     "type": "sfx",
     "key": "crash",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.3,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "shoulderL"
    },
    {
     "at": 0.3,
     "type": "shake",
     "key": 0.016,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.3,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.3,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "shoulderL"
    }
   ],
   "hitstopSuggest": {
    "hit": 9,
    "guard": 5
   }
  }
 },
 "hakuma": {
  "s1": {
   "clip": "s1_v17",
   "name": "雪壁掌",
   "contact": 0.2821,
   "contactEnd": 0.4103,
   "contactSeconds": 0.1833,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4883,
   "height": 0.4212,
   "battleActive": 6,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4883,
     "height": 0.4212,
     "part": "armR"
    },
    {
     "phase": 0.2,
     "frame": 1,
     "reach": 0.4909,
     "height": 0.4201,
     "part": "armR"
    },
    {
     "phase": 0.4,
     "frame": 2,
     "reach": 0.4934,
     "height": 0.4189,
     "part": "armR"
    },
    {
     "phase": 0.6,
     "frame": 3,
     "reach": 0.496,
     "height": 0.4178,
     "part": "armR"
    },
    {
     "phase": 0.8,
     "frame": 4,
     "reach": 0.4985,
     "height": 0.4166,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 5,
     "reach": 0.501,
     "height": 0.4154,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "strike",
   "weight": "mid",
   "role": "近中距離の押し返し",
   "frames": 39,
   "reachPeak": 0.501,
   "reachPeakFrame": 5,
   "strikeAxis": "forward",
   "heightPeak": 0.4666,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 11,
    "active": 6,
    "recovery": 22
   },
   "cueTrack": [
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1833,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1833,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1833,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1833,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1833,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "白峰対空",
   "contact": 0.2051,
   "contactEnd": 0.359,
   "contactSeconds": 0.1333,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.2211,
   "height": 0.6224,
   "battleActive": 7,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.2211,
     "height": 0.6224,
     "part": "armR"
    },
    {
     "phase": 0.1667,
     "frame": 1,
     "reach": 0.2213,
     "height": 0.6235,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 2,
     "reach": 0.2216,
     "height": 0.6246,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 3,
     "reach": 0.2219,
     "height": 0.6256,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 4,
     "reach": 0.2222,
     "height": 0.6267,
     "part": "armR"
    },
    {
     "phase": 0.8333,
     "frame": 5,
     "reach": 0.2225,
     "height": 0.6278,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 6,
     "reach": 0.2229,
     "height": 0.6288,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "mid",
   "role": "受ける対空",
   "frames": 39,
   "reachPeak": 0.2229,
   "reachPeakFrame": 6,
   "strikeAxis": "upward",
   "heightPeak": 0.7582,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 8,
    "active": 7,
    "recovery": 24
   },
   "cueTrack": [
    {
     "at": 0.0833,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1333,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1333,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1333,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "連続突っ張り",
   "contact": 0.2609,
   "contactEnd": 0.4348,
   "contactSeconds": 0.2,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.4927,
   "height": 0.4235,
   "battleActive": 9,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4927,
     "height": 0.4235,
     "part": "armL"
    },
    {
     "phase": 0.125,
     "frame": 1,
     "reach": 0.4927,
     "height": 0.4235,
     "part": "armL"
    },
    {
     "phase": 0.25,
     "frame": 2,
     "reach": 0.4927,
     "height": 0.4235,
     "part": "armL"
    },
    {
     "phase": 0.375,
     "frame": 3,
     "reach": 0.4927,
     "height": 0.4235,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 4,
     "reach": 0.3679,
     "height": 0.454,
     "part": "armL"
    },
    {
     "phase": 0.625,
     "frame": 5,
     "reach": 0.4953,
     "height": 0.4509,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 6,
     "reach": 0.4953,
     "height": 0.4509,
     "part": "armR"
    },
    {
     "phase": 0.875,
     "frame": 7,
     "reach": 0.4953,
     "height": 0.4509,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 8,
     "reach": 0.4624,
     "height": 0.4015,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "rush",
   "weight": "mid",
   "role": "ライン回復",
   "frames": 46,
   "reachPeak": 0.4953,
   "reachPeakFrame": 5,
   "strikeAxis": "forward",
   "heightPeak": 0.5131,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 12,
    "active": 9,
    "recovery": 25
   },
   "cueTrack": [
    {
     "at": 0.15,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.2,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.2,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.2,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.2,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  }
 },
 "chirka": {
  "s1": {
   "clip": "s1_v17",
   "name": "だまし突き",
   "contact": 0.3611,
   "contactEnd": 0.4444,
   "contactSeconds": 0.2167,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.449,
   "height": 0.2104,
   "battleActive": 4,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.449,
     "height": 0.2104,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 1,
     "reach": 0.4503,
     "height": 0.2079,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 2,
     "reach": 0.4515,
     "height": 0.2055,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 3,
     "reach": 0.4527,
     "height": 0.203,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "strike",
   "weight": "light",
   "role": "可変タイミング",
   "frames": 36,
   "reachPeak": 0.4527,
   "reachPeakFrame": 3,
   "strikeAxis": "forward",
   "heightPeak": 0.3046,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 13,
    "active": 4,
    "recovery": 19
   },
   "cueTrack": [
    {
     "at": 0.1667,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2167,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.2167,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawL"
    },
    {
     "at": 0.2167,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.2167,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawL"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "跳ね爪",
   "contact": 0.2,
   "contactEnd": 0.35,
   "contactSeconds": 0.1333,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.2148,
   "height": 0.6675,
   "battleActive": 7,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.2148,
     "height": 0.6675,
     "part": "armR"
    },
    {
     "phase": 0.1667,
     "frame": 1,
     "reach": 0.2264,
     "height": 0.676,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 2,
     "reach": 0.2078,
     "height": 0.7079,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 3,
     "reach": 0.1606,
     "height": 0.721,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 4,
     "reach": 0.1102,
     "height": 0.6329,
     "part": "armR"
    },
    {
     "phase": 0.8333,
     "frame": 5,
     "reach": 0.0669,
     "height": 0.6334,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 6,
     "reach": 0.0175,
     "height": 0.6332,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "light",
   "role": "対空",
   "frames": 40,
   "reachPeak": 0.2264,
   "reachPeakFrame": 1,
   "strikeAxis": "upward",
   "heightPeak": 0.8572,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 8,
    "active": 7,
    "recovery": 25
   },
   "airborneFrames": [
    6,
    26
   ],
   "cueTrack": [
    {
     "at": 0.0833,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1333,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1333,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    },
    {
     "at": 0.4333,
     "type": "sfx",
     "key": "clinch",
     "trigger": "movement",
     "on": "always"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "影引き爪",
   "contact": 0.325,
   "contactEnd": 0.425,
   "contactSeconds": 0.2167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4941,
   "height": 0.2222,
   "battleActive": 5,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4941,
     "height": 0.2222,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 1,
     "reach": 0.4941,
     "height": 0.2222,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 2,
     "reach": 0.4941,
     "height": 0.2222,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 3,
     "reach": 0.4941,
     "height": 0.2222,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 4,
     "reach": 0.4941,
     "height": 0.2222,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v17 revised",
   "kind": "rush",
   "weight": "mid",
   "role": "裏をかく前進",
   "frames": 40,
   "reachPeak": 0.4941,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.3135,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 13,
    "active": 5,
    "recovery": 22
   },
   "cueTrack": [
    {
     "at": 0.1667,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2167,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.2167,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.2167,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.2167,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.2167,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  }
 },
 "takimaru": {
  "s1": {
   "clip": "s1_v17",
   "name": "大地走り",
   "contact": 0.3922,
   "contactEnd": 0.3922,
   "contactSeconds": 0.3333,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.485,
   "height": 0.1048,
   "battleActive": 1,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.485,
     "height": 0.1048,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "projectile",
   "weight": "mid",
   "role": "掴み接近の布石",
   "frames": 51,
   "reachPeak": 0.485,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.276,
   "reachMeans": "surface of the releasing limb (not projectile range; see socket)",
   "socket": {
    "bone": "pawR",
    "forward": 0.3916,
    "height": 0.0103,
    "at": "contact (projectile spawn frame)",
    "space": "rig root: forward = facing, height above root"
   },
   "referenceFrames": {
    "startup": 20,
    "active": 1,
    "recovery": 30
   },
   "airborneFrames": [
    9,
    19
   ],
   "projectileSpawnFrame": 20,
   "cueTrack": [
    {
     "at": 0.15,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.3167,
     "type": "sfx",
     "key": "clinch",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.3167,
     "type": "vfx",
     "key": "roar",
     "trigger": "movement",
     "on": "always",
     "bone": "root_ground"
    },
    {
     "at": 0.3333,
     "type": "sfx",
     "key": "special",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.3333,
     "type": "vfx",
     "key": "special",
     "trigger": "movement",
     "on": "always",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "抱え上げ",
   "contact": 0.2273,
   "contactEnd": 0.3636,
   "contactSeconds": 0.1667,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.0151,
   "height": 0.5121,
   "battleActive": 7,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.0151,
     "height": 0.5121,
     "part": "armL"
    },
    {
     "phase": 0.1667,
     "frame": 1,
     "reach": 0.0136,
     "height": 0.5126,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 2,
     "reach": 0.012,
     "height": 0.5131,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 3,
     "reach": 0.0105,
     "height": 0.5135,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 4,
     "reach": 0.009,
     "height": 0.514,
     "part": "armL"
    },
    {
     "phase": 0.8333,
     "frame": 5,
     "reach": 0.0075,
     "height": 0.5144,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 6,
     "reach": 0.006,
     "height": 0.5148,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "heavy",
   "role": "迎撃／掴み距離",
   "frames": 44,
   "reachPeak": 0.0151,
   "reachPeakFrame": 0,
   "strikeAxis": "upward",
   "heightPeak": 0.8393,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 10,
    "active": 7,
    "recovery": 27
   },
   "cueTrack": [
    {
     "at": 0,
     "type": "sfx",
     "key": "grunt",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1667,
     "type": "sfx",
     "key": "crash",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1667,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1667,
     "type": "shake",
     "key": 0.016,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1667,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1667,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 9,
    "guard": 5
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "抱え込み",
   "contact": 0.1837,
   "contactEnd": 0.2245,
   "contactSeconds": 0.15,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.6487,
   "height": 0.3233,
   "battleActive": 3,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.6487,
     "height": 0.3233,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 1,
     "reach": 0.6487,
     "height": 0.3233,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 2,
     "reach": 0.6487,
     "height": 0.3233,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "grab",
   "weight": "heavy",
   "role": "近距離の拘束",
   "frames": 49,
   "reachPeak": 0.6487,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.4559,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 9,
    "active": 3,
    "recovery": 37
   },
   "cueTrack": [
    {
     "at": 0,
     "type": "sfx",
     "key": "grunt",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.15,
     "type": "sfx",
     "key": "clinch",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.15,
     "type": "vfx",
     "key": "clinch",
     "trigger": "contact",
     "on": "hit",
     "bone": "chest"
    },
    {
     "at": 0.15,
     "type": "shake",
     "key": 0.016,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.15,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.15,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "chest"
    }
   ],
   "hitstopSuggest": {
    "hit": 9,
    "guard": 5
   }
  }
 },
 "yomikage": {
  "s1": {
   "clip": "s1_v17",
   "name": "残月の波",
   "contact": 0.3514,
   "contactEnd": 0.3514,
   "contactSeconds": 0.2167,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.301,
   "height": 0.4027,
   "battleActive": 1,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.301,
     "height": 0.4027,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "projectile",
   "weight": "light",
   "role": "距離を整える弾",
   "frames": 37,
   "reachPeak": 0.301,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.433,
   "reachMeans": "surface of the releasing limb (not projectile range; see socket)",
   "socket": {
    "bone": "pawR",
    "forward": 0.2356,
    "height": 0.3937,
    "at": "contact (projectile spawn frame)",
    "space": "rig root: forward = facing, height above root"
   },
   "referenceFrames": {
    "startup": 13,
    "active": 1,
    "recovery": 23
   },
   "projectileSpawnFrame": 13,
   "cueTrack": [
    {
     "at": 0.2167,
     "type": "sfx",
     "key": "special",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2167,
     "type": "vfx",
     "key": "special",
     "trigger": "movement",
     "on": "always",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "昇り肘",
   "contact": 0.2,
   "contactEnd": 0.35,
   "contactSeconds": 0.1333,
   "attackPart": "armR",
   "attackLimb": "elbowR",
   "reach": 0.1432,
   "height": 0.531,
   "battleActive": 7,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.1432,
     "height": 0.531,
     "part": "armR"
    },
    {
     "phase": 0.1667,
     "frame": 1,
     "reach": 0.1431,
     "height": 0.5327,
     "part": "armR"
    },
    {
     "phase": 0.3333,
     "frame": 2,
     "reach": 0.1429,
     "height": 0.5343,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 3,
     "reach": 0.1427,
     "height": 0.5359,
     "part": "armR"
    },
    {
     "phase": 0.6667,
     "frame": 4,
     "reach": 0.1425,
     "height": 0.5375,
     "part": "armR"
    },
    {
     "phase": 0.8333,
     "frame": 5,
     "reach": 0.1423,
     "height": 0.5391,
     "part": "armR"
    },
    {
     "phase": 1,
     "frame": 6,
     "reach": 0.1421,
     "height": 0.5408,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "mid",
   "role": "対空",
   "frames": 40,
   "reachPeak": 0.1432,
   "reachPeakFrame": 0,
   "strikeAxis": "upward",
   "heightPeak": 0.5925,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 8,
    "active": 7,
    "recovery": 25
   },
   "cueTrack": [
    {
     "at": 0.0833,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1333,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1333,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1333,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1333,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "受け返し",
   "contact": 0.1373,
   "contactEnd": 0.3725,
   "contactSeconds": 0.1167,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.1642,
   "height": 0.4386,
   "battleActive": 13,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.1642,
     "height": 0.4386,
     "part": "armL"
    },
    {
     "phase": 0.0833,
     "frame": 1,
     "reach": 0.1642,
     "height": 0.4385,
     "part": "armL"
    },
    {
     "phase": 0.1667,
     "frame": 2,
     "reach": 0.1642,
     "height": 0.4383,
     "part": "armL"
    },
    {
     "phase": 0.25,
     "frame": 3,
     "reach": 0.1642,
     "height": 0.4381,
     "part": "armL"
    },
    {
     "phase": 0.3333,
     "frame": 4,
     "reach": 0.1642,
     "height": 0.4379,
     "part": "armL"
    },
    {
     "phase": 0.4167,
     "frame": 5,
     "reach": 0.1642,
     "height": 0.4377,
     "part": "armL"
    },
    {
     "phase": 0.5,
     "frame": 6,
     "reach": 0.1642,
     "height": 0.4376,
     "part": "armL"
    },
    {
     "phase": 0.5833,
     "frame": 7,
     "reach": 0.1642,
     "height": 0.4374,
     "part": "armL"
    },
    {
     "phase": 0.6667,
     "frame": 8,
     "reach": 0.1642,
     "height": 0.4372,
     "part": "armL"
    },
    {
     "phase": 0.75,
     "frame": 9,
     "reach": 0.1642,
     "height": 0.437,
     "part": "armL"
    },
    {
     "phase": 0.8333,
     "frame": 10,
     "reach": 0.1642,
     "height": 0.4368,
     "part": "armL"
    },
    {
     "phase": 0.9167,
     "frame": 11,
     "reach": 0.1642,
     "height": 0.4366,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 12,
     "reach": 0.1642,
     "height": 0.4365,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "counter",
   "weight": "mid",
   "role": "読み勝つ当て身",
   "frames": 51,
   "reachPeak": 0.1642,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.5548,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 7,
    "active": 13,
    "recovery": 31
   },
   "cueTrack": [
    {
     "at": 0,
     "type": "sfx",
     "key": "chime",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.0667,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1167,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawL"
    },
    {
     "at": 0.1167,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1167,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawL"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "counter",
     "trigger": "contact",
     "on": "hit"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  }
 },
 "bullet": {
  "s1": {
   "clip": "s1_v17",
   "name": "木の実弾",
   "contact": 0.3696,
   "contactEnd": 0.3696,
   "contactSeconds": 0.2833,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": -0.0825,
   "height": 0.2343,
   "battleActive": 1,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": -0.0825,
     "height": 0.2343,
     "part": "tail"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "projectile",
   "weight": "mid",
   "role": "長距離牽制",
   "frames": 46,
   "reachPeak": -0.0825,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.3831,
   "reachMeans": "surface of the releasing limb (not projectile range; see socket)",
   "socket": {
    "bone": "tail_03",
    "forward": -0.2386,
    "height": 0.2762,
    "at": "contact (projectile spawn frame)",
    "space": "rig root: forward = facing, height above root"
   },
   "referenceFrames": {
    "startup": 17,
    "active": 1,
    "recovery": 28
   },
   "projectileSpawnFrame": 17,
   "cueTrack": [
    {
     "at": 0.2833,
     "type": "sfx",
     "key": "special",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2833,
     "type": "vfx",
     "key": "special",
     "trigger": "movement",
     "on": "always",
     "bone": "tail_03"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "尾跳ね",
   "contact": 0.2093,
   "contactEnd": 0.3488,
   "contactSeconds": 0.15,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": -0.1041,
   "height": 0.3804,
   "battleActive": 7,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": -0.1041,
     "height": 0.3804,
     "part": "tail"
    },
    {
     "phase": 0.1667,
     "frame": 1,
     "reach": -0.088,
     "height": 0.389,
     "part": "tail"
    },
    {
     "phase": 0.3333,
     "frame": 2,
     "reach": -0.0834,
     "height": 0.3859,
     "part": "tail"
    },
    {
     "phase": 0.5,
     "frame": 3,
     "reach": -0.0828,
     "height": 0.3861,
     "part": "tail"
    },
    {
     "phase": 0.6667,
     "frame": 4,
     "reach": -0.0613,
     "height": 0.6576,
     "part": "tail"
    },
    {
     "phase": 0.8333,
     "frame": 5,
     "reach": -0.0116,
     "height": 0.7325,
     "part": "tail"
    },
    {
     "phase": 1,
     "frame": 6,
     "reach": 0.041,
     "height": 0.7857,
     "part": "tail"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "mid",
   "role": "長尾対空",
   "frames": 43,
   "reachPeak": 0.041,
   "reachPeakFrame": 6,
   "strikeAxis": "upward",
   "heightPeak": 0.8683,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 9,
    "active": 7,
    "recovery": 27
   },
   "airborneFrames": [
    7,
    28
   ],
   "cueTrack": [
    {
     "at": 0.1,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.15,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.15,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "tail_03"
    },
    {
     "at": 0.15,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.15,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.15,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "tail_03"
    },
    {
     "at": 0.4667,
     "type": "sfx",
     "key": "clinch",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.4667,
     "type": "vfx",
     "key": "roar",
     "trigger": "movement",
     "on": "always",
     "bone": "root_ground"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "尾薙ぎ",
   "contact": 0.3958,
   "contactEnd": 0.5,
   "contactSeconds": 0.3167,
   "attackPart": "tail",
   "attackLimb": "tail",
   "reach": 0.4732,
   "height": 0.2167,
   "battleActive": 6,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4732,
     "height": 0.2167,
     "part": "tail"
    },
    {
     "phase": 0.2,
     "frame": 1,
     "reach": 0.5361,
     "height": 0.2265,
     "part": "tail"
    },
    {
     "phase": 0.4,
     "frame": 2,
     "reach": 0.5955,
     "height": 0.2358,
     "part": "tail"
    },
    {
     "phase": 0.6,
     "frame": 3,
     "reach": 0.6399,
     "height": 0.2559,
     "part": "tail"
    },
    {
     "phase": 0.8,
     "frame": 4,
     "reach": 0.6762,
     "height": 0.2477,
     "part": "tail"
    },
    {
     "phase": 1,
     "frame": 5,
     "reach": 0.6821,
     "height": 0.2534,
     "part": "tail"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "strike",
   "weight": "heavy",
   "role": "長距離決定打",
   "frames": 48,
   "reachPeak": 0.6821,
   "reachPeakFrame": 5,
   "strikeAxis": "forward",
   "heightPeak": 0.2909,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 19,
    "active": 6,
    "recovery": 23
   },
   "cueTrack": [
    {
     "at": 0,
     "type": "sfx",
     "key": "grunt",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.2667,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.3167,
     "type": "sfx",
     "key": "crash",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.3167,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "tail_03"
    },
    {
     "at": 0.3167,
     "type": "shake",
     "key": 0.016,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.3167,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.3167,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "tail_03"
    }
   ],
   "hitstopSuggest": {
    "hit": 9,
    "guard": 5
   }
  }
 },
 "dark_moguzo": {
  "s1": {
   "clip": "s1_v17",
   "name": "黒い地走波",
   "contact": 0.3548,
   "contactEnd": 0.3548,
   "contactSeconds": 0.1833,
   "attackPart": "armR",
   "attackLimb": "pawR",
   "reach": 0.4147,
   "height": 0.2345,
   "battleActive": 1,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4147,
     "height": 0.2345,
     "part": "armR"
    }
   ],
   "status": "ok",
   "origin": "v17 revised",
   "kind": "projectile",
   "weight": "light",
   "role": "高速牽制",
   "frames": 31,
   "reachPeak": 0.4147,
   "reachPeakFrame": 0,
   "strikeAxis": "forward",
   "heightPeak": 0.3207,
   "reachMeans": "surface of the releasing limb (not projectile range; see socket)",
   "socket": {
    "bone": "pawR",
    "forward": 0.3421,
    "height": 0.2201,
    "at": "contact (projectile spawn frame)",
    "space": "rig root: forward = facing, height above root"
   },
   "referenceFrames": {
    "startup": 11,
    "active": 1,
    "recovery": 19
   },
   "projectileSpawnFrame": 11,
   "cueTrack": [
    {
     "at": 0.1833,
     "type": "sfx",
     "key": "special",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1833,
     "type": "vfx",
     "key": "special",
     "trigger": "movement",
     "on": "always",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  },
  "s2": {
   "clip": "s2_v17",
   "name": "逆昇撃",
   "contact": 0.1136,
   "contactEnd": 0.2727,
   "contactSeconds": 0.0833,
   "attackPart": "armL",
   "attackLimb": "pawL",
   "reach": 0.2635,
   "height": 0.5513,
   "battleActive": 8,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.2635,
     "height": 0.5513,
     "part": "armL"
    },
    {
     "phase": 0.1429,
     "frame": 1,
     "reach": 0.2636,
     "height": 0.5532,
     "part": "armL"
    },
    {
     "phase": 0.2857,
     "frame": 2,
     "reach": 0.2637,
     "height": 0.5551,
     "part": "armL"
    },
    {
     "phase": 0.4286,
     "frame": 3,
     "reach": 0.2639,
     "height": 0.561,
     "part": "armL"
    },
    {
     "phase": 0.5714,
     "frame": 4,
     "reach": 0.264,
     "height": 0.5629,
     "part": "armL"
    },
    {
     "phase": 0.7143,
     "frame": 5,
     "reach": 0.2641,
     "height": 0.5648,
     "part": "armL"
    },
    {
     "phase": 0.8571,
     "frame": 6,
     "reach": 0.2642,
     "height": 0.5667,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 7,
     "reach": 0.2643,
     "height": 0.5686,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "antiair",
   "weight": "mid",
   "role": "連携後の切返し",
   "frames": 44,
   "reachPeak": 0.2643,
   "reachPeakFrame": 7,
   "strikeAxis": "upward",
   "heightPeak": 0.7522,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 5,
    "active": 8,
    "recovery": 31
   },
   "airborneFrames": [
    4,
    26
   ],
   "cueTrack": [
    {
     "at": 0.0333,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.0667,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.0833,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.0833,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawL"
    },
    {
     "at": 0.0833,
     "type": "shake",
     "key": 0.008,
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.0833,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.0833,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawL"
    },
    {
     "at": 0.4333,
     "type": "sfx",
     "key": "clinch",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.4333,
     "type": "vfx",
     "key": "roar",
     "trigger": "movement",
     "on": "always",
     "bone": "root_ground"
    }
   ],
   "hitstopSuggest": {
    "hit": 6,
    "guard": 3
   }
  },
  "s3": {
   "clip": "s3_v17",
   "name": "暗連",
   "contact": 0.175,
   "contactEnd": 0.375,
   "contactSeconds": 0.1167,
   "attackPart": "armL",
   "attackLimb": "pawL+pawR",
   "reach": 0.4606,
   "height": 0.1465,
   "battleActive": 9,
   "activeReach": [
    {
     "phase": 0,
     "frame": 0,
     "reach": 0.4606,
     "height": 0.1465,
     "part": "armL"
    },
    {
     "phase": 0.125,
     "frame": 1,
     "reach": 0.3771,
     "height": 0.2934,
     "part": "armR"
    },
    {
     "phase": 0.25,
     "frame": 2,
     "reach": 0.4903,
     "height": 0.2934,
     "part": "armR"
    },
    {
     "phase": 0.375,
     "frame": 3,
     "reach": 0.4903,
     "height": 0.2934,
     "part": "armR"
    },
    {
     "phase": 0.5,
     "frame": 4,
     "reach": 0.4903,
     "height": 0.2934,
     "part": "armR"
    },
    {
     "phase": 0.625,
     "frame": 5,
     "reach": 0.4092,
     "height": 0.3511,
     "part": "armR"
    },
    {
     "phase": 0.75,
     "frame": 6,
     "reach": 0.473,
     "height": 0.3535,
     "part": "armL"
    },
    {
     "phase": 0.875,
     "frame": 7,
     "reach": 0.5306,
     "height": 0.3449,
     "part": "armL"
    },
    {
     "phase": 1,
     "frame": 8,
     "reach": 0.5306,
     "height": 0.3449,
     "part": "armL"
    }
   ],
   "status": "ok",
   "origin": "v14 re-export",
   "kind": "rush",
   "weight": "light",
   "role": "高速連携の起点",
   "frames": 40,
   "reachPeak": 0.5306,
   "reachPeakFrame": 7,
   "strikeAxis": "forward",
   "heightPeak": 0.5554,
   "reachMeans": "striking surface",
   "referenceFrames": {
    "startup": 7,
    "active": 9,
    "recovery": 24
   },
   "cueTrack": [
    {
     "at": 0.0667,
     "type": "sfx",
     "key": "wind",
     "trigger": "movement",
     "on": "always"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit"
    },
    {
     "at": 0.1167,
     "type": "vfx",
     "key": "hit",
     "trigger": "contact",
     "on": "hit",
     "bone": "pawR"
    },
    {
     "at": 0.1167,
     "type": "sfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard"
    },
    {
     "at": 0.1167,
     "type": "vfx",
     "key": "block",
     "trigger": "contact",
     "on": "guard",
     "bone": "pawR"
    }
   ],
   "hitstopSuggest": {
    "hit": 4,
    "guard": 2
   }
  }
 }
});
