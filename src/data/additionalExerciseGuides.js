// Schematic motion guides. Front and side views isolate the relevant movement.
const p = (head, body, equipment = '') => ({ head, body, equipment });
const g = (cue, a, b, start = 'התחלה', end = 'סיום') => ({ cue, start, end, poses: b ? [a,b] : [a] });
const stand = 'M60 28 V62 L50 90 H44 M60 62 L70 90 H76 ';
const seated = 'M60 29 V65 H75 L82 90 H91 ';
const floor = 'M27 75 H63 L81 55 L97 90 H108 ';
const seat = 'M47 69 H75 M55 70 V91 M74 70 V91';
const bench = 'M16 80 H72 M24 81 V92 M63 81 V92';
const db = (x,y) => `M${x-5} ${y} h10 m-10 -4 v8 m10 -8 v8`;
const standing = (arm, eq = '') => p([60,20], stand + arm, eq);
const sitting = (arm, eq = '') => p([60,21], seated + arm, seat + ' ' + eq);
const fly = (cue, equipment) => g(cue,
  standing('M59 36 L36 39 L20 49 M61 36 L84 39 L100 49', equipment),
  standing('M59 36 L47 45 L56 53 M61 36 L73 45 L64 53', equipment));
const press = (cue, inclined, machine) => {
  const torso = inclined ? 'M34 47 L59 68 L77 70 L82 91 H92 ' : 'M31 66 L59 73 L77 68 L83 91 H94 ';
  const support = inclined ? 'M25 52 L60 77 H79 M56 77 V93' : 'M16 78 H75 M22 78 V93 M65 78 V93';
  const shaft = machine ? ' M30 14 V76 M60 14 V76' : '';
  return g(cue, p(inclined ? [27,42] : [23,62],torso + 'M42 56 L54 58 L51 41',support+shaft+' '+db(51,41)),
    p(inclined ? [27,42] : [23,62],torso+'M42 56 L45 39 L47 22',support+shaft+' '+db(47,22)));
};
const push = (cue, raised = false, weights = false, grip = 24) => {
  const y = raised ? 77 : 90;
  const eq = raised ? 'M70 77 H105 V91' : weights ? db(78,88) : '';
  return g(cue,p([89,40],`M82 46 L47 67 L19 85 V91 M${82-grip/5} 49 L77 68 L78 ${y}`,eq),
    p([91,raised?55:65],`M85 ${raised?59:69} L47 77 L19 85 V91 M${85-grip/5} ${raised?61:71} L66 75 L78 ${y}`,eq));
};
const pull = (wide, chin = false, cable = false) => {
  const left = wide ? 30 : 46, right = 120-left;
  const a = p([60,43],`M60 51 V72 L48 89 M60 72 L72 89 M58 54 L43 39 L${left} 22 M62 54 L77 39 L${right} 22`,
    cable ? 'M60 8 V22 M27 22 H93 '+seat : 'M14 22 H106');
  const b = cable
    ? p([60,43],`M60 51 V72 L48 89 M60 72 L72 89 M58 54 L42 66 L${left} 54 M62 54 L78 66 L${right} 54`,'M60 8 V38 M27 54 H93 '+seat)
    : p([60,17],`M60 25 V52 L52 70 L50 85 M60 52 L66 69 L70 85 M58 31 L39 39 L${left} 22 M62 31 L81 39 L${right} 22`,'M14 22 H106');
  return g(cable ? 'משוך את הידית לפני הגוף, לכיוון החזה העליון.' : chin ? 'באחיזה הפוכה, משוך כלפי המוט וחזור בשליטה.' : 'משוך כלפי המוט בלי להתנדנד, ורד בשליטה.',a,b);
};
const curl = (cue, mode = 'standing', equipment = 'dumbbell') => {
  const top = mode === 'incline' ? 'M37 34 L57 66 L77 68 L83 92 ' : mode === 'standing' ? stand : seated;
  const head = mode === 'incline' ? [33,26] : [60,20];
  const sx = mode === 'incline' ? 44 : 58;
  const elbow = mode === 'supported' ? [73,53] : [sx+2,51];
  const base = mode === 'standing' ? '' : mode === 'incline' ? 'M28 36 L57 73 H81 M58 73 V92' : seat;
  const device=(x,y)=>equipment==='bar'? `M${x-15} ${y} l5 -2 l5 2 l5 -2 l5 2 l5 -2 l5 2` : equipment==='band'? `M${x} ${y} L57 89` : equipment==='machine' ? `M75 56 H95 V91 M${x} ${y} L92 60` : db(x,y);
  return g(cue, p(head,`${top} M${sx} 36 L${elbow.join(' ')} L${elbow[0]+8} 68`,base+' '+device(elbow[0]+8,68)),
    p(head,`${top} M${sx} 36 L${elbow.join(' ')} L${elbow[0]+12} 37`,base+' '+device(elbow[0]+12,37)));
};
const extension = (cue, mode) => {
  if (mode==='lying') return g(cue,p([24,70],floor+'M38 74 L45 49 L29 48',bench+' '+db(29,48)),p([24,70],floor+'M38 74 L45 49 L49 29',bench+' '+db(49,29)));
  if (mode==='overhead' || mode==='overheadCable') {
    const attachment = (x,y) => mode === 'overheadCable' ? `M27 92 V49 L${x} ${y}` : db(x,y);
    return g(cue,standing('M60 34 L66 21 L53 33',attachment(53,33)),standing('M60 34 L66 21 L69 8',attachment(69,8)));
  }
  return g(cue,standing('M60 35 L62 54 L78 48','M95 10 V93 L78 48'),standing('M60 35 L62 54 L65 72','M95 10 V93 L65 72'));
};
const hinge = (cue, support) => g(cue,p([40,30],'M47 37 L63 57 L79 72 L94 88 M47 38 L43 48 L49 56',support),
  p([27,61],'M34 58 L63 57 L79 72 L94 88 M38 58 L39 47 L32 48',support));
const warm = (cue, arms) => g(cue, standing(arms), null, 'תנועה קלה');
const dip = (cue, benchDip = false) => g(cue,
  p([60,25],benchDip ? 'M60 33 V60 L83 67 L96 90 M60 36 L53 50 L44 60' : 'M60 33 V62 L68 78 L60 88 M60 38 L55 50 L56 65',benchDip ? 'M25 60 H48 M31 61 V91' : 'M38 65 H92 M44 66 V92 M85 66 V92'),
  p([60,40],benchDip ? 'M60 48 V73 L83 70 L96 90 M60 52 L48 50 L44 60' : 'M60 48 V76 L68 86 M60 50 L47 47 L56 65',benchDip ? 'M25 60 H48 M31 61 V91' : 'M38 65 H92 M44 66 V92 M85 66 V92'));
const chestWarm = 'M59 36 L43 41 L30 48 M61 36 L77 41 L90 48';
const legMachine = (cue, kind) => {
  const eq='M31 69 H68 M38 69 V91 M68 69 L90 87 M88 82 V91';
  if(kind==='press')return g(cue,p([32,43],'M39 49 L57 70 L71 52 L95 60 M43 54 L49 68',eq+' M98 44 L91 71'),p([32,43],'M39 49 L57 70 L76 58 L99 47 M43 54 L49 68',eq+' M102 39 L94 64'));
  if(kind==='curl')return g(cue,p([25,55],'M32 62 L61 68 L82 69 L101 70 M34 63 L38 73 L25 75',bench+' M100 61 V70'),p([25,55],'M32 62 L61 68 L82 69 L87 47 M34 63 L38 73 L25 75',bench+' M89 44 V55'));
  return g(cue,p([53,26],'M54 34 L54 66 H75 L78 88 M55 40 L62 56 L56 68',eq),p([53,26],'M54 34 L54 66 H75 L99 65 M55 40 L62 56 L56 68',eq+' M97 60 V71'));
};
const hip = (cue, out) => {
  const narrow=p([60,23],'M60 31 V59 M60 58 L51 70 L51 87 M60 58 L69 70 L69 87 M60 36 L43 51 M60 36 L77 51','M41 64 H79 M47 65 V91 M73 65 V91');
  const wide=p([60,23],'M60 31 V59 M60 58 L35 67 L28 85 M60 58 L85 67 L92 85 M60 36 L43 51 M60 36 L77 51','M41 64 H79 M47 65 V91 M73 65 V91 M30 66 H39 M81 66 H90');
  return g(cue,out?narrow:wide,out?wide:narrow);
};
const cardio = (cue, a, b, eq='') => g(cue, p([61,23],'M60 31 L56 58 '+a,eq),b&&p([61,23],'M60 31 L56 58 '+b,eq),'תנוחה','צעד נוסף');

export const additionalExerciseGuides = {
  incline_bench: press('לחץ את המשקולות מעל החזה בשיפוע, והורד בשליטה.',true,false),
  chest_press_machine: press('כוון את ספסל השיפוע והורד את מוט הסמית בשליטה.',true,true),
  cable_fly: fly('קרב את ידיות הכבל בקשת, עם מרפקים מעט כפופים.','M12 29 V65 L20 49 M108 29 V65 L100 49'),
  machine_fly: g('שב עם הגב על המשענת וקרב את הזרועות בקשת.',sitting('M58 37 L38 47 L28 51 M62 37 L82 47 L92 51','M23 37 V65 M97 37 V65'),sitting('M58 37 L47 47 L57 54 M62 37 L73 47 L63 54','M54 47 V64 M66 47 V64')),
  pushups_weights: push('אם המשקולות משמשות כידיות, השתמש רק בידיות יציבות שאינן מתגלגלות.',false,true),
  pushups_incline: push('הנח את הידיים על משטח מוגבה ויציב ושמור על קו גוף ישר.',true),
  pushups_wide: push('מקם ידיים רחב מרוחב הכתפיים, בטווח נוח.',false,false,34),
  pushups_close: push('מקם ידיים קרובות ושמור מרפקים קרובים לגוף.',false,false,12),
  chest_press_free: press('לחץ את המשקולות מעל החזה והורד בשליטה.',false,false),
  chest_machine: g('כוון את המושב כך שהידיות יהיו בגובה החזה.',sitting('M57 37 L48 48 L65 48','M44 35 V69 M94 27 V91 L65 48'),sitting('M57 37 L73 42 L91 42','M44 35 V69 M94 27 V91')),
  free_weight_fly: g('פתח וסגור את הזרועות בקשת כשהמרפקים מעט כפופים.',p([60,37],'M60 43 V73 M59 48 L37 50 L23 60 M61 48 L83 50 L97 60','M51 32 H69 V81 H51 Z '+db(23,60)+' '+db(97,60)),p([60,37],'M60 43 V73 M59 48 L52 40 L54 24 M61 48 L68 40 L66 24','M51 32 H69 V81 H51 Z '+db(54,24)+' '+db(66,24))),
  chest_warmup: warm('חימום כללי לחזה: התחל בתנועה קלה ובטווח נוח.',chestWarm),
  lat_pulldown_narrow: pull(false,false,true),
  barbell_row: g('הטה את הגוף מהאגן ומשוך את המוט לכיוון הבטן.',p([83,40],'M76 45 L47 59 L42 73 L47 91 M69 48 L66 63 L65 78',db(65,78)),p([83,40],'M76 45 L47 59 L42 73 L47 91 M69 48 L53 43 L58 61',db(58,61))),
  pullover_bar: g('העבר את המוט בקשת מעל הראש בטווח נוח.',p([24,70],floor+'M40 75 L45 34',bench+' M29 34 H61'),p([24,70],floor+'M40 75 L24 57 L11 51',bench+' M5 51 H24')),
  pullover_dumbbell: g('העבר את המשקולת מעל הראש בלי לקשת את הגב.',p([24,70],floor+'M40 75 L45 34',bench+' '+db(45,34)),p([24,70],floor+'M40 75 L24 57 L11 51',bench+' '+db(11,51))),
  row_machine: g('שמור על תמיכת החזה ומשוך את הידיות אליך.',sitting('M59 37 L71 46 L89 49','M67 43 V70 M95 37 V91'),sitting('M59 37 L49 50 L67 52','M67 43 V70 M95 37 V91')),
  back_warmup: warm('חימום כללי לגב: התחל בתנועות משיכה קלות ומבוקרות.','M60 36 L42 47 L46 60 M60 36 L78 47 L74 60'),
  stretch_wide: pull(true),
  stretch_reverse: pull(false,true),
  stretch: pull(false),
  lower_back_roman: hinge('הטה את הגוף מהאגן וחזור עד שקו הגוף ישר.', 'M52 61 H68 L75 92 M92 86 H105'),
  lower_back_chair: hinge('ייצב את הרגליים במתקן והתכופף מהאגן.', 'M52 61 H68 V91 M82 91 H110'),
  superman: g('בשכיבה על הבטן, הרם מעט את הידיים והרגליים בשליטה.',p([27,79],'M35 83 L64 86 L100 90 M40 85 L12 89'),p([27,70],'M35 76 L64 86 L100 74 M40 78 L12 71')),
  kettlebell_swing: g('הנף מכוח יישור האגן. הידיים מלוות את המשקולת.',p([82,44],'M75 49 L49 65 L65 76 L58 91 M66 54 L58 71 L43 76','M39 77 h8 v9 h-8 Z'),p([60,22],stand+'M60 33 L77 43 L98 44','M94 44 h8 v9 h-8 Z')),
  pullup: pull(false),
  shoulder_press_machine: g('כוון את המושב כך שהידיות יתחילו בגובה הכתפיים.',sitting('M60 37 L41 49 L39 33 M60 37 L79 49 L81 33','M24 13 V80 M96 13 V80'),sitting('M60 37 L47 23 L39 12 M60 37 L73 23 L81 12','M24 13 V80 M96 13 V80')),
  rear_delt_machine: g('פנה אל המשענת ופתח את הזרועות לצדדים.',sitting('M60 36 L48 31 L55 23 M60 36 L72 31 L65 23','M38 36 H82'),sitting(chestWarm,'M38 36 H82')),
  rear_delt_cable: g('משוך את קצות החבל לכיוון הפנים ופתח את המרפקים.',standing('M60 37 L75 40 L94 34','M105 22 L94 34'),standing('M60 37 L49 39 L67 31','M105 22 L67 31')),
  rear_delt_cross: g('פתח את הידיים לצדדים כנגד התנגדות הכבלים וחזור לאט.', standing('M59 36 L47 45 L56 53 M61 36 L73 45 L64 53','M12 25 V72 M108 25 V72'), standing(chestWarm,'M12 25 V72 M108 25 V72')),
  front_w_bar: g('הרם את המוט מלפנים עד גובה הכתפיים בקירוב.',standing('M60 36 L63 53 L66 70',db(66,70)),standing('M60 36 L77 38 L94 38',db(94,38))),
  traps: g('הרם והורד את הכתפיים בשליטה, בלי לסובב אותן.',standing('M53 38 L46 67 M67 38 L74 67',db(46,67)+' '+db(74,67)),standing('M53 32 L46 61 M67 32 L74 61',db(46,61)+' '+db(74,61))),
  shoulder_warmup: warm('חימום כללי לכתפיים: התחל בתנועות קלות בטווח נוח.',chestWarm),
  leg_press: legMachine('שמור על הגב נתמך ודחוף את המשטח בשליטה.','press'),
  lunges: g('רד בכפיפת שתי הברכיים, כשהרגל הקדמית נשארת יציבה.',standing('M60 36 L48 46 L43 36','M40 35 H78'),p([62,35],'M61 43 V66 L83 68 L87 92 M61 66 L45 83 L28 90 M61 48 L49 56 L43 49','M39 47 H79')),
  leg_extension: legMachine('ישר את הברכיים בשליטה והחזר את הרפידה באיטיות.','extension'),
  leg_curl: legMachine('כופף את הברכיים בלי להרים את האגן מהספסל.','curl'),
  hip_adductor: hip('קרב את הירכיים נגד הרפידות בשליטה.',false),
  hip_abductor: hip('פתח את הירכיים נגד הרפידות בשליטה.',true),
  calf_raise: g('עלה על כריות כפות הרגליים והורד עקבים בשליטה.',standing('M60 36 L76 48','M88 25 V91'),p([60,16],'M60 24 V58 L55 74 L54 85 L64 91 M60 58 L65 74 L65 85 L74 91 M60 34 L76 46','M88 25 V91')),
  hip_thrust: g('הישען עם הגב העליון על ספסל יציב והרם את האגן בלי לקשת בגב.',p([28,56],'M35 62 L62 80 L81 66 L88 91 M44 68 L62 75','M16 66 H43 M21 67 V92 '+db(62,77)),p([28,56],'M35 61 L62 65 L82 63 L90 91 M45 63 L62 62','M16 66 H43 M21 67 V92 '+db(62,65))),
  leg_warmup: warm('חימום כללי לרגליים: התחל בכפיפה קלה ללא עומס.','M60 36 L77 42 L93 42'),
  dumbbell_curl: curl('כופף מרפקים עם מוט W בלי להניף את הגוף.','standing','bar'),
  hammer_curl: curl('שמור על אחיזה ניטרלית, עם כפות הידיים פונות זו לזו.'),
  concentration_curl: curl('תמוך במרפק בצד הפנימי של הירך בזמן הכפיפה.','supported'),
  incline_curl: curl('הישען על ספסל השיפוע והנע את האמות בלבד.','incline'),
  preacher_curl: curl('תמוך בזרוע העליונה על המשענת בזמן הכפיפה.','supported'),
  machine_curl: curl('כוון את המושב כך שהמרפקים יישארו נתמכים.','supported','machine'),
  cable_curl: curl('עגן גומייה מתאימה היטב ושמור על מרפקים יציבים.','standing','band'),
  reverse_curl: pull(false,true),
  bench_curl: g('תמוך באמה על הספסל והנע את שורש כף היד בטווח נוח.',p([36,32],'M40 39 L52 66 L66 73 L73 91 M44 47 L55 60 L78 60 L91 68','M53 63 H80 M74 64 V92 '+db(92,68)),p([36,32],'M40 39 L52 66 L66 73 L73 91 M44 47 L55 60 L78 60 L91 54','M53 63 H80 M74 64 V92 '+db(92,54))),
  single_curl: g('איור סכמטי למתח ביד אחת. זו וריאציה מתקדמת.',p([60,44],'M60 52 V73 L54 91 M60 73 L66 91 M60 54 L59 23 M60 57 L73 64','M18 23 H102'),p([60,18],'M60 26 V59 L53 78 M60 59 L67 78 M60 30 L46 38 L59 23 M60 34 L74 48','M18 23 H102')),
  tricep_pushdown: extension('שמור על הזרוע העליונה יציבה ויישר את המרפק מעל הראש.','overhead'),
  french_press: extension('כופף ויישר את המרפקים בשכיבה, כשהזרועות העליונות יציבות.','lying'),
  french_press_free: extension('שמור על זרועות עליונות יציבות והורד את המשקל בשליטה.','lying'),
  parallel_bars: dip('הורד את הגוף בין המקבילים בטווח נוח ודחוף בחזרה.'),
  v_bar_pushdown: extension('עם ידית V, יישר את המרפקים כשהזרועות העליונות צמודות לגוף.','cable'),
  rear_arm_cable: extension('כשהכבל מאחוריך, יישר את המרפקים והחזר בשליטה.','overheadCable'),
  cable_pushdown: extension('דחוף את ידית הכבל מטה בלי להזיז את הכתפיים.','cable'),
  close_grip_pushup: push('מקם ידיים קרובות ושמור מרפקים קרובים לגוף.',false,false,12),
  jacksons: dip('הדגמה של מקבילים על ספסל. ודא שזו הווריאציה שהתכוונת לבצע.',true),
  crunches: g('הרם מעט את השכמות בלי למשוך בצוואר.',p([20,76],floor+'M32 75 L41 65 L32 57'),p([29,56],'M36 61 L49 73 L63 75 L81 55 L97 90 H108 M39 63 L43 51 L35 50')),
  leg_raises: g('הרם את הרגליים בשליטה והורד רק כל עוד הגב התחתון יציב.',p([22,79],'M29 83 H64 L106 86 M37 84 H61'),p([22,79],'M29 83 H64 L75 54 L80 27 M37 84 H61')),
  penguins: g('בשכיבה עם ברכיים כפופות, הושט את היד לעקב באותו צד.',p([60,27],'M60 35 V68 L48 82 L46 91 M60 68 L72 82 L74 91 M60 42 L43 68 M60 42 L77 68'),p([55,28],'M55 36 L60 68 L48 82 L46 91 M60 68 L72 82 L74 91 M54 44 L43 63 L46 85 M56 43 L72 64')),
  running: cardio('שמור על קצב נוח ותנועה טבעית של הידיים.','M56 58 L76 64 L69 90 M56 58 L42 70 L27 66 M59 34 L74 44 L83 35','M56 58 L39 61 L30 86 M56 58 L71 73 L88 76 M59 34 L46 49 L33 45'),
  elliptical: cardio('עמוד על הדוושות ואחוז בידיות ביציבות.','M56 58 L72 71 L79 85 M56 58 L47 72 L42 87 M58 36 L72 45 L87 39',null,'M29 89 H101 M95 89 L88 27 M34 87 H49 M72 85 H87'),
  cycling: g('כוון את המושב ושמור ברך מעט כפופה כשהדוושה נמוכה.',p([71,32],'M64 37 L47 59 L63 69 L59 85 M63 39 L75 48 L91 49','M39 62 H55 M47 62 L57 87 L89 58 L95 87 H31 L47 62 M89 58 L91 49'),null,'תנוחת רכיבה'),
  joint_warmup: warm('הנע את המפרקים בעדינות בטווח נוח, ללא תנופה.',chestWarm),
  cardio_mix: cardio('בחר פעילות אירובית מתאימה ושמור על קצב נוח. האיור מדגים הליכה.','M56 58 L42 75 L33 89 M56 58 L73 72 L84 89 M58 35 L71 50 L79 48',null),
};
