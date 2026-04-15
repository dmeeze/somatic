/**
 * icons.js — Curated Font Awesome 6 Free icon lists for the icon picker.
 * Each entry: { icon: 'fa-solid fa-...', label: 'search terms' }
 */

export const ICONS = [
  // Faces
  { icon: 'fa-solid fa-face-smile-beam',  label: 'happy great smile beam' },
  { icon: 'fa-solid fa-face-smile',       label: 'happy smile good' },
  { icon: 'fa-solid fa-face-grin',        label: 'grin pleased' },
  { icon: 'fa-solid fa-face-laugh',       label: 'laugh happy excited' },
  { icon: 'fa-solid fa-face-grin-hearts', label: 'love happy hearts' },
  { icon: 'fa-solid fa-face-meh',         label: 'ok meh neutral' },
  { icon: 'fa-solid fa-face-meh-blank',   label: 'blank neutral unsure' },
  { icon: 'fa-solid fa-face-rolling-eyes',label: 'rolling eyes bored' },
  { icon: 'fa-solid fa-face-grimace',     label: 'grimace stressed tense' },
  { icon: 'fa-solid fa-face-flushed',     label: 'flushed embarrassed overwhelmed' },
  { icon: 'fa-solid fa-face-surprise',    label: 'surprised shocked' },
  { icon: 'fa-solid fa-face-frown',       label: 'frown sad unhappy' },
  { icon: 'fa-solid fa-face-frown-open',  label: 'upset sad open' },
  { icon: 'fa-solid fa-face-sad-tear',    label: 'sad tear cry upset' },
  { icon: 'fa-solid fa-face-sad-cry',     label: 'cry crying upset meltdown' },
  { icon: 'fa-solid fa-face-angry',       label: 'angry mad furious' },
  { icon: 'fa-solid fa-face-tired',       label: 'tired exhausted worn' },
  { icon: 'fa-solid fa-face-dizzy',       label: 'dizzy overwhelmed meltdown' },

  // Communication & people
  { icon: 'fa-solid fa-circle-question',      label: 'question help ask' },
  { icon: 'fa-solid fa-comment',              label: 'talk chat speak' },
  { icon: 'fa-solid fa-phone',               label: 'phone call parents carer' },
  { icon: 'fa-solid fa-mobile-screen',        label: 'mobile phone text' },
  { icon: 'fa-solid fa-envelope',             label: 'message email letter' },
  { icon: 'fa-solid fa-hand',                label: 'stop hand wait' },
  { icon: 'fa-solid fa-hands-holding-heart', label: 'care support love' },
  { icon: 'fa-solid fa-hand-holding-heart',  label: 'soothing comfort tools' },
  { icon: 'fa-solid fa-people-group',         label: 'group people social' },
  { icon: 'fa-solid fa-person',              label: 'person alone' },

  // Senses & sensory
  { icon: 'fa-solid fa-ear-deaf',        label: 'quiet deaf noise sensory' },
  { icon: 'fa-solid fa-volume-xmark',    label: 'mute silence quiet noise' },
  { icon: 'fa-solid fa-volume-low',      label: 'quiet low volume' },
  { icon: 'fa-solid fa-headphones',      label: 'headphones music listen calm' },
  { icon: 'fa-solid fa-eye-slash',       label: 'eyes closed calm dark' },
  { icon: 'fa-solid fa-eye',             label: 'look watch see' },
  { icon: 'fa-solid fa-lightbulb',       label: 'light idea bright' },

  // Space & time
  { icon: 'fa-solid fa-hourglass-half',  label: 'time wait hourglass' },
  { icon: 'fa-solid fa-clock',           label: 'time clock wait' },
  { icon: 'fa-solid fa-door-open',       label: 'leave exit door space outside' },
  { icon: 'fa-solid fa-house',           label: 'home safe house' },
  { icon: 'fa-solid fa-shield-heart',    label: 'safe protected secure' },
  { icon: 'fa-solid fa-location-dot',    label: 'place location go' },

  // Movement
  { icon: 'fa-solid fa-person-walking',  label: 'walk move exercise' },
  { icon: 'fa-solid fa-person-running',  label: 'run exercise fast' },
  { icon: 'fa-solid fa-bicycle',         label: 'bike cycle ride' },

  // Food & drink
  { icon: 'fa-solid fa-droplet',         label: 'water drink thirsty' },
  { icon: 'fa-solid fa-mug-hot',         label: 'hot drink tea coffee' },
  { icon: 'fa-solid fa-utensils',        label: 'food eat hungry meal' },
  { icon: 'fa-solid fa-apple-whole',     label: 'fruit snack food' },

  // Rest & comfort
  { icon: 'fa-solid fa-bed',             label: 'rest sleep tired lie down' },
  { icon: 'fa-solid fa-couch',           label: 'sit rest relax couch' },
  { icon: 'fa-solid fa-blanket',         label: 'blanket comfort warm' },
  { icon: 'fa-solid fa-shower',          label: 'shower wash clean' },
  { icon: 'fa-solid fa-toilet',          label: 'bathroom toilet' },

  // Health
  { icon: 'fa-solid fa-bandage',         label: 'hurt injury first aid' },
  { icon: 'fa-solid fa-pills',           label: 'medicine medication' },
  { icon: 'fa-solid fa-hospital',        label: 'medical help doctor nurse' },
  { icon: 'fa-solid fa-kit-medical',     label: 'first aid medical kit' },
  { icon: 'fa-solid fa-heart-pulse',     label: 'health heart pulse' },

  // Activities & calming
  { icon: 'fa-solid fa-book-open',       label: 'read book calm' },
  { icon: 'fa-solid fa-music',           label: 'music listen calm' },
  { icon: 'fa-solid fa-pencil',          label: 'write draw pencil create' },
  { icon: 'fa-solid fa-gamepad',         label: 'game play fun' },
  { icon: 'fa-solid fa-puzzle-piece',    label: 'puzzle fidget focus' },
  { icon: 'fa-solid fa-paintbrush',      label: 'art paint create' },

  // Symbols
  { icon: 'fa-solid fa-heart',           label: 'love care comfort' },
  { icon: 'fa-solid fa-star',            label: 'star favourite great' },
  { icon: 'fa-solid fa-thumbs-up',       label: 'ok good yes fine' },
  { icon: 'fa-solid fa-thumbs-down',     label: 'no bad not ok' },
  { icon: 'fa-solid fa-triangle-exclamation', label: 'urgent warning important alert' },
  { icon: 'fa-solid fa-bell',            label: 'alert attention bell notification' },
  { icon: 'fa-solid fa-fire',            label: 'fire hot urgent intense' },
  { icon: 'fa-solid fa-bolt',            label: 'bolt electric fast urgent' },
  { icon: 'fa-solid fa-ellipsis',        label: 'other more something else custom' },
];
