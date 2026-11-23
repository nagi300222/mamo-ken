// Exact-time measured data and independent CPU review. Live WebGL is rechecked in CI.
// Performance columns remain in normal-balance-v151.js.
export const NORMAL_REVIEW_PROVENANCE={
  "artistCommit": "15977ff",
  "artRevision": "r2",
  "manifestSHA256": {
    "motion/v17/normals_v17.json": "dc0ace53a9033a7d564dde8c4f74cca4e06cf0ce50ce85bd3f301cac41f1f077",
    "motion/v17r2/normals_v17r2.json": "666d0a63e2477bf837faf302519fa297fe748e83aac1d6e8a9770e627ae0f15c",
    "motion/v17r2/normal_contacts_v17r2.json": "e02d1fcea32ee1912c60e8ce98a78f46385ab1a69bff8d5aacc5e0dfd0d11e70"
  },
  "independentCPU": "docs/mamoken-p3/evidence/normal-source-cpu-15977ff-r2.json",
  "styleCPU": "docs/mamoken-p3/evidence/custom-normal-styles-cpu-15977ff-r2.json",
  "r1WebGLReviewRun": 45133416693,
  "r2WebGL": "pending integrated rerun"
};
export const NORMAL_CONTACT_DELIVERY_V17={
  "version": "v17-p3-normals-r2",
  "source": "runtime-skinned-mesh",
  "characters": {
    "moguzo": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "前手の直ジャブ",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "前手の直ジャブ",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "踏み込みストレート",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "踏み込みストレート",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "しゃがみすくい打ち",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "しゃがみすくい打ち",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "しゃがみ横払い",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "しゃがみ横払い",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "空中の差し拳",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "空中の差し拳",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "かかと落とし",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "かかと落とし",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "legR"
        ],
        "declaredAttackLimb": "footR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "pisuke": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "二拍子の前手",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/pisuke_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "二拍子の前手",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "背面回し蹴り",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/pisuke_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "背面回し蹴り",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "legR"
        ],
        "declaredAttackLimb": "footR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "地すれの手払い",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/pisuke_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "地すれの手払い",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "長い掃き蹴り",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/pisuke_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "長い掃き蹴り",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "legR"
        ],
        "declaredAttackLimb": "footR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "膝を畳んだ差し拳",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/pisuke_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "膝を畳んだ差し拳",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "止めて落とすかかと",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/pisuke_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "止めて落とすかかと",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "legR"
        ],
        "declaredAttackLimb": "footR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "godan": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "前腕の押し",
        "contact": 0.34375,
        "contactEnd": 0.46875,
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
        "status": "ok",
        "file": "motion/v17/godan_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "前腕の押し",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 32,
        "authoredFps": 60,
        "authoredDuration": 0.5333333333333333,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "踏み込み重拳",
        "contact": 0.3888888888888889,
        "contactEnd": 0.48148148148148145,
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
        "status": "ok",
        "file": "motion/v17/godan_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "踏み込み重拳",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 54,
        "authoredFps": 60,
        "authoredDuration": 0.9,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "低い押し払い",
        "contact": 0.34375,
        "contactEnd": 0.46875,
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
        "status": "ok",
        "file": "motion/v17/godan_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "低い押し払い",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 32,
        "authoredFps": 60,
        "authoredDuration": 0.5333333333333333,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "肩ごとの押し上げ",
        "contact": 0.3888888888888889,
        "contactEnd": 0.48148148148148145,
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
        "status": "ok",
        "file": "motion/v17/godan_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "肩ごとの押し上げ",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 54,
        "authoredFps": 60,
        "authoredDuration": 0.9,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "空中の肘",
        "contact": 0.34375,
        "contactEnd": 0.46875,
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
        "status": "ok",
        "file": "motion/v17/godan_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "空中の肘",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "elbowR",
        "authoredFrames": 32,
        "authoredFps": 60,
        "authoredDuration": 0.5333333333333333,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "全身の落とし",
        "contact": 0.3888888888888889,
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
        "status": "ok",
        "file": "motion/v17/godan_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "全身の落とし",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "head"
        ],
        "declaredAttackLimb": "body",
        "authoredFrames": 54,
        "authoredFps": 60,
        "authoredDuration": 0.9,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "hakuma": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "短い張り手",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/hakuma_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "短い張り手",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "踏み込み両掌突き",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "bothHands": true,
        "file": "motion/v17/hakuma_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "踏み込み両掌突き",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL",
          "armR"
        ],
        "declaredAttackLimb": "pawL+pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "守りの払い",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/hakuma_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "守りの払い",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "足元への肘",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/hakuma_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "足元への肘",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "elbowR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "空中の前掌",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/hakuma_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "空中の前掌",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "合わせ降り掌",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "bothHands": true,
        "file": "motion/v17/hakuma_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "合わせ降り掌",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL",
          "armR"
        ],
        "declaredAttackLimb": "pawL+pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "chirka": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "ずらし爪",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/chirka_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "ずらし爪",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "逆ひねり爪",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/chirka_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "逆ひねり爪",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "視線先行の足元爪",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/chirka_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "視線先行の足元爪",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "低い横蹴り",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/chirka_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "低い横蹴り",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "legL"
        ],
        "declaredAttackLimb": "footL",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "空中のずらし爪",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/chirka_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "空中のずらし爪",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "溜め振り爪",
        "contact": 0.391304347826087,
        "contactEnd": 0.4782608695652174,
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
        "status": "ok",
        "file": "motion/v17/chirka_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "溜め振り爪",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "takimaru": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "探る掌",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17r2/takimaru_normals_v17r2.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "探る掌",
        "authoredMetadataFile": "motion/v17r2/normals_v17r2.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "寄せる肩打ち",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17r2/takimaru_normals_v17r2.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "寄せる肩打ち",
        "authoredMetadataFile": "motion/v17r2/normals_v17r2.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "shoulderR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "足元の払い",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17r2/takimaru_normals_v17r2.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "足元の払い",
        "authoredMetadataFile": "motion/v17r2/normals_v17r2.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17r2_crouch_heavy",
        "name": "すくい上げ",
        "contact": 0.32608695652173914,
        "contactEnd": 0.41304347826086957,
        "contactSeconds": 0.25,
        "attackPart": "armR",
        "attackLimb": "pawL+pawR",
        "reach": 0.5716,
        "height": 0.2597,
        "battleActive": 4,
        "activeReach": [
          {
            "phase": 0,
            "frame": 0,
            "reach": 0.5716,
            "height": 0.2597,
            "part": "armR"
          },
          {
            "phase": 0.3333,
            "frame": 1,
            "reach": 0.5807,
            "height": 0.2539,
            "part": "armL"
          },
          {
            "phase": 0.6667,
            "frame": 2,
            "reach": 0.5885,
            "height": 0.3279,
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
        "bothHands": true,
        "file": "motion/v17r2/takimaru_normals_v17r2.glb",
        "revision": "r2",
        "changedFromR1": true,
        "r1": {
          "clip": "v17_crouch_heavy",
          "file": "motion/v17/takimaru_normals_v17.glb",
          "contact": 0.3696,
          "contactEnd": 0.4565,
          "reach": 0.5227,
          "height": 0.6063
        },
        "gesture": "すくい上げ",
        "authoredMetadataFile": "motion/v17r2/normals_v17r2.json",
        "attackParts": [
          "armL",
          "armR"
        ],
        "declaredAttackLimb": "pawL+pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "落とし肘",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17r2/takimaru_normals_v17r2.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "落とし肘",
        "authoredMetadataFile": "motion/v17r2/normals_v17r2.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "elbowR",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "丸めた体落とし",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17r2/takimaru_normals_v17r2.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "丸めた体落とし",
        "authoredMetadataFile": "motion/v17r2/normals_v17r2.json",
        "attackParts": [
          "head"
        ],
        "declaredAttackLimb": "body",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "yomikage": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "手首返しの小突き",
        "contact": 0.2916666666666667,
        "contactEnd": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/yomikage_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "手首返しの小突き",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 24,
        "authoredFps": 60,
        "authoredDuration": 0.4,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "一歩の手刀斬り",
        "contact": 0.391304347826087,
        "contactEnd": 0.4782608695652174,
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
        "status": "ok",
        "file": "motion/v17/yomikage_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "一歩の手刀斬り",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "足首の払い",
        "contact": 0.2916666666666667,
        "contactEnd": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/yomikage_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "足首の払い",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 24,
        "authoredFps": 60,
        "authoredDuration": 0.4,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "迎えの膝と肘",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/yomikage_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "迎えの膝と肘",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "legL"
        ],
        "declaredAttackLimb": "kneeL+elbowR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "空中の短い掌",
        "contact": 0.2916666666666667,
        "contactEnd": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/yomikage_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "空中の短い掌",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 24,
        "authoredFps": 60,
        "authoredDuration": 0.4,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "下突き",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/yomikage_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "下突き",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "bullet": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "測る前手",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/bullet_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "測る前手",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "長尾の横払い",
        "contact": 0.5208333333333334,
        "contactEnd": 0.6041666666666666,
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
        "status": "ok",
        "file": "motion/v17/bullet_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "長尾の横払い",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "tail"
        ],
        "declaredAttackLimb": "tail",
        "authoredFrames": 48,
        "authoredFps": 60,
        "authoredDuration": 0.8,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "低い前手突き",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/bullet_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "低い前手突き",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "地すれの尾薙ぎ",
        "contact": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/bullet_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "地すれの尾薙ぎ",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "tail"
        ],
        "declaredAttackLimb": "tail",
        "authoredFrames": 48,
        "authoredFps": 60,
        "authoredDuration": 0.8,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "空中の前手",
        "contact": 0.32142857142857145,
        "contactEnd": 0.42857142857142855,
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
        "status": "ok",
        "file": "motion/v17/bullet_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "空中の前手",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 28,
        "authoredFps": 60,
        "authoredDuration": 0.4666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "溜め尾の振り下ろし",
        "contact": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/bullet_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "溜め尾の振り下ろし",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "tail"
        ],
        "declaredAttackLimb": "tail",
        "authoredFrames": 48,
        "authoredFps": 60,
        "authoredDuration": 0.8,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    },
    "dark_moguzo": {
      "stand_weak": {
        "clip": "v17_stand_weak",
        "name": "低い差し返し",
        "contact": 0.2916666666666667,
        "contactEnd": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/dark_moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "低い差し返し",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 24,
        "authoredFps": 60,
        "authoredDuration": 0.4,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "stand_heavy": {
        "clip": "v17_stand_heavy",
        "name": "滑り込みの振り抜き",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/dark_moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "滑り込みの振り抜き",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_weak": {
        "clip": "v17_crouch_weak",
        "name": "潜り突き",
        "contact": 0.2916666666666667,
        "contactEnd": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/dark_moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "潜り突き",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 24,
        "authoredFps": 60,
        "authoredDuration": 0.4,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "crouch_heavy": {
        "clip": "v17_crouch_heavy",
        "name": "地を切る横払い",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/dark_moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "地を切る横払い",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armL"
        ],
        "declaredAttackLimb": "pawL",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_weak": {
        "clip": "v17_air_weak",
        "name": "ひねり差し",
        "contact": 0.2916666666666667,
        "contactEnd": 0.4166666666666667,
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
        "status": "ok",
        "file": "motion/v17/dark_moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "ひねり差し",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "armR"
        ],
        "declaredAttackLimb": "pawR",
        "authoredFrames": 24,
        "authoredFps": 60,
        "authoredDuration": 0.4,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      },
      "air_heavy": {
        "clip": "v17_air_heavy",
        "name": "斜めの蹴り下ろし",
        "contact": 0.3695652173913043,
        "contactEnd": 0.45652173913043476,
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
        "status": "ok",
        "file": "motion/v17/dark_moguzo_normals_v17.glb",
        "revision": "r1",
        "changedFromR1": false,
        "gesture": "斜めの蹴り下ろし",
        "authoredMetadataFile": "motion/v17/normals_v17.json",
        "attackParts": [
          "legL"
        ],
        "declaredAttackLimb": "footL",
        "authoredFrames": 46,
        "authoredFps": 60,
        "authoredDuration": 0.7666666666666667,
        "trajectorySampling": "exact-battle-active-frames",
        "sourceVersion": "v17-p3-normals-r2",
        "source": "runtime-skinned-mesh"
      }
    }
  }
};
