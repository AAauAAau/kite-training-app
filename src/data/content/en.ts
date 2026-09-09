import type { Content } from './de';
import type { DeepPartial } from '../../logic/localize';

// Englische Domain-Copy. Nach denselben IDs verschlüsselt wie `src/data/seed.ts`,
// zur Renderzeit über `src/logic/localize.ts` aufgelöst. Kite-Fachbegriffe
// (Tail Grab, One Footer, Board Off by Fin/Handle …) bleiben unübersetzt.
// Vollständigkeit gegen den Seed sichert `src/data/content/content.test.ts`.
export const content: DeepPartial<Content> = {
  exercises: {
    'trap-bar-deadlift': { name: 'Trap-Bar Deadlift' },
    'bulgarian-split-squat': { name: 'Bulgarian Split Squat' },
    'bench-or-ohp': { name: 'Bench Press / Overhead Press' },
    'nordic-negative': { name: 'Nordic Curl (negative)' },
    'suitcase-carry': { name: 'Suitcase Carry (single-arm) · 40 m' },
    'weighted-pullup': { name: 'Weighted Pull-ups' },
    'front-squat-or-stepdown': { name: 'Front Squat / Box Step-down' },
    'barbell-row': { name: 'Barbell Row' },
    'single-leg-rdl': { name: 'Single-Leg RDL' },
    'pallof-press': { name: 'Pallof Press' },
    'copenhagen-plank': { name: 'Copenhagen Plank' },
    'back-extension-45': { name: 'Back Extension 45°' },
    'bird-dog': { name: 'Bird Dog' },
    'side-plank': { name: 'Side Plank' },
    'kb-swing': { name: 'KB Swing (single-arm)' },
    'kb-clean-press': { name: 'KB Clean & Press (single-arm)' },
    'kb-windmill': { name: 'KB Windmill' },
    'romanian-deadlift': { name: 'Romanian Deadlift' },
    'hip-thrust': { name: 'Hip Thrust' },
    'kb-deadlift': { name: 'Kettlebell Deadlift' },
    'back-squat': { name: 'Back Squat' },
    'goblet-squat': { name: 'Goblet Squat' },
    'leg-press': { name: 'Leg Press' },
    'reverse-lunge': { name: 'Reverse Lunge' },
    'dumbbell-step-up': { name: 'Step-up' },
    'pistol-squat': { name: 'Pistol Squat' },
    'db-bench-press': { name: 'Dumbbell Bench Press' },
    'machine-chest-press': { name: 'Machine Chest Press' },
    'weighted-pushup': { name: 'Weighted Push-up' },
    'db-shoulder-press': { name: 'Dumbbell Shoulder Press' },
    'push-press': { name: 'Push Press' },
    'pike-pushup': { name: 'Pike Push-up' },
    pullup: { name: 'Pull-ups' },
    'lat-pulldown': { name: 'Lat Pulldown' },
    'assisted-pullup': { name: 'Assisted Pull-up (machine)' },
    'seal-row': { name: 'Seal Row' },
    'db-row': { name: 'Dumbbell Row' },
    'inverted-row': { name: 'Inverted Row' },
    'farmers-carry': { name: "Farmer's Carry · 40 m" },
    'front-rack-carry': { name: 'Front-Rack Carry (single-arm) · 40 m' },
    'waiter-carry': { name: 'Waiter Carry (single-arm) · 40 m' },
    'dead-bug': { name: 'Dead Bug' },
    'plank-shoulder-tap': { name: 'Plank Shoulder Tap' },
    'suitcase-hold': { name: 'Suitcase Hold (single-arm)' },
    'side-plank-row': { name: 'Side Plank Row' },
    'slider-leg-curl': { name: 'Slider Leg Curl' },
    'machine-leg-curl': { name: 'Machine Leg Curl' },
    'glute-ham-raise': { name: 'Glute-Ham Raise' },
    'bodyweight-squat': { name: 'Bodyweight Squat' },
    'wall-sit': { name: 'Wall Sit' },
    'band-pull-through': { name: 'Band Pull-Through' },
    'bodyweight-single-leg-rdl': { name: 'Single-Leg RDL (bodyweight)' },
    'bodyweight-split-squat': { name: 'Split Squat (bodyweight)' },
    'band-pulldown': { name: 'Band Lat Pulldown' },
    'backpack-carry': { name: 'Backpack Carry' },
    'ab-wheel': { name: 'Ab Wheel Rollout' },
    'hollow-body-hold-strength': { name: 'Hollow Body Hold' },
    'ring-pullup': { name: 'Ring Pull-ups' },
    'ring-dips': { name: 'Ring Dips' },
    'ring-rollout': { name: 'Ring Rollout' },
    'front-lever': { name: 'Front Lever progression' },
    'ring-row': { name: 'Ring Row' },
    'ring-pushup': { name: 'Ring Push-up' },
    'ring-split-squat': { name: 'Ring Split Squat' },
    'ring-hamstring-curl': { name: 'Ring Hamstring Curl' },
    sprint: { name: 'Sprint' },
    'couch-stretch': { name: 'Couch Stretch · 2×90 s per side' },
    't-spine': { name: 'T-Spine Extension / Open Book · 10 reps' },
    'knee-to-wall': { name: 'Knee-to-Wall · 2×15 per side' },
    'neck-isometric': { name: 'Neck Isometrics · 4 directions, 10 s each' },
    'down-dog': { name: 'Downward-Facing Dog' },
    'boardoff-seated': { name: 'Board in · out · in' },
    'boardoff-tail-grab': { name: 'Hanging · Tail Grab' },
    'boardoff-one-footer': { name: 'One-Footer · hold 2 s' },
    'boardoff-full': { name: 'Full board-off, hanging' },
    'boardoff-timed': { name: 'Full cycle · target < 3 s' },
    'toes-to-bar': { name: 'Toes-to-Bar' },
    'dead-hang': { name: 'Dead Hang' },
    'hollow-body-hold': { name: 'Hollow Body Hold' },
    'bo-hang-tap': { name: 'Harness hang: tap the grab' },
    'bo-hang-hold': { name: 'Harness hang: hold the grab' },
    'bo-hang-foot-release': { name: 'Harness hang: one-foot release' },
    'bo-hang-off-fin': { name: 'Harness hang: Board Off by Fin' },
    'bo-hang-off-handle': { name: 'Harness hang: Board Off by Handle' },
    'bo-hang-deep-hold': { name: 'Harness hang: deep-compression hold' },
    'bo-board-hold-1arm': { name: 'Board hold, single-arm (rail/fin)' },
    'bo-seated-pike-lift': { name: 'Seated Pike Lift' },
    'bo-hollow-hold': { name: 'Hollow Body Hold (board-off)' },
    'bo-hang-knee-raise': { name: 'Hanging Knee Raise (strict)' },
    'bo-hang-leg-raise': { name: 'Hanging Straight-Leg Raise' },
    'bo-hang-leg-raise-1l': { name: 'Hanging Leg Raise, single-leg' },
    'bo-tuck-lsit': { name: 'Tuck L-Sit' },
    'bo-vsit-lift': { name: 'V-Sit / Pike Lift with added load' },
    'bo-dead-hang': { name: 'Dead Hang, two hands' },
    'bo-hang-1arm-assist': { name: 'One-arm hang (assisted)' },
    'bo-bottoms-up-hold': { name: 'Bottoms-Up KB Hold / Plate Pinch' },
    'bo-wrist-twist': { name: 'Wrist drill: rotate the board' },
    'bo-kb-oh-hold': { name: 'Single-arm KB overhead hold' },
    'bo-oh-carry': { name: 'Single-arm overhead carry' },
    'bo-suitcase-hold': { name: 'Suitcase / Offset Hold' },
    'bo-deadbug-kb': { name: 'Dead Bug with KB overhead' },
    'bo-jefferson-curl': { name: 'Jefferson Curl / pike stretch' },
    'bo-seated-board': { name: 'Put the board on / off while seated' }
  },

  templates: {
    A: {
      title: 'Day A',
      subtitle: 'Gym · Legs / Push · 50–60 min',
      notes: {
        'nordic-negative': '5 negatives, target 4 s eccentric',
        'suitcase-carry': '40 m per side · same time, plus anti-lateral-flexion'
      }
    },
    B: {
      title: 'Day B',
      subtitle: 'Gym · Pull / Landing · 50–60 min',
      notes: {
        'front-squat-or-stepdown': 'Step-down: 3×6/side, 3–4 s eccentric',
        'back-extension-45': '12–15 · bodyweight only, brief hold at the top',
        'side-plank': '30–45 s per side'
      }
    },
    RINGS: {
      title: 'Rings circuit',
      subtitle: 'Upper body / core',
      notes: {}
    },
    KB: {
      title: 'KB circuit',
      subtitle: 'On the road · alternative to the rings day',
      notes: {
        'kb-clean-press': 'Explosive: low reps, clean lockout',
        'kb-windmill': 'Start light · technique before weight'
      }
    }
  },

  mobility: {
    'pre-session': {
      title: 'Pre-session',
      items: {
        'warmup-cardio': { label: '5 min easy bike, rower or treadmill' },
        'warmup-movement': { label: '10 bodyweight squats + 10 hip hinges' },
        'warmup-ramp': { label: '2–4 ramp-up sets of the first exercise' }
      }
    },
    morning: {
      title: 'Morning routine',
      items: {
        'morning-cat-cow': { label: 'Cat-Cow · 10 slow reps', purpose: 'Mobilise the spine unloaded' },
        'morning-down-dog': { label: 'Downward-Facing Dog · 30 s + 5× pedalling', purpose: 'Calves, ankle, shoulder flexion' },
        'morning-worlds-greatest': { label: "World's Greatest Stretch · 5 per side", purpose: 'Hip flexors and thoracic rotation' },
        'morning-hip-flexor': { label: 'Half-Kneeling Hip Flexor Stretch · 45 s per side', purpose: 'Counterpart to the harness position' },
        'morning-knee-wall': { label: 'Knee-to-Wall · 10 per side', purpose: 'Dorsiflexion for landings' },
        'morning-glute-bridge': { label: 'Glute Bridge · 15 reps', purpose: 'Activate the glutes without stressing the back' }
      }
    },
    hip: {
      title: 'Post-session hip routine',
      items: {
        'hip-flexor-stretch': {
          label: 'Half-Kneeling Hip Flexor Stretch',
          dose: '2×45 s per side',
          cue: 'Actively squeeze the glute of the rear leg',
          cueDetail: 'Tilt the pelvis back — otherwise you stretch the lower back instead of the hip flexors'
        },
        'hip-90-90-switch': { label: '90/90 Hip Switch', dose: '10 slow switches', purpose: 'Internal and external rotation' },
        'hip-glute-bridge': {
          label: 'Glute Bridge',
          dose: '2×15, hold 2 s at the top',
          purpose: 'Activate after stretching — you need to be able to hold the new position'
        },
        'hip-copenhagen-plank': { label: 'Copenhagen Plank', dose: '2×20–30 s per side', purpose: 'On the knees as a regression' },
        'hip-airplane': { label: 'Standing Hip Airplane', dose: '5 per side', purpose: 'Balance + rotation control' }
      }
    }
  },

  boardOff: {
    '0': {
      label: 'Preparation',
      skill: null,
      gate: 'Compression test passed + long sit 30 s + dead hang 30 s',
      slots: {
        'bo-seated-pike-lift': { mistake: 'Bending the knees to get higher', regression: 'Place the hands further back, straddle instead of pike' },
        'bo-hollow-hold': { mistake: 'The lower back lifts off the floor', regression: 'Knees bent (tuck hollow)' },
        'bo-dead-hang': { mistake: 'Hanging passively in the shoulders', regression: 'Take weight off through the feet on the floor' },
        'bo-jefferson-curl': { mistake: 'Using momentum into the stretch', regression: 'Straddle, knees slightly bent' }
      },
      rigFree: {}
    },
    '1': {
      label: 'Tap the grab',
      skill: 'Tap the grab',
      gate: '10 clean taps in a row, held 1 s each, without swinging',
      slots: {
        'bo-hang-tap': { mistake: 'Swinging instead of actively flexing', regression: 'Just knees to chest, without touching' },
        'bo-hang-knee-raise': { mistake: 'The back arches, the pelvis does not tilt with it', regression: 'Lying: reverse curl with the arms fixed' },
        'bo-deadbug-kb': { mistake: 'The ribs flare up', regression: 'No weight, just the arms vertical' },
        'bo-dead-hang': { mistake: 'Shoulders completely passive', regression: 'Take weight off the feet' }
      },
      rigFree: {
        'bo-hang-tap': { mistake: 'Swinging instead of actively flexing', regression: 'Knees bent (knee raise)' }
      }
    },
    '2': {
      label: 'Hold the grab',
      skill: 'Hold the grab',
      gate: '3 × 10 s grab hold without dropping, both sides',
      slots: {
        'bo-hang-hold': { mistake: 'Letting the position slowly sag while still counting', regression: 'Tuck position instead of extended, shorter holds' },
        'bo-tuck-lsit': { mistake: 'Shrugging the shoulders up', regression: 'Feet on the floor, just shift weight' },
        'bo-kb-oh-hold': { mistake: 'The rib cage tips forward', regression: 'Lighter weight, back against the wall' },
        'bo-seated-pike-lift': { mistake: 'Jerky instead of controlled', regression: 'Without weight' }
      },
      rigFree: {
        'bo-hang-hold': { mistake: 'The lower back lifts off the floor', regression: 'Knees bent (tuck hollow)' }
      }
    },
    '3': {
      label: 'One Footer',
      skill: 'One Footer',
      gate: '5 releases per side, foot lands on the first try, without looking',
      slots: {
        'bo-hang-foot-release': { mistake: 'Looking down to find the foot — you cannot in the jump', regression: 'Just release the foot, without holding' },
        'bo-suitcase-hold': { mistake: 'Letting the torso tip to the side', regression: 'Lighter weight' },
        'bo-hang-leg-raise-1l': { mistake: 'The support leg rises too', regression: 'Knee bent' },
        'bo-hang-1arm-assist': { mistake: 'Letting the shoulder go fully passive', regression: 'Both hands, shift weight 80/20' }
      },
      rigFree: {
        'bo-hang-foot-release': { mistake: 'The ribs flare, the torso rotates', regression: 'Without weight' }
      }
    },
    '4': {
      label: 'Board Off by Fin',
      skill: 'Board Off by Fin',
      gate: '5 board offs, board steady on the rail for 3 s, feet back on the first try',
      slots: {
        'bo-hang-off-fin': { mistake: 'Board too far from the body, the wrist bends', regression: 'Grip the board on the rail near the middle' },
        'bo-board-hold-1arm': { mistake: 'Letting the board tip and stabilising with a swing', regression: 'Board closer to the body, two hands' },
        'bo-bottoms-up-hold': { mistake: 'Letting the elbow do the work', regression: 'Lighter weight' },
        'bo-hang-leg-raise': { mistake: 'Kipping', regression: 'Knees to chest' }
      },
      rigFree: {
        'bo-hang-off-fin': { mistake: 'Rounding the back instead of hinging at the hip', regression: 'No added load, straddle' }
      }
    },
    '5': {
      label: 'Board Off by Handle',
      skill: 'Board Off by Handle',
      gate: '5 board offs by handle with a 3 s hold each, with the right and left gripping hand',
      slots: {
        'bo-hang-off-handle': { mistake: 'Folding the torso forward instead of hinging at the hip', regression: 'Grip the board on the rail first, then re-grip to the handle' },
        'bo-hang-deep-hold': { mistake: 'The legs drop, the hand holds the board up instead of the other way round', regression: 'Shorter holds, knees slightly bent' },
        'bo-vsit-lift': { mistake: 'Rounding the back instead of hinging at the hip', regression: 'No added load, straddle' },
        'bo-oh-carry': { mistake: 'Tipping away to the side', regression: 'Lighter, rack position instead of overhead' }
      },
      rigFree: {
        'bo-hang-off-handle': { mistake: 'Kipping instead of an active hip hinge', regression: 'Knees to chest' },
        'bo-hang-deep-hold': { mistake: 'Shrugging the shoulders', regression: 'Feet on the floor, just shift weight' }
      }
    }
  }
};
