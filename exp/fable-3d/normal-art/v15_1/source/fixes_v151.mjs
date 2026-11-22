// マモ拳 v15.1 通常技の修正指定（編集正本）。PR195 の 54 技のうち、実測で「狙った部位が先頭に来ない」技だけを直す。
// ここには「接触の瞬間に、どの部位の先端を、体のどこへ置きたいか」を書く。tools/solve_fixes.mjs が元リグの FK で
// 局所回転（度）を解いて dojo/normal-motifs-v15.js の GESTURES / MOTIFS へ書き戻す。全身 scale や見えない判定は一切使わない。
//   m.jab  = そのキャラの立ち弱（元クリップ）の拳先の最大前方距離 [m]   m.head = 構えの頭ボーン高さ [m]   m.leg = 脚の長さ [m]
//   tip    : 打撃部位（paw.L / paw.R / toe.L / toe.R / tail / head / elbow.L）
//   at     : 接触時の先端位置 [x(左+ / 右=カメラ側 −), y(床から), z(前)]。null の軸は自由
//   mute   : 元クリップから受け継いだ動きを止める肢（armL armR legL legR）
//   vars   : 回転を解くボーン（normal-motifs の正規化名）   move: 骨盤の移動（重心）を解くか
//   lead   : true = 頭や反対の手が打撃部位より前に出ないようにする   pose0: 解の出発点（演技の方向づけ）
const ARM = s => ['upperarm' + s, 'forearm' + s, 'paw' + s], LEG = s => ['thigh' + s, 'shin' + s, 'foot' + s];
const TAIL = n => Array.from({ length: n }, (_, i) => 'tail0' + (i + 1));
export const FIXES = {
  moguzo: {
    crouch_weak: { gesture: 'lowPalmStep', label: '踏み込む低い掌（右）', contact: .36, power: .95, tip: 'paw.R', at: m => [-.03, .20, m.jab * 1.12], vars: ['pelvis', 'chest', ...ARM('r'), 'head'], move: 1, lead: 1 },
    air_heavy: { gesture: 'overheadHeel', label: '前足の大きな踵落とし', contact: .46, power: 1.16, tip: 'toe.R', at: m => [-.04, .06, m.leg * 1.25], mute: ['armL', 'armR'], vars: ['pelvis', 'chest', ...LEG('r'), 'thighl', 'upperarml', 'upperarmr'], lead: 1, pose0: { pelvis: [-18, 0, 0], thighr: [-60, 0, 0], upperarml: [20, 0, 0], upperarmr: [20, 0, 0] } },
  },
  pisuke: {
    crouch_weak: { gesture: 'shinSnapL', label: '低空からの素早い脛蹴り', contact: .32, power: .97, tip: 'toe.L', at: m => [.03, .07, m.leg * 1.5], mute: ['armR'], vars: ['pelvis', 'chest', ...LEG('l'), 'head'], lead: 1, pose0: { chest: [-15, 0, 0], thighl: [-50, 0, 0] } },
    crouch_heavy: { gesture: 'lowSpinKick', label: '低姿勢の旋回蹴り', contact: .40, power: 1.2, tip: 'toe.R', at: m => [-.02, .06, m.leg * 1.75], vars: ['pelvis', 'chest', ...LEG('r'), 'head'], move: 1, lead: 1, pose0: { chest: [-20, 0, 0] } },
  },
  godan: {
    stand_weak: { gesture: 'shortBodyR', label: '踏み込み短い重拳', contact: .40, power: 1.03, tip: 'paw.R', at: m => [-.02, m.head * .62, m.jab * .98], mute: ['armL'], vars: ['pelvis', 'chest', ...ARM('r'), 'upperarml', 'head'], move: 1, lead: 1, pose0: { chest: [0, -25, 0] } },
    crouch_weak: { gesture: 'sideElbowL', label: '低く重心を落とす肘', contact: .43, power: 1.02, tip: 'elbow.L', at: m => [.02, .25, m.jab * .78], mute: ['armR'], vars: ['pelvis', 'chest', 'upperarml', 'forearml', 'upperarmr', 'head'], move: 1, lead: 1, pose0: { chest: [0, 35, 0], forearml: [-60, 0, 0] } },
    air_weak: { gesture: 'descendingForearm', label: '腕を地面へ振り下ろす', contact: .46, power: 1.02, tip: 'paw.R', at: m => [-.03, m.head * .42, m.jab * .95], mute: ['armL'], vars: ['chest', ...ARM('r'), 'upperarml', 'head'], lead: 1, pose0: { chest: [15, -20, 0] } },
  },
  hakuma: {
    crouch_heavy: { gesture: 'risingPalmL', label: '腰から持ち上げる張り手', contact: .44, power: 1.17, tip: 'paw.L', at: m => [.02, m.head * .78, m.jab * 1.08], mute: ['legR'], vars: ['pelvis', 'chest', ...ARM('l'), 'upperarmr', 'head'], move: 1, lead: 1, pose0: { chest: [-10, 25, 0] } },
    air_weak: { gesture: 'shortPalmR', label: '体の正面を守る短い掌', contact: .41, power: .95, tip: 'paw.R', at: m => [-.02, m.head * .70, m.jab * .92], mute: ['armL'], vars: ['chest', ...ARM('r'), 'upperarml', 'head'], lead: 1, pose0: { chest: [0, -20, 0] } },
  },
  chirka: {
    stand_heavy: { gesture: 'diagonalClawR', label: '体を反らし右爪を斜めに振る', contact: .44, power: 1.19, tip: 'paw.R', at: m => [.04, m.head * .80, m.jab * 1.15], mute: ['armR'], vars: ['pelvis', 'chest', ...ARM('r'), 'upperarml', 'head'], move: 1, lead: 1, pose0: { chest: [8, -30, 8] } },
    crouch_weak: { gesture: 'lowClawSlide', label: '低く滑り込む爪', contact: .35, power: .96, tip: 'paw.R', at: m => [0, .13, m.jab * 1.12], vars: ['pelvis', 'chest', ...ARM('r'), 'head'], move: 1, lead: 1 },
    crouch_heavy: { gesture: 'crossClawPair', label: '交差させる紫の両爪', contact: .50, power: 1.2, tip: 'paw.R', tip2: 'paw.L', at: m => [.03, .30, m.jab * 1.12], at2: m => [-.03, .22, m.jab * 1.12], mute: ['legR', 'armR'], vars: ['pelvis', 'chest', ...ARM('r'), ...ARM('l'), 'head'], move: 1, lead: 1, pose0: { chest: [10, 0, 0] } },
    air_weak: { gesture: 'airFeintClaw', label: '上体を捻って振り向き爪', contact: .37, power: .97, tip: 'paw.L', at: m => [-.03, m.head * .55, m.jab * 1.02], mute: ['armL'], vars: ['chest', ...ARM('l'), 'upperarmr', 'head'], lead: 1, pose0: { chest: [5, 30, 8], head: [0, -20, 0] } },
    air_heavy: { gesture: 'pounceClawPair', label: '爪を構えて跳びかかる', contact: .52, power: 1.27, tip: 'paw.L', tip2: 'paw.R', at: m => [.05, m.head * .55, m.jab * 1.12], at2: m => [-.05, m.head * .55, m.jab * 1.12], mute: ['armL', 'armR'], vars: ['pelvis', 'chest', ...ARM('l'), ...ARM('r'), 'head', 'thighl', 'thighr'], lead: 1, pose0: { pelvis: [20, 0, 0], thighl: [30, 0, 0], thighr: [30, 0, 0] } },
  },
  takimaru: {
    crouch_weak: { gesture: 'lowReachAnkle', label: '足首近くへの手伸ばし', contact: .37, power: .91, tip: 'paw.R', at: m => [-.02, .09, m.jab * 1.15], vars: ['pelvis', 'chest', ...ARM('r'), 'head'], move: 1, lead: 1 },
    crouch_heavy: { gesture: 'risingGrabPair', label: 'しゃがみから両手で引き起こす', contact: .50, power: 1.2, tip: 'paw.L', tip2: 'paw.R', at: m => [.07, m.head * .72, m.jab * 1.05], at2: m => [-.07, m.head * .72, m.jab * 1.05], mute: ['legR', 'armR'], vars: ['pelvis', 'chest', ...ARM('l'), ...ARM('r'), 'head'], move: 1, lead: 1, pose0: { chest: [-15, 0, 0] } },
  },
  yomikage: {
    crouch_weak: { gesture: 'shadowSliceLow', label: '相手の足元を狙う低い斬り', contact: .33, power: .95, tip: 'paw.R', at: m => [.02, .10, m.jab * 1.12], vars: ['pelvis', 'chest', ...ARM('r'), 'head'], move: 1, lead: 1 },
    crouch_heavy: { gesture: 'sweepingBladeR', label: '地面すれすれの逆刃', contact: .45, power: 1.2, tip: 'paw.R', at: m => [.06, .07, m.jab * 1.22], mute: ['legR', 'armR'], vars: ['pelvis', 'chest', ...ARM('r'), 'head'], move: 1, lead: 1, pose0: { chest: [20, -35, 0] } },
    air_heavy: { gesture: 'descendingBladeR', label: '背面から斜め下へ手刀', contact: .45, power: 1.23, tip: 'paw.R', at: m => [.02, m.head * .35, m.jab * 1.10], mute: ['armL', 'armR'], vars: ['pelvis', 'chest', ...ARM('r'), 'upperarml', 'forearml', 'head'], lead: 1, pose0: { chest: [20, -30, 0], upperarml: [25, 0, 0] } },
  },
  bullet: {
    stand_weak: { gesture: 'headFlick', label: '顔と肩で小さく突く', contact: .35, power: .92, tip: 'head', at: m => [0, m.head * .86, m.jab * 1.0], mute: ['armL'], vars: ['pelvis', 'spine', 'chest', 'neck', 'head', 'upperarml', 'upperarmr'], move: 1, lead: 1, pose0: { chest: [25, 0, 0], upperarml: [30, 0, 0], upperarmr: [30, 0, 0] } },
    stand_heavy: { gesture: 'tailWideRight', label: '重い尾を大きく横薙ぎ', contact: .46, power: 1.26, tip: 'tail', at: m => [-.02, .26, m.tail * .98], mute: ['armR', 'armL'], vars: ['pelvis', ...TAIL(6), 'chest', 'head'], spin: 1, pose0: { pelvis: [0, 150, 0], chest: [0, -40, 0], head: [0, -40, 0] } },
    crouch_weak: { gesture: 'tailTipSnap', label: '低姿勢の尾先の一閃', contact: .36, power: .93, tip: 'tail', at: m => [.02, .09, m.tail * .80], mute: ['armR'], vars: ['pelvis', ...TAIL(6), 'chest', 'head'], spin: 1, pose0: { pelvis: [0, -150, 0], chest: [0, 40, 0], head: [0, 40, 0] } },
    crouch_heavy: { gesture: 'tailGroundSmash', label: 'しっぽを床に叩き付ける', contact: .50, power: 1.27, tip: 'tail', at: m => [0, .04, m.tail * .98], mute: ['legR', 'armR'], vars: ['pelvis', ...TAIL(6), 'chest', 'head'], spin: 1, pose0: { pelvis: [15, 165, 0], chest: [0, -40, 0], head: [0, -40, 0] } },
    air_weak: { gesture: 'airTailFlick', label: '空中で尾を短く振る', contact: .34, power: .93, tip: 'tail', at: m => [.02, .30, m.tail * .82], mute: ['armL'], vars: ['pelvis', ...TAIL(6), 'chest', 'head'], spin: 1, air: 1, pose0: { pelvis: [0, -150, 0], chest: [0, 40, 0], head: [0, 40, 0] } },
    air_heavy: { gesture: 'airTailLash', label: '前転して尾全体を叩き下ろす', contact: .48, power: 1.23, tip: 'tail', at: m => [0, .02, m.tail * .78], mute: ['armL', 'armR'], vars: ['pelvis', ...TAIL(6), 'chest', 'head', 'thighl', 'thighr'], spin: 1, air: 1, pose0: { pelvis: [140, 0, 0], chest: [20, 0, 0], thighl: [40, 0, 0], thighr: [40, 0, 0] } },
  },
  dark_moguzo: {
    stand_weak: { gesture: 'reverseJabR', label: '闇に紛れた右拳', contact: .28, power: .94, tip: 'paw.R', at: m => [.02, m.head * .74, m.jab * 1.0], mute: ['armL'], vars: ['pelvis', 'chest', ...ARM('r'), 'upperarml', 'head'], lead: 1, pose0: { chest: [0, -30, 0] } },
    crouch_weak: { gesture: 'lowBackfist', label: '返す拳で低く打つ', contact: .30, power: .93, tip: 'paw.R', at: m => [.03, .17, m.jab * 1.10], vars: ['pelvis', 'chest', ...ARM('r'), 'head'], move: 1, lead: 1 },
    crouch_heavy: { gesture: 'shadowRushPunch', label: '低い姿勢から鋭い重拳', contact: .43, power: 1.23, tip: 'paw.R', at: m => [.02, .27, m.jab * 1.25], mute: ['legR', 'armR'], vars: ['pelvis', 'chest', ...ARM('r'), 'upperarml', 'head'], move: 1, lead: 1, pose0: { chest: [-5, -40, 0] } },
    air_weak: { gesture: 'airSpikeFistR', label: '闇の拳を斜め下へ', contact: .32, power: .95, tip: 'paw.R', at: m => [0, m.head * .40, m.jab * 1.0], mute: ['armL'], vars: ['chest', ...ARM('r'), 'upperarml', 'head'], lead: 1, pose0: { chest: [15, -25, 0] } },
    air_heavy: { gesture: 'darkSpinKick', label: '空中で体ごと回る高速蹴り', contact: .47, power: 1.2, tip: 'toe.R', at: m => [0, .16, m.leg * 1.35], mute: ['armL', 'armR'], vars: ['pelvis', 'chest', ...LEG('r'), 'thighl', 'head'], lead: 1, pose0: { pelvis: [-10, 60, 0], chest: [-10, -30, 0], thighr: [-60, 0, 0] } },
  },
};
