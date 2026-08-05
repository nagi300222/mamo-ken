import type { CurrentCharacterId, CurrentCharacterSpec } from './types.ts';

export const CORE_SPEC_VERSION = 'core-spec-v1' as const;
export const CURRENT_IMPL_SOURCE = "prototype/mamoken_prototype_v01.html" as const;

export const CURRENT_CONTRACT = {
  "bal": {
    "HP": 1000,
    "TIME": 3600,
    "WINS": 2,
    "ATK": {
      "high": {
        "s": 22,
        "a": 3,
        "r": 24,
        "d": 100,
        "y": -108,
        "w": 2
      },
      "mid": {
        "s": 14,
        "a": 3,
        "r": 18,
        "d": 70,
        "y": -68,
        "w": 1
      },
      "low": {
        "s": 30,
        "a": 4,
        "r": 30,
        "d": 150,
        "y": -26,
        "w": 3,
        "down": true
      },
      "crouch": {
        "s": 10,
        "a": 3,
        "r": 14,
        "d": 50,
        "y": -20,
        "w": 0.5
      }
    },
    "HITSTUN": {
      "high": 32,
      "mid": 24,
      "crouch": 19
    },
    "BLOCKSTUN": {
      "high": 16,
      "mid": 14,
      "low": 15,
      "crouch": 12
    },
    "CHAIN": 14,
    "CMAX": 3,
    "SCALE": [
      1,
      0.9,
      0.8
    ],
    "PINCH_HP": 300,
    "MIKIRI": {
      "window": 5,
      "windowPinch": 7,
      "whiff": 22
    },
    "DOWN": {
      "downF": 45,
      "wakeF": 20,
      "followupMul": 0.5
    },
    "FOCUS": {
      "max": 100,
      "gainDmgMul": 0.15,
      "gainGuard": 8,
      "gainMikiri": 30,
      "slowMul": 0.25,
      "durationMs": 600,
      "zoom": 1.3
    },
    "GDMG_A": 10,
    "GDMG_S": 45,
    "CHIP_S": 20,
    "CHIP_LOW": 10,
    "GREGEN": 0.22,
    "DIZZY": 90,
    "GRECOVER": 50,
    "SMAX": 100,
    "SG": {
      "aHit": 12,
      "aHitC": [
        12,
        7,
        4
      ],
      "aBlk": 8,
      "whiff": 2,
      "gOk": 6,
      "got": 5
    },
    "ROAR": {
      "s": 16,
      "armor": 14,
      "a": 4,
      "r": 24,
      "d": 130,
      "stun": 34
    },
    "CLASH": {
      "sel": 90,
      "d": 120,
      "near": 8,
      "streakBonus": 30,
      "winS": 30,
      "loserStun": 40,
      "inF": 26,
      "revealHitF": 24,
      "revealF": 60
    },
    "MINIGAME": {
      "weights": {
        "jyanken": 0.5,
        "renda": 0.25,
        "hayauchi": 0.25
      },
      "RENDA": {
        "durationF": 120,
        "tapGain": 1,
        "barRange": 20
      },
      "HAYAUCHI": {
        "targets": 5,
        "radius": 55,
        "capF": 600
      }
    },
    "AIDIFF": {
      "EASY": {
        "reactMul": 0.4,
        "mikiriRate": 0.04,
        "dodgeRate": 0.05,
        "atkFreqMul": 0.6,
        "downFollowup": 0,
        "focusRestraint": false,
        "rendaCpuMin": 0.085,
        "rendaCpuRng": 0,
        "hayauchiF": [
          22,
          34
        ],
        "cmdMoveRate": 0.05
      },
      "NORMAL": {
        "reactMul": 0.7,
        "mikiriRate": 0.12,
        "dodgeRate": 0.1,
        "atkFreqMul": 0.8,
        "downFollowup": 0.5,
        "focusRestraint": true,
        "rendaCpuMin": 0.1,
        "rendaCpuRng": 0,
        "hayauchiF": [
          17,
          27
        ],
        "cmdMoveRate": 0.25
      },
      "HARD": {
        "reactMul": 1,
        "mikiriRate": 0.22,
        "dodgeRate": 0.15,
        "atkFreqMul": 1,
        "downFollowup": 1,
        "focusRestraint": true,
        "rendaCpuMin": 0.115,
        "rendaCpuRng": 0.02,
        "hayauchiF": [
          14,
          24
        ],
        "cmdMoveRate": 0.6
      }
    },
    "GRAB": {
      "s": 12,
      "a": 2,
      "rec": 28,
      "seq": 28,
      "d": 90,
      "stun": 30,
      "counterMul": 1.25
    },
    "DODGE": {
      "totalF": 22,
      "judgeF": 10,
      "counterReadyF": 18,
      "counterMul": 1.25,
      "counterScale": [
        1,
        1,
        0.9
      ],
      "clinchF": 12,
      "clinchGrabS": 10,
      "clinchHighBonus": 15,
      "crouchAtkWindow": 14
    },
    "ULT": {
      "stock": 3,
      "d": 300,
      "impact": 78,
      "total": 110
    },
    "HITSTOP": {
      "mid": 6,
      "high": 9,
      "low": 14,
      "roar": 12,
      "clash": 16,
      "crouch": 5
    },
    "TELEGRAPH": {
      "mid": 8,
      "high": 13,
      "low": 18,
      "crouch": 6
    },
    "BUF": 10,
    "FLICK_DX": 60,
    "FLICK_MS": 300,
    "JUST_TAP_MS": 100,
    "SPRITE_H": {
      "moguzo": 172,
      "pisuke": 116,
      "godan": 206
    },
    "PORTRAIT_RATIO": {
      "moguzo": 1,
      "pisuke": 0.8,
      "godan": 1.15
    },
    "NET": {
      "delayFMin": 3,
      "delayFMax": 8,
      "frameMs": 16.7,
      "waitingShowF": 20
    },
    "CMD": {
      "bufF": 24,
      "buffer": 12,
      "moves": {
        "moguzo": [
          {
            "seq": [
              "right",
              "down"
            ],
            "trigger": "mid",
            "type": "atk",
            "lv": "mid",
            "name": "地走り",
            "s": 18,
            "a": 3,
            "r": 18,
            "d": 95,
            "fwd": 40,
            "guardDmg": 8,
            "color": "#ffb84d",
            "se": "cmdHit"
          },
          {
            "seq": [
              "down",
              "right"
            ],
            "trigger": "high",
            "type": "atk",
            "lv": "high",
            "name": "昇撃",
            "s": 24,
            "a": 3,
            "r": 30,
            "d": 120,
            "counterMul": 1.5,
            "color": "#ff5a3c",
            "se": "cmdHit"
          },
          {
            "seq": [
              "left",
              "right"
            ],
            "trigger": "grab",
            "type": "grab",
            "name": "引き寄せ投げ",
            "s": 14,
            "d": 100,
            "reachMul": 1.5,
            "color": "#ffd23f",
            "se": "cmdGrabHit"
          }
        ],
        "pisuke": [
          {
            "seq": [
              "right",
              "right"
            ],
            "trigger": "mid",
            "type": "atk",
            "lv": "mid",
            "name": "二連牙",
            "s": 8,
            "a": 3,
            "r": 18,
            "d": 95,
            "color": "#5ab2ff",
            "se": "cmdHit"
          },
          {
            "seq": [
              "down",
              "left"
            ],
            "trigger": "low",
            "type": "atk",
            "lv": "low",
            "name": "スライディング",
            "s": 30,
            "a": 4,
            "r": 30,
            "d": 80,
            "down": true,
            "fwd": 60,
            "guardDmg": 14,
            "color": "#7cfc00",
            "se": "cmdHit"
          },
          {
            "seq": [
              "left",
              "right"
            ],
            "trigger": "high",
            "type": "atk",
            "lv": "high",
            "name": "宙返り蹴",
            "s": 20,
            "a": 3,
            "r": 24,
            "d": 90,
            "fwd": 20,
            "color": "#5ab2ff",
            "se": "cmdHit"
          }
        ],
        "godan": [
          {
            "seq": [
              "down",
              "down"
            ],
            "trigger": "low",
            "type": "atk",
            "lv": "low",
            "name": "地割れ",
            "s": 30,
            "a": 3,
            "r": 30,
            "d": 110,
            "down": true,
            "guardChip": 30,
            "color": "#8a6540",
            "se": "cmdHit"
          },
          {
            "seq": [
              "right",
              "down"
            ],
            "trigger": "grab",
            "type": "grab",
            "name": "山掴み",
            "s": 16,
            "d": 110,
            "armor": 6,
            "color": "#ff9500",
            "se": "cmdGrabHit"
          },
          {
            "seq": [
              "left",
              "left"
            ],
            "trigger": "mid",
            "type": "stance",
            "name": "巌の構え",
            "stanceF": 12,
            "counterLv": "mid",
            "counterDmg": 100,
            "color": "#ffd23f",
            "se": "guard"
          }
        ]
      }
    }
  },
  "characters": [
    {
      "id": "moguzo",
      "name": "モグゾー",
      "type": "バランス",
      "ult": "大地烈掌",
      "dMul": 1,
      "sMul": 1,
      "sOfs": 0,
      "gMax": 100,
      "pips": {
        "p": 3,
        "s": 3,
        "g": 3
      },
      "stats5": {
        "atk": 3,
        "spd": 3,
        "def": 3,
        "tech": 3,
        "brk": 3
      },
      "usability": 1
    },
    {
      "id": "pisuke",
      "name": "ピスケ",
      "type": "スピード",
      "ult": "音速連咆",
      "dMul": 0.85,
      "sMul": 1.25,
      "sOfs": -2,
      "gMax": 90,
      "pips": {
        "p": 2,
        "s": 5,
        "g": 2
      },
      "stats5": {
        "atk": 2,
        "spd": 5,
        "def": 2,
        "tech": 4,
        "brk": 2
      },
      "usability": 2
    },
    {
      "id": "godan",
      "name": "ゴダン",
      "type": "パワー",
      "ult": "山崩し",
      "dMul": 1.18,
      "sMul": 0.9,
      "sOfs": 2,
      "gMax": 110,
      "pips": {
        "p": 5,
        "s": 2,
        "g": 4
      },
      "stats5": {
        "atk": 5,
        "spd": 2,
        "def": 4,
        "tech": 2,
        "brk": 4
      },
      "usability": 1
    }
  ],
  "characterIds": [
    "moguzo",
    "pisuke",
    "godan"
  ],
  "levels": [
    "high",
    "mid",
    "low"
  ],
  "choices": [
    "guu",
    "choki",
    "paa"
  ],
  "commandMoves": {
    "moguzo": [
      {
        "slot": 1,
        "seq": [
          "right",
          "down"
        ],
        "trigger": "mid",
        "type": "atk",
        "lv": "mid",
        "name": "地走り",
        "s": 18,
        "a": 3,
        "r": 18,
        "d": 95,
        "fwd": 40,
        "guardDmg": 8,
        "color": "#ffb84d",
        "se": "cmdHit"
      },
      {
        "slot": 2,
        "seq": [
          "down",
          "right"
        ],
        "trigger": "high",
        "type": "atk",
        "lv": "high",
        "name": "昇撃",
        "s": 24,
        "a": 3,
        "r": 30,
        "d": 120,
        "counterMul": 1.5,
        "color": "#ff5a3c",
        "se": "cmdHit"
      },
      {
        "slot": 3,
        "seq": [
          "left",
          "right"
        ],
        "trigger": "grab",
        "type": "grab",
        "name": "引き寄せ投げ",
        "s": 14,
        "d": 100,
        "reachMul": 1.5,
        "color": "#ffd23f",
        "se": "cmdGrabHit"
      }
    ],
    "pisuke": [
      {
        "slot": 1,
        "seq": [
          "right",
          "right"
        ],
        "trigger": "mid",
        "type": "atk",
        "lv": "mid",
        "name": "二連牙",
        "s": 8,
        "a": 3,
        "r": 18,
        "d": 95,
        "color": "#5ab2ff",
        "se": "cmdHit"
      },
      {
        "slot": 2,
        "seq": [
          "down",
          "left"
        ],
        "trigger": "low",
        "type": "atk",
        "lv": "low",
        "name": "スライディング",
        "s": 30,
        "a": 4,
        "r": 30,
        "d": 80,
        "down": true,
        "fwd": 60,
        "guardDmg": 14,
        "color": "#7cfc00",
        "se": "cmdHit"
      },
      {
        "slot": 3,
        "seq": [
          "left",
          "right"
        ],
        "trigger": "high",
        "type": "atk",
        "lv": "high",
        "name": "宙返り蹴",
        "s": 20,
        "a": 3,
        "r": 24,
        "d": 90,
        "fwd": 20,
        "color": "#5ab2ff",
        "se": "cmdHit"
      }
    ],
    "godan": [
      {
        "slot": 1,
        "seq": [
          "down",
          "down"
        ],
        "trigger": "low",
        "type": "atk",
        "lv": "low",
        "name": "地割れ",
        "s": 30,
        "a": 3,
        "r": 30,
        "d": 110,
        "down": true,
        "guardChip": 30,
        "color": "#8a6540",
        "se": "cmdHit"
      },
      {
        "slot": 2,
        "seq": [
          "right",
          "down"
        ],
        "trigger": "grab",
        "type": "grab",
        "name": "山掴み",
        "s": 16,
        "d": 110,
        "armor": 6,
        "color": "#ff9500",
        "se": "cmdGrabHit"
      },
      {
        "slot": 3,
        "seq": [
          "left",
          "left"
        ],
        "trigger": "mid",
        "type": "stance",
        "name": "巌の構え",
        "stanceF": 12,
        "counterLv": "mid",
        "counterDmg": 100,
        "color": "#ffd23f",
        "se": "guard"
      }
    ]
  },
  "inputTiming": {
    "BUF": 10,
    "CMD_buffer": 12,
    "CMD_bufF": 24,
    "FLICK_MS": 300,
    "JUST_TAP_MS": 100
  },
  "roar": {
    "s": 16,
    "armor": 14,
    "a": 4,
    "r": 24,
    "d": 130,
    "stun": 34
  },
  "sGauge": {
    "aHit": 12,
    "aHitC": [
      12,
      7,
      4
    ],
    "aBlk": 8,
    "whiff": 2,
    "gOk": 6,
    "got": 5
  },
  "clash": {
    "sel": 90,
    "d": 120,
    "near": 8,
    "streakBonus": 30,
    "winS": 30,
    "loserStun": 40,
    "inF": 26,
    "revealHitF": 24,
    "revealF": 60
  },
  "down": {
    "downF": 45,
    "wakeF": 20,
    "followupMul": 0.5
  },
  "ult": {
    "stock": 3,
    "d": 300,
    "impact": 78,
    "total": 110
  },
  "net": {
    "delayFMin": 3,
    "delayFMax": 8,
    "frameMs": 16.7,
    "waitingShowF": 20
  },
  "aiDifficulty": {
    "EASY": {
      "reactMul": 0.4,
      "mikiriRate": 0.04,
      "dodgeRate": 0.05,
      "atkFreqMul": 0.6,
      "downFollowup": 0,
      "focusRestraint": false,
      "rendaCpuMin": 0.085,
      "rendaCpuRng": 0,
      "hayauchiF": [
        22,
        34
      ],
      "cmdMoveRate": 0.05
    },
    "NORMAL": {
      "reactMul": 0.7,
      "mikiriRate": 0.12,
      "dodgeRate": 0.1,
      "atkFreqMul": 0.8,
      "downFollowup": 0.5,
      "focusRestraint": true,
      "rendaCpuMin": 0.1,
      "rendaCpuRng": 0,
      "hayauchiF": [
        17,
        27
      ],
      "cmdMoveRate": 0.25
    },
    "HARD": {
      "reactMul": 1,
      "mikiriRate": 0.22,
      "dodgeRate": 0.15,
      "atkFreqMul": 1,
      "downFollowup": 1,
      "focusRestraint": true,
      "rendaCpuMin": 0.115,
      "rendaCpuRng": 0.02,
      "hayauchiF": [
        14,
        24
      ],
      "cmdMoveRate": 0.6
    }
  },
  "sprites": {
    "poseIds": [
      "idle",
      "guard",
      "hurt",
      "win",
      "tele_high",
      "tele_mid",
      "tele_low",
      "atk_mid",
      "atk_high",
      "atk_low",
      "mikiri",
      "roar_charge",
      "roar",
      "grab_reach",
      "grab_lift",
      "grabbed",
      "down",
      "getup",
      "ko",
      "ult_charge",
      "crouch",
      "sway",
      "lunge",
      "crouch_atk",
      "cmd1",
      "cmd2",
      "cmd3"
    ],
    "spriteH": {
      "moguzo": 172,
      "pisuke": 116,
      "godan": 206
    },
    "portraitRatio": {
      "moguzo": 1,
      "pisuke": 0.8,
      "godan": 1.15
    }
  }
} as const;

export const BAL = CURRENT_CONTRACT.bal;
export const CURRENT_CHARACTERS = CURRENT_CONTRACT.characters satisfies readonly CurrentCharacterSpec[];
export const CURRENT_CHARACTER_IDS = CURRENT_CONTRACT.characterIds satisfies readonly CurrentCharacterId[];

export const PROVISIONAL_ARCHETYPE_IDS = [
  'standard',
  'rush',
  'power',
  'defense',
  'tricky',
  'grappler',
  'counter',
  'charge',
] as const;

export const PLANNED_CHARACTER_IDS = [
  'himalaya',
  'bobak',
  'grappler_tbd',
  'counter_tbd',
  'charge_tbd',
] as const;

export const BOSS_CHARACTER_IDS = ['dark_moguzo'] as const;
