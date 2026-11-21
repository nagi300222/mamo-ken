"""キャラ別の体型パラメータ → 関節位置・ボーン・SDFプリミティブ・装飾・配色の定義。
単位はメートル扱い。Z上、正面 -Y、本人の左 +X。レスト姿勢は腕を横に開いたTポーズ寄り（スキニングのため）。"""
import numpy as np
from types import SimpleNamespace as NS
from .sdf import Prim, norm, rot_from_axes

V = lambda *a: np.array(a, dtype=np.float64)
SIDES = (('L', 1.0), ('R', -1.0))

BASE = dict(
    H=0.60,
    # 頭
    head_c=(0, -0.012, 0.490), head_r=(0.112, 0.108, 0.100), head_top_flat=0.3,
    cheek_off=(0.058, -0.030, -0.040), cheek_r=(0.068, 0.064, 0.060),
    muzzle_off=(0, -0.080, -0.030), muzzle_r=(0.056, 0.046, 0.042),
    nose_off=(0, -0.122, -0.008), nose_r=(0.021, 0.013, 0.015),
    chin_off=(0, -0.072, -0.060), chin_r=(0.036, 0.036, 0.022),
    eye_x=0.064, eye_dz=0.022, eye_r=0.0175, eye_sink=0.40,
    ear_off=(0.094, 0.032, 0.062), ear_r=(0.016, 0.010, 0.016),
    brow=0.0,
    # 胴
    neck_c=(0, 0.005, 0.415), neck_r=(0.098, 0.092, 0.070),
    chest_c=(0, 0.0, 0.335), chest_r=(0.118, 0.105, 0.105),
    belly_c=(0, 0.012, 0.172), belly_r=(0.165, 0.145, 0.150),
    shoulder_pad=0.0,                       # 肩の盛り上がり（godan）
    z_pelvis=0.175, z_spine=0.235, z_chest=0.31, z_neck=0.405, z_headbase=0.44,
    # 腕
    sh_x=0.098, sh_z=0.372, arm_down=20.0, ua=0.095, fa=0.090, arm_r=(0.052, 0.046, 0.040),
    fist=(0.080, 0.084, 0.070),             # 長さ・幅・高さ
    # 脚
    hip_x=0.088, hip_y=0.012, hip_z=0.165, thigh=0.105, thigh_dir=(0.30, -0.72, -0.62), thigh_r=(0.088, 0.062),
    ankle_z=0.038, ankle_y=0.016, shin_r=(0.054, 0.042),
    foot_len=0.140, foot_w=0.088, foot_h=0.038, toe_out=18.0,
    # 尻尾
    tail_base=(0, 0.125, 0.080), tail_dir=(0, 0.90, -0.30), tail_len=0.09, tail_r=(0.034, 0.020),
    # 毛束
    tuft_amp=0.0055, tuft_w=0.055, tuft_h=0.050, strand=1.0,
    voxel=0.0035, tris=23000,
    # --- roster9 で追加（既定値は既存3体の見た目を変えない） ---
    tail_n=3, tail_prof=None,          # 尻尾のボーン数と太さの並び
    belly_w=0.80, foot_fade=1.0, grizzle=0.0,
    cap=None, mask=None, blaze=None,   # 頭頂の濃色 / 目のまわりのマスク / 鼻筋の白
)

CHARS = {}
CHARS['moguzo'] = dict(BASE,
    colors=dict(fur=(0.74, 0.57, 0.36), fur_dark=(0.58, 0.42, 0.24), belly=(0.92, 0.80, 0.58), muzzle=(0.93, 0.83, 0.64),
                nose=(0.20, 0.15, 0.13), paw=(0.26, 0.18, 0.13), foot=(0.22, 0.21, 0.21), claw=(0.06, 0.06, 0.06),
                ear_in=(0.45, 0.30, 0.20), cloth=(0.80, 0.08, 0.06), cloth2=(0.80, 0.08, 0.06)),
    belly_patch=1.0, paw_fade=0.28, accessories=['headband'], mouth_curve=-0.28, mouth_w=0.62,
)
CHARS['pisuke'] = dict(BASE,
    H=0.63,
    head_c=(0, -0.012, 0.540), head_r=(0.090, 0.094, 0.084), head_top_flat=0.35,
    cheek_off=(0.040, -0.034, -0.030), cheek_r=(0.050, 0.052, 0.046),
    muzzle_off=(0, -0.090, -0.018), muzzle_r=(0.040, 0.056, 0.033),
    nose_off=(0, -0.143, -0.004), nose_r=(0.016, 0.011, 0.012),
    chin_off=(0, -0.080, -0.046), chin_r=(0.030, 0.038, 0.018),
    eye_x=0.054, eye_dz=0.020, eye_r=0.0155,
    ear_off=(0.068, 0.028, 0.058), ear_r=(0.014, 0.009, 0.015),
    neck_c=(0, 0.004, 0.455), neck_r=(0.074, 0.074, 0.075),
    chest_c=(0, 0.0, 0.365), chest_r=(0.092, 0.086, 0.105),
    belly_c=(0, 0.010, 0.205), belly_r=(0.122, 0.112, 0.160),
    z_pelvis=0.195, z_spine=0.26, z_chest=0.335, z_neck=0.44, z_headbase=0.485,
    sh_x=0.072, sh_z=0.398, arm_down=20.0, ua=0.098, fa=0.098, arm_r=(0.042, 0.036, 0.031), fist=(0.058, 0.058, 0.050),
    hip_x=0.070, hip_y=0.010, hip_z=0.190, thigh=0.125, thigh_dir=(0.24, -0.70, -0.67), thigh_r=(0.068, 0.052),
    ankle_z=0.036, shin_r=(0.048, 0.038), foot_len=0.125, foot_w=0.060, foot_h=0.030, toe_out=14.0,
    tail_base=(0, 0.100, 0.120), tail_dir=(0, 0.92, -0.22), tail_len=0.11, tail_r=(0.034, 0.020),
    tuft_amp=0.004, tuft_w=0.042, tuft_h=0.040, strand=1.25,
    colors=dict(fur=(0.80, 0.66, 0.44), fur_dark=(0.66, 0.52, 0.33), belly=(0.88, 0.77, 0.56), muzzle=(0.88, 0.78, 0.60),
                nose=(0.12, 0.10, 0.10), paw=(0.90, 0.80, 0.62), foot=(0.90, 0.80, 0.62), claw=(0.07, 0.06, 0.06),
                ear_in=(0.55, 0.40, 0.28), cloth=(0.07, 0.30, 0.80), cloth2=(0.07, 0.30, 0.80)),
    belly_patch=0.35, paw_fade=0.2, accessories=['wristbands'], mouth_curve=0.12, mouth_w=0.6, wristband=dict(width=0.036, thick=0.008),
)
CHARS['godan'] = dict(BASE,
    H=0.66,
    head_c=(0, -0.022, 0.560), head_r=(0.114, 0.108, 0.096), head_top_flat=0.3,
    cheek_off=(0.056, -0.032, -0.040), cheek_r=(0.066, 0.062, 0.058),
    muzzle_off=(0, -0.084, -0.030), muzzle_r=(0.064, 0.048, 0.046),
    nose_off=(0, -0.130, -0.008), nose_r=(0.026, 0.014, 0.018),
    chin_off=(0, -0.074, -0.068), chin_r=(0.052, 0.038, 0.024),
    eye_x=0.058, eye_dz=0.026, eye_r=0.0125, brow=1.0,
    ear_off=(0.092, 0.032, 0.066), ear_r=(0.017, 0.010, 0.016),
    neck_c=(0, 0.012, 0.465), neck_r=(0.135, 0.115, 0.080),
    chest_c=(0, 0.0, 0.375), chest_r=(0.170, 0.132, 0.120), shoulder_pad=1.0,
    belly_c=(0, 0.010, 0.200), belly_r=(0.190, 0.160, 0.160),
    z_pelvis=0.19, z_spine=0.25, z_chest=0.335, z_neck=0.455, z_headbase=0.50,
    sh_x=0.150, sh_z=0.420, arm_down=22.0, ua=0.115, fa=0.105, arm_r=(0.074, 0.064, 0.054), fist=(0.092, 0.098, 0.082),
    hip_x=0.108, hip_y=0.012, hip_z=0.175, thigh=0.115, thigh_dir=(0.36, -0.70, -0.62), thigh_r=(0.100, 0.070),
    ankle_z=0.042, shin_r=(0.062, 0.048), foot_len=0.150, foot_w=0.095, foot_h=0.042, toe_out=24.0,
    tail_base=(0, 0.145, 0.110), tail_dir=(0, 0.9, -0.35), tail_len=0.11, tail_r=(0.050, 0.030),
    tuft_amp=0.008, tuft_w=0.066, tuft_h=0.058, strand=0.8, tris=26000,
    colors=dict(fur=(0.40, 0.26, 0.14), fur_dark=(0.28, 0.18, 0.10), belly=(0.70, 0.52, 0.28), muzzle=(0.74, 0.58, 0.34),
                nose=(0.07, 0.06, 0.06), paw=(0.20, 0.14, 0.10), foot=(0.19, 0.14, 0.11), claw=(0.10, 0.10, 0.10),
                ear_in=(0.25, 0.16, 0.10), cloth=(0.06, 0.06, 0.07), cloth2=(0.07, 0.07, 0.08), brow=(0.62, 0.46, 0.26)),
    belly_patch=1.0, paw_fade=0.25, accessories=['belt', 'wristbands'], mouth_curve=-0.6, mouth_w=0.75, wristband=dict(width=0.032, thick=0.005),
)

CHARS['hakuma'] = dict(BASE,           # 大柄で丸い。灰色の背、クリーム色の腹と顔、目のまわりが濃い。緑のスカーフ
    H=0.70,
    head_c=(0, -0.016, 0.585), head_r=(0.118, 0.112, 0.102), head_top_flat=0.3,
    cheek_off=(0.064, -0.030, -0.042), cheek_r=(0.076, 0.068, 0.064),
    muzzle_off=(0, -0.084, -0.030), muzzle_r=(0.058, 0.048, 0.044),
    nose_off=(0, -0.128, -0.008), nose_r=(0.023, 0.014, 0.016),
    chin_off=(0, -0.074, -0.064), chin_r=(0.042, 0.038, 0.024),
    eye_x=0.064, eye_dz=0.026, eye_r=0.0150,
    ear_off=(0.096, 0.030, 0.072), ear_r=(0.019, 0.011, 0.019),
    neck_c=(0, 0.008, 0.490), neck_r=(0.125, 0.115, 0.080),
    chest_c=(0, 0.0, 0.395), chest_r=(0.160, 0.140, 0.125),
    belly_c=(0, 0.005, 0.215), belly_r=(0.215, 0.185, 0.185),
    z_pelvis=0.205, z_spine=0.27, z_chest=0.36, z_neck=0.475, z_headbase=0.52,
    sh_x=0.130, sh_z=0.435, arm_down=22.0, ua=0.105, fa=0.100, arm_r=(0.064, 0.056, 0.048), fist=(0.085, 0.090, 0.072),
    hip_x=0.112, hip_y=0.010, hip_z=0.185, thigh=0.115, thigh_dir=(0.34, -0.70, -0.63), thigh_r=(0.108, 0.074),
    ankle_z=0.042, shin_r=(0.064, 0.050), foot_len=0.150, foot_w=0.098, foot_h=0.042, toe_out=22.0,
    tail_base=(0, 0.165, 0.100), tail_dir=(0, 0.9, -0.30), tail_len=0.10, tail_r=(0.048, 0.030),
    tuft_amp=0.006, tuft_w=0.060, tuft_h=0.055, tris=27000,
    colors=dict(fur=(0.52, 0.52, 0.52), fur_dark=(0.38, 0.38, 0.39), belly=(0.93, 0.88, 0.74), muzzle=(0.95, 0.90, 0.78),
                nose=(0.12, 0.11, 0.11), paw=(0.24, 0.22, 0.22), foot=(0.80, 0.72, 0.60), claw=(0.12, 0.11, 0.11),
                ear_in=(0.20, 0.18, 0.18), cloth=(0.13, 0.32, 0.20), cloth2=(0.13, 0.32, 0.20), tail=(0.26, 0.25, 0.25), mask=(0.24, 0.22, 0.22), ear=(0.26, 0.24, 0.24)),
    belly_patch=1.0, belly_w=1.0, paw_fade=0.30, accessories=['scarf'], mask=dict(r=1.7, dx=0.25, dz=-0.75), mouth_curve=-0.15, mouth_w=0.6,
)
CHARS['chirka'] = dict(BASE,           # 小柄で金色。頭頂から鼻筋が焦げ茶、腹が赤茶。紫のひもと房飾り
    H=0.58,
    head_c=(0, -0.012, 0.478), head_r=(0.100, 0.100, 0.092), head_top_flat=0.3,
    cheek_off=(0.052, -0.030, -0.036), cheek_r=(0.060, 0.058, 0.054),
    muzzle_off=(0, -0.084, -0.026), muzzle_r=(0.046, 0.050, 0.038),
    nose_off=(0, -0.130, -0.006), nose_r=(0.019, 0.012, 0.014),
    chin_off=(0, -0.076, -0.054), chin_r=(0.032, 0.036, 0.020),
    eye_x=0.058, eye_dz=0.022, eye_r=0.0165,
    ear_off=(0.084, 0.030, 0.064), ear_r=(0.021, 0.011, 0.021),
    neck_c=(0, 0.004, 0.400), neck_r=(0.086, 0.082, 0.068),
    chest_c=(0, 0.0, 0.320), chest_r=(0.104, 0.094, 0.100),
    belly_c=(0, 0.010, 0.178), belly_r=(0.142, 0.128, 0.148),
    z_pelvis=0.17, z_spine=0.228, z_chest=0.298, z_neck=0.388, z_headbase=0.425,
    sh_x=0.086, sh_z=0.356, ua=0.092, fa=0.090, arm_r=(0.046, 0.040, 0.034), fist=(0.066, 0.068, 0.056),
    hip_x=0.078, hip_y=0.010, hip_z=0.165, thigh=0.108, thigh_dir=(0.27, -0.71, -0.65), thigh_r=(0.074, 0.054),
    ankle_z=0.036, shin_r=(0.048, 0.038), foot_len=0.125, foot_w=0.072, foot_h=0.034, toe_out=16.0,
    tail_base=(0, 0.112, 0.095), tail_dir=(0, 0.92, -0.20), tail_len=0.13, tail_r=(0.044, 0.030),
    tuft_amp=0.006, tuft_w=0.040, tuft_h=0.040, strand=1.2,
    colors=dict(fur=(0.86, 0.64, 0.26), fur_dark=(0.72, 0.50, 0.18), belly=(0.62, 0.30, 0.14), muzzle=(0.90, 0.72, 0.36),
                nose=(0.10, 0.08, 0.08), paw=(0.24, 0.20, 0.18), foot=(0.26, 0.21, 0.18), claw=(0.10, 0.09, 0.09),
                ear_in=(0.20, 0.14, 0.10), cloth=(0.36, 0.16, 0.48), cloth2=(0.36, 0.16, 0.48), tail=(0.28, 0.19, 0.12), cap=(0.30, 0.20, 0.13), ear=(0.28, 0.19, 0.12)),
    belly_patch=1.0, belly_w=0.72, paw_fade=0.30, accessories=['necklace'], necklace=dict(pendant='tassel'),
    cap=dict(z0=0.46, stripe=0.017), mouth_curve=0.10, mouth_w=0.6,
)
CHARS['takimaru'] = dict(BASE,         # 最も背が高い。灰白のごま塩毛、黒い頭に白い鼻筋、黒い腕と足。黄色い縄のたすき
    H=0.74,
    head_c=(0, -0.018, 0.628), head_r=(0.110, 0.108, 0.098), head_top_flat=0.3,
    cheek_off=(0.060, -0.030, -0.040), cheek_r=(0.070, 0.064, 0.060),
    muzzle_off=(0, -0.086, -0.030), muzzle_r=(0.054, 0.050, 0.044),
    nose_off=(0, -0.132, -0.008), nose_r=(0.024, 0.014, 0.017),
    chin_off=(0, -0.076, -0.064), chin_r=(0.040, 0.038, 0.024),
    eye_x=0.058, eye_dz=0.026, eye_r=0.0145,
    ear_off=(0.090, 0.032, 0.068), ear_r=(0.017, 0.010, 0.017),
    neck_c=(0, 0.008, 0.530), neck_r=(0.120, 0.108, 0.080),
    chest_c=(0, 0.0, 0.435), chest_r=(0.158, 0.130, 0.125), shoulder_pad=1.0,
    belly_c=(0, 0.008, 0.235), belly_r=(0.185, 0.160, 0.195),
    z_pelvis=0.225, z_spine=0.295, z_chest=0.39, z_neck=0.515, z_headbase=0.56,
    sh_x=0.142, sh_z=0.480, arm_down=22.0, ua=0.125, fa=0.118, arm_r=(0.066, 0.058, 0.050), fist=(0.092, 0.096, 0.076),
    hip_x=0.105, hip_y=0.010, hip_z=0.205, thigh=0.130, thigh_dir=(0.33, -0.70, -0.64), thigh_r=(0.098, 0.070),
    ankle_z=0.044, shin_r=(0.062, 0.050), foot_len=0.155, foot_w=0.098, foot_h=0.044, toe_out=22.0,
    tail_base=(0, 0.145, 0.115), tail_dir=(0, 0.9, -0.30), tail_len=0.10, tail_r=(0.046, 0.030),
    tuft_amp=0.007, tuft_w=0.056, tuft_h=0.052, tris=28000,
    colors=dict(fur=(0.68, 0.68, 0.69), fur_dark=(0.44, 0.44, 0.46), belly=(0.86, 0.86, 0.86), muzzle=(0.94, 0.94, 0.93),
                nose=(0.08, 0.08, 0.08), paw=(0.07, 0.07, 0.08), foot=(0.09, 0.09, 0.10), claw=(0.34, 0.36, 0.40),
                ear_in=(0.14, 0.14, 0.15), cloth=(0.90, 0.66, 0.10), cloth2=(0.90, 0.66, 0.10), tail=(0.20, 0.20, 0.21), cap=(0.20, 0.20, 0.22), mask=(0.13, 0.13, 0.14),
                blaze=(0.95, 0.95, 0.94), ear=(0.18, 0.18, 0.19)),
    belly_patch=0.6, belly_w=0.9, paw_fade=1.25, foot_fade=2.4, grizzle=0.35, accessories=['sash'],
    cap=dict(z0=0.20, stripe=0.0), blaze=dict(w=0.020), mask=dict(r=1.9, dx=0.1, dz=-0.2), mouth_curve=-0.05, mouth_w=0.6,
)
CHARS['yomikage'] = dict(BASE,         # 中背でやや細身。暗いオリーブ灰のごま塩毛、胸と口元が黄土色。左前腕に白い包帯
    H=0.64,
    head_c=(0, -0.014, 0.530), head_r=(0.102, 0.104, 0.092), head_top_flat=0.35,
    cheek_off=(0.052, -0.030, -0.036), cheek_r=(0.060, 0.058, 0.054),
    muzzle_off=(0, -0.086, -0.024), muzzle_r=(0.046, 0.052, 0.038),
    nose_off=(0, -0.134, -0.006), nose_r=(0.019, 0.012, 0.014),
    chin_off=(0, -0.076, -0.052), chin_r=(0.032, 0.036, 0.020),
    eye_x=0.058, eye_dz=0.022, eye_r=0.0150,
    ear_off=(0.084, 0.030, 0.062), ear_r=(0.015, 0.009, 0.015),
    neck_c=(0, 0.004, 0.448), neck_r=(0.090, 0.086, 0.072),
    chest_c=(0, 0.0, 0.362), chest_r=(0.110, 0.098, 0.108),
    belly_c=(0, 0.010, 0.200), belly_r=(0.148, 0.132, 0.165),
    z_pelvis=0.19, z_spine=0.255, z_chest=0.335, z_neck=0.435, z_headbase=0.475,
    sh_x=0.090, sh_z=0.400, ua=0.100, fa=0.098, arm_r=(0.048, 0.042, 0.036), fist=(0.070, 0.072, 0.060),
    hip_x=0.080, hip_y=0.010, hip_z=0.180, thigh=0.118, thigh_dir=(0.27, -0.71, -0.65), thigh_r=(0.078, 0.056),
    ankle_z=0.038, shin_r=(0.050, 0.040), foot_len=0.135, foot_w=0.078, foot_h=0.036, toe_out=16.0,
    tail_base=(0, 0.118, 0.100), tail_dir=(0, 0.92, -0.25), tail_len=0.11, tail_r=(0.038, 0.024),
    tuft_amp=0.0055, tuft_w=0.044, tuft_h=0.042, strand=1.3,
    colors=dict(fur=(0.37, 0.34, 0.27), fur_dark=(0.24, 0.22, 0.18), belly=(0.68, 0.62, 0.45), muzzle=(0.76, 0.70, 0.56),
                nose=(0.20, 0.17, 0.16), paw=(0.42, 0.36, 0.30), foot=(0.50, 0.44, 0.36), claw=(0.20, 0.18, 0.16),
                ear_in=(0.20, 0.16, 0.13), cloth=(0.88, 0.86, 0.78), cloth2=(0.88, 0.86, 0.78)),
    belly_patch=0.75, belly_w=0.70, paw_fade=0.20, grizzle=0.40, accessories=['wristbands'], wristband=dict(width=0.080, thick=0.004, sides='L'),
    mouth_curve=-0.10, mouth_w=0.6,
)
CHARS['bullet'] = dict(BASE,           # 標準体型。赤みのある橙色。体と同じくらい長い尻尾（6ボーン）。木の玉の首飾り
    H=0.62,
    head_c=(0, -0.012, 0.508), head_r=(0.108, 0.106, 0.098), head_top_flat=0.3,
    muzzle_off=(0, -0.082, -0.028), muzzle_r=(0.052, 0.048, 0.040),
    nose_off=(0, -0.124, -0.008), nose_r=(0.020, 0.013, 0.014),
    eye_x=0.062, eye_dz=0.024, eye_r=0.0160,
    ear_off=(0.090, 0.030, 0.066), ear_r=(0.015, 0.009, 0.015),
    neck_c=(0, 0.005, 0.430), neck_r=(0.098, 0.092, 0.072),
    chest_c=(0, 0.0, 0.348), chest_r=(0.120, 0.106, 0.108),
    belly_c=(0, 0.012, 0.180), belly_r=(0.165, 0.145, 0.158),
    z_pelvis=0.18, z_spine=0.242, z_chest=0.32, z_neck=0.418, z_headbase=0.455,
    sh_x=0.100, sh_z=0.385,
    hip_x=0.088, hip_y=0.012, hip_z=0.168,
    tail_base=(0, 0.135, 0.108), tail_dir=(0, 1.0, 0.0), tail_len=0.52, tail_n=6, tail_prof=[0.046, 0.058, 0.064, 0.064, 0.058, 0.046, 0.026],
    colors=dict(fur=(0.80, 0.42, 0.14), fur_dark=(0.62, 0.28, 0.08), belly=(0.90, 0.56, 0.24), muzzle=(0.90, 0.60, 0.30),
                nose=(0.20, 0.14, 0.12), paw=(0.36, 0.24, 0.16), foot=(0.78, 0.58, 0.38), claw=(0.20, 0.14, 0.10),
                ear_in=(0.45, 0.22, 0.10), cloth=(0.62, 0.44, 0.26), cloth2=(0.62, 0.44, 0.26), tail=(0.44, 0.19, 0.07)),
    belly_patch=0.8, paw_fade=0.28, accessories=['necklace'], necklace=dict(pendant='beads'), mouth_curve=-0.2, mouth_w=0.6,
)
CHARS['dark_moguzo'] = dict(CHARS['moguzo'],   # moguzo と同じ体型。ほぼ黒の焦げ茶、腹は灰茶。暗い赤のハチマキ
    tuft_amp=0.007,
    colors=dict(fur=(0.21, 0.17, 0.16), fur_dark=(0.12, 0.10, 0.10), belly=(0.47, 0.41, 0.38), muzzle=(0.43, 0.37, 0.34),
                nose=(0.06, 0.05, 0.05), paw=(0.07, 0.06, 0.06), foot=(0.10, 0.09, 0.09), claw=(0.03, 0.03, 0.03),
                ear_in=(0.10, 0.08, 0.08), cloth=(0.50, 0.07, 0.08), cloth2=(0.50, 0.07, 0.08)),
    mouth_curve=-0.45,
)
ROSTER = ['moguzo', 'pisuke', 'godan', 'hakuma', 'chirka', 'takimaru', 'yomikage', 'bullet', 'dark_moguzo']

def torso_knots(P):
    z0, z1 = P.hip_z - 0.03, P.z_headbase + 0.03
    t = lambda z: (z - z0) / (z1 - z0)
    return (V(0, 0, z0), V(0, 0, z1)), [
        (t(P.z_pelvis - 0.01), {'pelvis': 1}), (t((P.z_spine + P.z_chest) / 2), {'spine': 1}),
        (t((P.z_chest + P.z_neck) / 2 + 0.005), {'chest': 1}), (t((P.z_neck + P.z_headbase) / 2), {'neck': 1}),
        (t(P.z_headbase + 0.025), {'head': 1})]

def build(cid):
    """キャラID → 仕様（関節 J、ボーン表 bones、プリミティブ prims、計測値 M ほか）"""
    P = NS(**CHARS[cid]); P.id = cid
    J = {}; prims = []
    hc = V(*P.head_c)
    J['root_ground'] = V(0, 0, 0)
    J['pelvis'] = V(0, P.hip_y, P.z_pelvis); J['spine'] = V(0, P.hip_y * 0.5, P.z_spine); J['chest'] = V(0, 0, P.z_chest)
    J['neck'] = V(0, 0, P.z_neck); J['head'] = V(0, -0.004, P.z_headbase); J['head_top'] = V(0, -0.004, P.H)
    J['jaw'] = hc + V(0, -P.head_r[1] * 0.30, -P.head_r[2] * 0.50); J['jaw_tip'] = hc + V(*P.chin_off) + V(0, -P.chin_r[1] * 0.8, 0)
    ax, tk = torso_knots(P)
    add = lambda *a, **k: prims.append(Prim(*a, **k))
    HEAD = [(0, {'head': 1})]
    # --- 胴 ---
    add('belly', 'ell', 'torso', k=0.03, center=P.belly_c, radii=P.belly_r, axis=ax, knots=tk, tuft=1.0, flow='v')
    add('chest', 'ell', 'torso', k=0.04, center=P.chest_c, radii=P.chest_r, axis=ax, knots=tk, tuft=1.0, flow='v')
    add('neckmass', 'ell', 'torso', k=0.04, center=P.neck_c, radii=P.neck_r, axis=ax, knots=tk, tuft=0.9, flow='v')
    # --- 頭 ---
    hr = V(*P.head_r)
    add('skull', 'ell', 'head', k=0.035, center=hc, radii=hr, knots=HEAD, tuft=0.35, flow='v')
    if P.head_top_flat:
        add('skullflat', 'ell', 'head', k=0.03, center=hc + V(0, 0.01, hr[2] * 0.25), radii=hr * V(0.95, 1.0, 0.72), knots=HEAD, tuft=0.3, flow='v')
    for sn, s in SIDES:
        add('cheek.' + sn, 'ell', 'cheek', k=0.03, center=hc + V(s * P.cheek_off[0], P.cheek_off[1], P.cheek_off[2]), radii=P.cheek_r, knots=HEAD, tuft=0.75, flow='v')
    add('muzzle', 'ell', 'muzzle', k=0.022, center=hc + V(*P.muzzle_off), radii=P.muzzle_r, knots=HEAD, tuft=0.06, flow='v')
    add('chin', 'ell', 'chin', k=0.018, center=hc + V(*P.chin_off), radii=P.chin_r, knots=[(0, {'jaw': 0.85, 'head': 0.15})], tuft=0.15, flow='v')
    add('nose', 'ell', 'nose', k=0.006, fur=False, center=hc + V(*P.nose_off), radii=P.nose_r, knots=HEAD, tuft=0, flow='v')
    for sn, s in SIDES:
        ec = hc + V(s * P.ear_off[0], P.ear_off[1], P.ear_off[2])
        R = rot_from_axes(x=(1, s * 0.5, 0), z=(s * 0.7, 0, 1))
        add('ear.' + sn, 'ell', 'ear', k=0.012, center=ec, radii=P.ear_r, R=R, knots=HEAD, tuft=0, flow='v')
        add('earhole.' + sn, 'ell', 'ear', k=0.008, op='sub', center=ec + V(s * 0.004, -P.ear_r[1] * 1.25, -0.003), radii=V(*P.ear_r) * V(0.62, 0.9, 0.62), R=R, knots=HEAD, tuft=0, flow='v')
        if P.brow:                     # 怒り眉の盛り上がり（内側が低い）。頭の表面に沿わせて半分埋める
            def onskull(x, z, sink=0.006):
                q = max(0.0, 1 - (x / hr[0]) ** 2 - ((z - hc[2]) / hr[2]) ** 2); return V(x, hc[1] - hr[1] * np.sqrt(q) + sink, z)
            ez = hc[2] + P.eye_dz
            add('brow.' + sn, 'cap', 'brow', k=0.008, a=onskull(s * P.eye_x * 0.34, ez + P.eye_r * 1.7, 0.001), b=onskull(s * P.eye_x * 1.55, ez + P.eye_r * 3.3, 0.001),
                ra=0.015, rb=0.010, knots=HEAD, tuft=0, flow='v')
    # --- 腕（左右） ---
    ad = np.radians(P.arm_down)
    for sn, s in SIDES:
        S = V(s * P.sh_x, 0, P.sh_z); dU = norm(V(s * np.cos(ad), 0.06, -np.sin(ad))); E = S + P.ua * dU
        dF = norm(V(s * np.cos(ad), -0.30, -np.sin(ad))); W = E + P.fa * dF
        L, Wd, Hh = P.fist
        J['shoulder.' + sn] = V(s * 0.028, 0.0, P.sh_z + 0.012); J['upper_arm.' + sn] = S; J['forearm.' + sn] = E
        J['wrist.' + sn] = W; J['paw.' + sn] = W + dF * L * 0.22; J['paw_tip.' + sn] = W + dF * L
        hx = dF; hz = norm(V(0, 0, 1) - hx * hx[2]); hy = -s * np.cross(hz, hx)   # y=親指側(正面 -Y)。左手は鏡像になる
        hand_R = np.stack([hx, hy, hz], axis=1)             # 列: x=指先方向, y=親指側, z=手の甲
        J['hand_R.' + sn] = hand_R
        r0, r1, r2 = P.arm_r
        if P.shoulder_pad:
            add('shpad.' + sn, 'ell', 'arm' + sn, k=0.04, center=S + V(s * 0.005, 0.005, 0.012), radii=V(r0 * 1.12, r0 * 1.1, r0 * 1.02),
                knots=[(0, {'shoulder.' + sn: 0.6, 'chest': 0.4})], tuft=1.0, flow='a' + sn)
        add('uarm.' + sn, 'cap', 'arm' + sn, k=0.035, a=S, b=E, ra=r0, rb=r1, tuft=0.9, flow='a' + sn,
            knots=[(0, {'shoulder_fix.' + sn: 0.75, 'shoulder.' + sn: 0.25}), (0.42, {'upper_arm.' + sn: 0.85, 'shoulder_fix.' + sn: 0.15}),
                   (0.72, {'upper_arm.' + sn: 1}), (1.0, {'upper_arm.' + sn: 0.5, 'forearm.' + sn: 0.5})])
        add('farm.' + sn, 'cap', 'arm' + sn, k=0.02, a=E, b=W, ra=r1, rb=r2, tuft=0.8, flow='a' + sn,
            knots=[(0, {'upper_arm.' + sn: 0.5, 'forearm.' + sn: 0.5}), (0.3, {'forearm.' + sn: 1}), (0.6, {'forearm.' + sn: 0.5, 'forearm_twist.' + sn: 0.5}),
                   (0.88, {'forearm_twist.' + sn: 0.75, 'wrist.' + sn: 0.25}), (1.0, {'wrist.' + sn: 0.7, 'forearm_twist.' + sn: 0.3})])
        # 拳: ローカル x=指先方向, y=親指側, z=手の甲
        hp = lambda x, y, z: W + hand_R @ V(x * L, y * Wd, z * Hh)
        PAW = [(0, {'paw.' + sn: 1})]
        add('palm.' + sn, 'box', 'fist' + sn, k=0.014, fur=False, center=hp(0.44, 0, 0.0), half=V(0.26 * L, 0.30 * Wd, 0.24 * Hh), r=0.2 * Hh, R=hand_R,
            knots=[(0, {'paw.' + sn: 0.8, 'wrist.' + sn: 0.2})], tuft=0, flow='a' + sn)
        fr = 0.128 * Wd
        for i, y in enumerate((0.36, 0.12, -0.12, -0.36)):
            sc = (1.0, 1.05, 1.0, 0.88)[i]
            add('fingA%d.%s' % (i, sn), 'cap', 'fingers' + sn, k=0.0045, fur=False, a=hp(0.66, y, 0.30), b=hp(0.97 * sc, y, -0.04), ra=fr, rb=fr * 0.95, knots=PAW, tuft=0, flow='a' + sn)
            add('fingB%d.%s' % (i, sn), 'cap', 'fingers' + sn, k=0.0045, fur=False, a=hp(0.97 * sc, y, -0.04), b=hp(0.66, y * 0.96, -0.40), ra=fr * 0.95, rb=fr * 0.85, knots=PAW, tuft=0, flow='a' + sn)
            add('claw%d.%s' % (i, sn), 'ell', 'fclaws' + sn, k=0.002, fur=False, center=hp(0.60, y * 0.96, -0.47), radii=V(fr * 0.75, fr * 0.5, fr * 0.5), R=hand_R, knots=PAW, tuft=0, flow='a' + sn)
        add('thumb.' + sn, 'cap', 'fingers' + sn, k=0.006, fur=False, a=hp(0.26, 0.40, -0.12), b=hp(0.74, 0.30, -0.46), ra=fr * 1.1, rb=fr * 0.95, knots=PAW, tuft=0, flow='a' + sn)
    # --- 脚（左右） ---
    for sn, s in SIDES:
        Hp = V(s * P.hip_x, P.hip_y, P.hip_z); td = norm(V(s * P.thigh_dir[0], P.thigh_dir[1], P.thigh_dir[2])); K = Hp + P.thigh * td
        A = V(K[0] + s * 0.006, P.hip_y + P.ankle_y, P.ankle_z)
        yaw = np.radians(P.toe_out); fd = V(s * np.sin(yaw), -np.cos(yaw), 0); fs = V(np.cos(yaw), s * np.sin(yaw), 0) * s
        G = V(A[0], A[1], 0)
        ball = G + fd * P.foot_len * 0.52 + V(0, 0, P.foot_h * 0.35); tip = G + fd * P.foot_len * 0.86 + V(0, 0, P.foot_h * 0.3)
        J['thigh.' + sn] = Hp; J['shin.' + sn] = K; J['ankle.' + sn] = A
        J['foot.' + sn] = A + (ball - A) * 0.30; J['toe.' + sn] = ball; J['toe_tip.' + sn] = tip; J['foot_dir.' + sn] = fd
        t0, t1 = P.thigh_r; s0, s1 = P.shin_r
        add('thigh.' + sn, 'cap', 'leg' + sn, k=0.04, a=Hp, b=K, ra=t0, rb=t1, tuft=1.0, flow='v',
            knots=[(0, {'pelvis': 0.25, 'thigh_fix.' + sn: 0.60, 'thigh.' + sn: 0.15}), (0.4, {'thigh.' + sn: 0.8, 'thigh_fix.' + sn: 0.2}), (0.75, {'thigh.' + sn: 1}), (1.0, {'thigh.' + sn: 0.5, 'shin.' + sn: 0.5})])
        add('shin.' + sn, 'cap', 'leg' + sn, k=0.025, a=K, b=A, ra=s0, rb=s1, tuft=0.8, flow='v',
            knots=[(0, {'thigh.' + sn: 0.5, 'shin.' + sn: 0.5}), (0.3, {'shin.' + sn: 1}), (0.8, {'shin.' + sn: 1}), (1.0, {'shin.' + sn: 0.4, 'ankle.' + sn: 0.6})])
        fR = rot_from_axes(x=fs, y=fd)                                  # 列: 横, 前, 上
        fax = (G - fd * P.foot_len * 0.2, G + fd * P.foot_len * 0.95)
        fk = [(0, {'ankle.' + sn: 1}), (0.28, {'ankle.' + sn: 0.6, 'foot.' + sn: 0.4}), (0.50, {'foot.' + sn: 1}), (0.62, {'foot.' + sn: 0.5, 'toe.' + sn: 0.5}), (0.78, {'toe.' + sn: 1})]
        add('sole.' + sn, 'box', 'foot' + sn, k=0.018, fur=False, center=G + fd * P.foot_len * 0.26 + V(0, 0, P.foot_h * 0.5),
            half=V(P.foot_w * 0.30, P.foot_len * 0.36, P.foot_h * 0.18), r=P.foot_h * 0.32, R=fR, axis=fax, knots=fk, tuft=0, flow='v')
        tr = P.foot_w * 0.135
        for i, o in enumerate((-0.36, -0.12, 0.12, 0.36)):
            a = G + fd * P.foot_len * 0.50 + fs * o * P.foot_w * 0.85 + V(0, 0, tr * 1.25)
            fan = norm(fd + fs * o * 0.42); ln = P.foot_len * (0.30, 0.36, 0.36, 0.30)[i]
            b = a + fan * ln; b[2] = tr * 1.0
            add('toe%d.%s' % (i, sn), 'cap', 'toes' + sn, k=0.006, fur=False, a=a, b=b, ra=tr * 1.15, rb=tr, axis=fax, knots=fk, tuft=0, flow='v')
            c1 = b + fan * tr * 2.3; c1[2] = tr * 0.35
            add('tclaw%d.%s' % (i, sn), 'cap', 'tclaws' + sn, k=0.002, fur=False, a=b + fan * tr * 0.3, b=c1, ra=tr * 0.62, rb=tr * 0.22, knots=[(0, {'toe.' + sn: 1})], tuft=0, flow='v')
    # --- 尻尾 ---
    tb = V(*P.tail_base); tdv = norm(V(*P.tail_dir)); n = P.tail_n; seg = P.tail_len / n
    prof = P.tail_prof or [P.tail_r[0] + (P.tail_r[1] - P.tail_r[0]) * i / n for i in range(n + 1)]
    names = ['tail_%02d' % (i + 1) for i in range(n)]
    for i in range(n):
        a = tb + tdv * seg * i; b = tb + tdv * seg * (i + 1) + (V(0, 0, -0.004 * i) if n == 3 else 0)
        J[names[i]] = a
        prev = 'pelvis' if i == 0 else names[i - 1]; cur = names[i]
        add('tail%d' % i, 'cap', 'tail', k=0.03, a=a, b=b, ra=prof[i], rb=prof[i + 1], tuft=1.3, flow='t',
            knots=[(0, {prev: 0.5, cur: 0.5}), (0.5, {cur: 1}), (1.0, {cur: 1})] if i < n - 1 else [(0, {prev: 0.5, cur: 0.5}), (0.4, {cur: 1})])
    J['tail_tip'] = tb + tdv * P.tail_len
    # --- 目（別メッシュ）。位置は後で表面に合わせる ---
    P.eyes = [V(s * P.eye_x, hc[1] - hr[1], hc[2] + P.eye_dz) for _, s in SIDES]
    # --- 計測値（モーション側が体格に合わせて使う） ---
    M = NS(arm=P.ua + P.fa, leg=float(P.thigh + np.linalg.norm(J['ankle.L'] - J['shin.L'])), thigh=P.thigh, shin=float(np.linalg.norm(J['ankle.L'] - J['shin.L'])),
           hip_x=P.hip_x, sh_x=P.sh_x, H=P.H, fist_len=P.fist[0], foot_len=P.foot_len, ankle_z=P.ankle_z, toe_out=P.toe_out)
    return NS(id=cid, P=P, J=J, prims=prims, M=M, tail_names=names)
