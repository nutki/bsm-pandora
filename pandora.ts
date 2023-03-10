type Bot = 'specibot' | 'reconbot' | 'ambot' | 'imrebot';
type Weapon = 'turbolaser' | 'netgun' | 'stunbomb';
type Tool = Weapon | 'botkit' | 'toolkit' | 'medkit' | 'scanner' | 'climbkit' | 'holographer' | 'neuroscanner' | 'rover' | 'enviorig' | 'armorig' | 'ecage';
type Creature = `crt_${number}`;
type Artifact = `art_${number}`;
type Crew = 'cmd' | 'nav' | 'med' | 'mnt' | 'gsv' | 'sci' | 'wpn';
type Entity = Bot | Tool | Creature | Crew | Artifact;

type Place = 'ship' | 'shuttle' | 'away';
type Inventory = Map<Entity, number>;

type CrewStat = 'cac' | 'kic' | 'wht' | 'prt' | 'spd' | 'end' | 'int';
type CreatureStat = 'int' | 'cmb' | 'agr' | 'spd';

function pandora_log(num: number, txt: string) {
state.log += '<p>' + txt + '</p>';
}

//specibot = 76937
//ambot    = 12993
//reconbot = 44935 // scanner
//imrebot  = 23934 // toolkit/botkit?

//neuroscan = 1r 2w
//turbolaser = 1r 2w (4/8)
//netgun = 2w (5/2)
//stunbomb = 1w (6/4)
//climbkit = 2w
//botkit = 3w
//toolkit = 2w
//medkit = 2w
//scanner = 2w 1r
//holographer = 2w
//ecage = 1w


//enviorig = +4wei, -1spd
//armorig = 4, 4, +9wei, 9, 7

//capacity
//shuttle = 120 100 80 60 30
//rover   =  50  40 30 20  -
//           2P P+2  P P-2 P/2

//100 90 80 70 60
// 40 35 30 25
// +2 +1  0 -1 -2

//sumberged = +1 class
//character port in thin atm -1,
function isEmpty(obj) {
    for(var prop in obj)
        if(obj.hasOwnProperty(prop))
            return false;
    return true;
}
function tag(type, content, attr?) {
  var attrs = '';
  for (var i in attr) if (attr.hasOwnProperty(i))
    attrs += ' '+i+'="'+attr[i]+'"';
  return '<'+type+attrs+'>'+(content||'')+'</'+type+'>';
}


function roll1d6() {
    return 0|Math.random()*6+1;
}
function roll2d6() {
    return roll1d6() + roll1d6();
}
function inventory<T extends Entity>(fcn: (e: Entity) => e is T, where?: Place): T[];
function inventory(fcn: (e: Entity) => boolean, where?: Place): Entity[];
function inventory(fcn: (e: Entity) => boolean, where: Place = state.location): Entity[] {
        const res: Entity[] = [];
        for (const [key, value] of state[where]) {
            if (fcn(key)) for(let i = 0; i < value; i++) res.push(key);
        }        
        return res;
}
function inventoryCount<T extends Entity>(fcn: (e: Entity) => e is T, where: Place = state.location) {
        let res = 0;
        for (const [key, value] of state[where]) {
                if (fcn(key)) res += value;
        }        
        return res;
}
function inventoryInc(inv: Inventory, key: Entity, amount: number = 1) {
        const v = (inv.get(key) || 0) - amount;
        if (v) inv.set(key, v);
        else inv.delete(key);
        return v;
}
function inventoryDec(inv: Inventory, key: Entity, amount: number = 1) {
        return inventoryInc(inv, key, -amount);
}
function chooseRandom<T extends Entity>(fcn: (e: Entity) => e is T,where?: Place): T | undefined {
    var inv = inventory(fcn, where);
    var res = 0|Math.random() * inv.length;
    return inv[res];
}
function hasTeamMember(who: Crew, where?: Place) {
    return state[where || state.location][who] && state.team[who].int > 2;
}
function hasMaintenanceOfficer(where?: Place) {
    return hasTeamMember('mnt', where);
}
function hasScienceOfficer(where?: Place) {
    return hasTeamMember('sci', where);
}
function hasMedicalOfficer(where?: Place) {
    return hasTeamMember('med', where);
}
function hasWeaponsOfficer(where?: Place) {
    return hasTeamMember('wpn', where);
}
function hasCommander(where?: Place) {
    return hasTeamMember('cmd', where);
}
function isTeamMemeber(who: Entity): who is Crew {
    return who in member_names;
}
function numTeamMembers(where?: Place) {
    var result = 0;
    for (var who in member_names)
	if (who in state[where || state.location])
	    result++;
    return result;
}
function isBot(what: Entity) {
    return what in {specibot:1,reconbot:1,ambot:1,imrebot:1};
}
function isWeapon(what: Entity) {
    return what in {turbolaser:1,netgun:1,stunbomb:1};
}
function isTool(what: Entity) {
    return what in {botkit:1,toolkit:1,medkit:1,scanner:1,turbolaser:1,netgun:1,climbkit:1,holographer:1,neuroscanner:1,rover:1,enviorig:1,armorig:1,stunbomb:1,ecage:1};
}
function isWeaponOrBot(what: Entity) {
    return isWeapon(what) || isBot(what);
}
function isToolOrBot(what: Entity) {
    return isBot(what) || isTool(what);
}
function isArtifact(what: Entity): what is Creature {
    return what.substring(0,4) == 'art_';
}
function isCreature(what: Entity): what is Creature {
    return what.substring(0,4) == 'crt_';
}
function hasCreature(where?: Place) {
        return inventoryCount(isCreature, where) > 0;
}
function numCreatures(where?: Place) {
        return inventoryCount(isCreature, where);
}
var creature_modifiers: Record<Creature, Partial<Record<CreatureStat | 'bvp', number>>> = {
    crt_007: { int:-3, cmb: 1, agr: 1, spd: 3, bvp:5 },
}
var creature_names: Record<Creature, string> = {
    crt_007: 'Drada',
}
function calculateCreatureStat(c: Creature, stat: CreatureStat) {
    var mods = creature_modifiers[c];
    if (!(stat in mods)) return 0;
    var mod = mods[stat]!;
    var result = roll2d6() + mod - 2;
    if (result < 1) result = 1;
    else if (result > 9) result = [9,9,10,10,11,12][roll1d6()-1];
    return result;
}
function creatureStat(c: Creature, stat: CreatureStat) {
    if (!(c in state.creature_log)) state.creature_log[c] = {};
    if (!(stat in state.creature_log[c]!)) state.creature_log[c]![stat] = calculateCreatureStat(c, stat);
    return state.creature_log[c]![stat]!;
}
function creatureInt(c: Creature) { return creatureStat(c, 'int'); }
function creatureAgr(c: Creature) { return creatureStat(c, 'agr'); }
function creatureSpd(c: Creature) { return creatureStat(c, 'spd'); }
function creatureCmb(c: Creature) { return creatureStat(c, 'cmb'); }
function killTeamMember(who: Crew) {
    state.team[who].end = 0;
    inventoryDec(state.ship, who);
    inventoryDec(state.shuttle, who);
    inventoryDec(state.away, who);
    state.extra_vp -= 4;
}
function victoryPoints() {
    var result = state.extra_vp;
    for (var i in state.creature_log) if (state.creature_log.hasOwnProperty(i))
	for (var j in state.creature_log[i]) if (state.creature_log[i].hasOwnProperty(j))
	    result++;
        const inv = inventory(() => true, 'ship');
    for (const [i] of state.ship) {
	if (isCreature(i)) {
	    result++;
	        result += creature_modifiers[i].bvp || 0;
	}
//	if (isArtifact(i)) TODO
	if (isTeamMemeber(i)) {
	    result -= 6 - state.team[i].end;
	}
// TODO: count good tools in all locations, possibly remove points (rover, bots for all, other per type)
    }
    for (const i in state.worlds_visited)
	result++;
    if (state.months < 0)
	result += state.months * 5;
    return result;
}
var member_names: Record<Crew, string> = {
 cmd: 'commander',
 nav: 'navigator',
 med: 'medical officer',
 mnt: 'maintenance officer',
 gsv: 'ground survey officer',
 sci: 'science officer',
 wpn: 'weapons officer',
}
type State = {
        log: string;
        team: Record<Crew, Record<CrewStat, number>>
        location: Place
        creature_log: Partial<Record<Creature, Partial<Record<CreatureStat, number>>>>
        worlds_visited: Record<string, 1>
        extra_vp: number;
        mission_len: 0 | 1 | 2;
        last_distance: number;
        months: number;
} & Record<Place, Inventory>
var state: State;

function toMap<K extends string, V>(a: Record<K, V>) {
        return new Map(Object.entries(a) as [K, V][]);
}

function p000() {
state = {
 log:'',
 team: {
  cmd: { cac:3,kic:3,wht:5,prt:5,spd:8,end:6, int: 6 },
  nav: { cac:3,kic:2,wht:6,prt:6,spd:7,end:6, int: 6 },
  med: { cac:3,kic:2,wht:6,prt:5,spd:6,end:6, int: 6 },
  mnt: { cac:3,kic:2,wht:6,prt:6,spd:9,end:6, int: 6 },
  gsv: { cac:3,kic:2,wht:7,prt:6,spd:6,end:6, int: 6 },
  sci: { cac:4,kic:2,wht:6,prt:5,spd:6,end:6, int: 6 },
  wpn: { cac:4,kic:3,wht:7,prt:7,spd:8,end:6, int: 6 },
 },
 ship: new Map([[ 'crt_007', 1]]),
 shuttle: new Map(),
 away: new Map(),
 location: 'ship',
 creature_log: {},
 worlds_visited: { 'Opoplo':1 },
 extra_vp: 0,
 mission_len: 2, // 10+l*10
 last_distance: 0,
 months: 30,
}
for(const [i, v] of toMap(state.team)) {
 v.int = 6 + roll1d6() / 2 | 0;
 state.ship.set(i, 1);
}
state.ship.set('enviorig', [7,11,14][state.mission_len]);
state.ship.set('armorig', [5,8,10][state.mission_len]);
for(const [i] of toMap({specibot:1,reconbot:1,ambot:1,imrebot:1})) {
 state.ship.set(i, [3,5,6][state.mission_len]);
}
for(const [i, j] of toMap({botkit:2,toolkit:2,medkit:2,scanner:2,turbolaser:2,netgun:2,climbkit:2,holographer:1,neuroscanner:1,rover:1})) {
 state.ship.set(i, j + state.mission_len);
}
state.months = 10 * (state.mission_len + 1);
console.log(state);
return { next_state: p201 };
}
function p201() {
pandora_log(201,'Outfitted, checked and rechecked, the <em>Pandora</em> departs from the Watkins Memorial Exploration Depot in the Creighton System. '
+'The FTL drive is activated and the mission heads for the first planet in its assigned exploration sector.');
return { next_state: p201a, type:'planet', prompt:'Choose a planet on the Interstellar Display to conduct Interstellar Movement.' };
}
function p201a(distance) {
 state.last_distance = distance;
 state.months -= distance;
 if (roll2d6() <= distance)
 switch(3 as number) {
// switch(roll2d6()) {
  case 2: return { next_state: p080 };
  case 3: return { next_state: p061 };
  case 4: return { next_state: p055 };
  case 5: return { next_state: p049 };
  case 6: return { next_state: p046 };
  case 7: return { next_state: p001 };
  case 8: return { next_state: p044 };
  case 9: return { next_state: p047 };
  case 10: return { next_state: p052 };
  case 11: return { next_state: p058 };
  case 12: return { next_state: p064 };
 }
 return { next_state: p201b };
}
function p201b() {
 pandora_log(201, "Planet Table");
 return { next_state: p999, type: 'ok' };
}
function p999() {
 pandora_log(0, "GAME OVER");
 return { next_state: p999, type: 'ok' };
}
function p080() {
 const crt = chooseRandom(isCreature) as Creature;
 if (!crt) return { next_state: p201b };
 pandora_log(80,"Immediately after coming out of FTL, "+creature_names[crt]+", a creature aboard the Pandora suddenly evolves into a highly aggressive, powerful, intelligent being.");
 if (creatureCmb(crt) > 6 && creatureInt(crt) > 6) { //p081
  pandora_log(81,"The creature easily escapes from its restraint pod, neutralizes all bots, kills all characters, and takes over the Pandora to fulfill a destiny unknown to us. The game is over.");
  return { next_state: p999, type:'ok' };
 } else if (creatureCmb(crt) > 7 && creatureInt(crt) < 6) { //p082
  pandora_log(82,"The creature goes on a rampage of destruction, reducing the Pandora to a hunk of twisted metal, as the creature and all aboard are killed. The game is over.");
  return { next_state: p999, type:'ok' };
 } else if ((creatureCmb(crt) == 6 || creatureCmb(crt) == 7) && creatureInt(crt) < 6) { //p083
  var result = numCreatures()/3|0;
  var txt = creature_names[crt];
  inventoryDec(state.ship, crt);
  for(var i = result; i--;) {
    const crt = chooseRandom(isCreature);
    if (crt) {
  inventoryDec(state.ship, crt);
    txt += i ? ", ":", and ";
    txt += creature_names[crt];
    }
  }
  txt += result ? " are" : " is";
  pandora_log(82,"The creature destroys the pod in which he is restrained. "+txt+" destroyed.");
 } else { //p084
  var txt = "The creature wanders out of its restraint pod looking for human flesh.";
  var result = roll2d6() - Math.max(creatureCmb(crt), creatureInt(crt));
  inventoryDec(state.ship, crt);
  if (result <= 0) {
   pandora_log(84, txt + " The specimen is destroyed without doing harm.");
  } else if (result < numTeamMembers()) {
   txt += " The ";
   for (var first = true, i = result; i--; first = false) {
    var who = chooseRandom(isTeamMemeber);
    if (who) {
    if (!first) txt += i ? ", " : " and ";
    txt += "the " + member_names[who];
    killTeamMember(who);
    }
   }
   pandora_log(84,txt + (result > 1?" are":" is") + " killed before the creature is destroyed.");
  } else {
   pandora_log(84,txt + " The creature kills all characters. The game is over.");
   return { next_state: p999, type:'ok' };
  }
 }
 return { next_state: p201b, type:'ok' };
}
function p061() {
   var txt = "After coming out of FTL, the <em>Pandora</em> is intercepted by a small fleet of renegade free traders who insist on inspecting her cargo.";
   if (hasWeaponsOfficer() && roll2d6() < state.team.wpn.int) {
    state.months--;
    txt += " The weapons officer skillfully uses the Pandora's screen systems to repel the intruder's grappling beams and the Pandora succeeds in jumping away from the scavengers' ships.";
    txt += " One extra month of Tour Time is expended.";
    pandora_log(61,txt);
   } else { //p169
    pandora_log(61,txt);
    var txt = "Ships from the unregistered fleet attach themselves to the Pandora.";
    var result = hasCommander() ? roll2d6() - state.team.cmd.int : 2;
    if (result < -1) {
     txt += " The commander attempts to bargain with the pirates in the hopes that they will be satisfied with a small part of the cargo.";
     txt += " The criminals are duped by a gift of useless surplus and computer printouts, and go their merry way.";
     pandora_log(169,txt);
    } else if (result < 2) { //p203
     txt += " The commander attempts to bargain with the pirates in the hopes that they will be satisfied with a small part of the cargo.";
     pandora_log(169,txt);
     txt = "The pirates will depart if they are given one of every type of bot and tool aboard the Pandora.";
     pandora_log(203,txt);
     return { next_state: p203, type:'yesno', prompt:'Does this sound reasonable?' };
    } else {
     pandora_log(169,txt);
     return { next_state: p183, type:'ok' };
    }
   } 
   return { next_state: p201b, type:'ok' };
}
function p203(ok) {
     if(ok) {
      for (const i of inventory(isToolOrBot)) inventoryDec(state.ship, i);
      return { next_state: p201b };
     } else {
      return { next_state: p183 };
     }
}
function p183() {
     var txt = "All-out combat with the pirates is the only choice left.";
     switch(roll1d6()) {
      case 1: case 2: case 3:
       var result = roll2d6();
       txt += " The pirates are driven off.";
       txt += " " + result + " Endurance Points are lost by the crew members.";
       pandora_log(183, txt);
       return { next_state: p183b, type:'damage', amount:result, crewonly:true }
      case 4: case 5: //p191
       pandora_log(183,txt);
       txt = "After a hard-fought battle, the pirates retreat.";
       result = roll1d6();
       if (result < numTeamMembers()) {
	txt += " The ";
	for (let first = true, i = result; i--; first = false) {
        var who = chooseRandom(isTeamMemeber);
        if (who) {
         if (!first) txt += i ? ", " : " and ";
         txt += "the " + member_names[who];
         killTeamMember(who);
        }
	}
        txt += (result > 1?" are":" is") + " killed.";
       } else {
        pandora_log(191,txt + " All characters are killed in the battle. The game is over.");
        return { next_state: p999 };
       }
       for (const i of inventory(isWeaponOrBot)) inventoryDec(state.ship, i);
       result = roll1d6();
       if (hasMaintenanceOfficer()) result -= 2;
       if (result > 0) {
        txt += " "+['One','Two','Three','Four','Five','Six'][result-1]+" extra Tour Month"+(result!=1?"s are":" is")+" expended repairing the Pandora."
       }
       pandora_log(191, txt);
       return { next_state: p201b };
      case 6:
       txt += " The pirates trash the Pandora and capture or kill all characters. The mission is over.";
       pandora_log(183, txt);
       return { next_state: p999 };
     }
}
function p183b(damage) {
  //for (var i in damage) {
  //}
  // TODO: apply damage
  state.months--;
  const txt = "One extra Tour Month is expended repairing slight damage to the Pandora.";
  pandora_log(183, txt);
  return { next_state: p201b, type: 'ok' };
}
function p055() {
   function reduceRating(who: Crew, what: CrewStat, howMuch: number) {
    state.team[who][what] = Math.max(1, state.team[who][what] - howMuch);
   }
   var who = chooseRandom(isTeamMemeber);
   if (who) {
   var txt = "A malfunction in the jump-sleep revival mechanism causes permanent brain damage to the " + member_names[who] + "."
   reduceRating(who, 'cac', 1);
   reduceRating(who, 'kic', 1);
   reduceRating(who, 'wht', 1);
   reduceRating(who, 'prt', 1);
   reduceRating(who, 'spd', 1);
   reduceRating(who, 'int', roll1d6());
   txt += " All his Ratings are reduced.";
   if (state.team[who].int < 3) {
    state.extra_vp -= 4;
    txt += " The character is no longer considered capable of fulfilling his duties. The character may be used on any expedition, but the officer function he performed no longer exists."
   }
   pandora_log(55,txt);
   }
   return { next_state: p201b, type:'ok' };
}
function p049() {
   var txt = "As the <em>Pandora</em> comes out of FTL, it encounters an asteroid storm.";
   var result = 5;
   if (hasTeamMember('cmd')) result = Math.max(result, state.team.gsv.int);
   if (hasTeamMember('nav')) result = Math.max(result, state.team.sci.int);
   if (hasTeamMember('mnt')) result = Math.max(result, state.team.mnt.int);
   result = 9 - result;
   txt += " "+['No','One','Two','Three','Four'][result]+" extra Tour Month"+(result!=1?"s are":" is")+" expended repairing damage caused by the hurling planetoids."
   state.months -= result;
   pandora_log(49,txt);
   return { next_state: p201b, type:'ok' };
}
function p046() {
   state.months--;
   pandora_log(46,"Star flares cause disturbances in faster-than-light travel routes: one extra Tour Month is expended for the current interstellar jump.");
   return { next_state: p201b, type:'ok' };
}
function p001() {
   if (state.last_distance > 1) {
    state.months--;
    pandora_log(1,'Navigational error has put the Pandora slightly off course; one extra tour month is expended.');
   }
   return { next_state: p201b, type:'ok' };
}
function p044() {
   var result, txt = "The interstellar jump puts an unexpected strain on the <em>Pandora</em>'s FTL systems.";
   if (hasMaintenanceOfficer()) {
    result = roll2d6() - state.team.mnt.int;
    if (result < 1) result = 1;
    else if (result > 4) result = 4;
    txt += " The maintenance officer is aboard, "+['one','two','three','four'][result-1]+" Tour Month"+(result!=1?"s are":" is")+" expended repairing the damage.";
   } else {
    result = 4;
    txt += " The maintenance officer is not aboard, four Tour Months are expended repairing the damage.";
   }
   pandora_log(44,txt);
   state.months -= result;
   return { next_state: p201b, type:'ok' };
}
function p047() {
   var txt = "The Fuji 5500 Central Processor is on the blink. Before the planet that the Pandora is orbiting can be surveyed, the system must be put right.";
   var result = 5;
   if (hasTeamMember('mnt')) result = Math.max(result, state.team.mnt.int);
   if (hasTeamMember('gsv')) result = Math.max(result, state.team.gsv.int);
   if (hasTeamMember('sci')) result = Math.max(result, state.team.sci.int);
   result = 9 - result;
   txt += " "+['No','One','Two','Three','Four'][result]+" extra Tour Month"+(result!=1?"s are":" is")+" expended getting the computer up again."
   state.months -= result;
   pandora_log(47,txt);
   return { next_state: p201b, type:'ok' };
}
function p052() {
   var crt = chooseRandom(isCreature);
        if (crt) {
                inventoryDec(state.ship, crt);
     pandora_log(52,creature_names[crt] + ", a creature aboard the Pandora has life support needs not detected by <em>Pandora</em> exobiological analysis equipment."
     +" Despite the crew's efforts to discover the missing (or unhealthy) element in its artificial environment, the creature dies.");
     return { next_state: p201b, type:'ok' };
   }
   return { next_state: p201b };
}
function p058(who) {
  var who = who || 'sci';
  if (isEmpty(state.worlds_visited) || !hasTeamMember(who)) return { next_state: p201b };
  var txt = "Exposure to undetected extraterrestrial virus strains drives the science officer space crazy.";
  var result = state.team.sci.int - roll1d6();
  pandora_log(58,txt);
  if (result > 0) {
    txt += " " + result + " Endurance Points are lost by the other crew members."
      // TODO: assign_damage(crew member, !sci)
    return { next_state: p058b, type: 'damage', amount:result, exclude:who, crewonly:true };
  }
  return { next_state: p058b, type: 'ok' };
}
function p058b(damage) {
  // TODO: assign_damage(crew member, !sci)
     switch (roll1d6()) {
      case 1: case 2: case 3: //para067
       state.months--;
       pandora_log(67,"The science officer's madness is temporary. After the expenditure of one month additional Tour Time, the virus runs its course and all is normal.");
       break;
      case 4: case 5: //para073
       if (hasMedicalOfficer() && roll2d6() <= state.team.med.int) {
        pandora_log(73,"Thanks to the medical officer the science officer???s madness is cured.");
       } else {
        killTeamMember('sci');
        state.extra_vp += 4; // not considered dead
        pandora_log(73,"A cure for the science officer's affliction cannot be found; he is placed in suspended animation and may not be used for the remainder of the mission.");
       }
       break;
      case 6: //para144
       killTeamMember('sci');
       var txt = "The science officer dies of his mysterious affliction, despite extensive treatment.";
       var result = roll1d6() - 2;
       if (result > 0) {
        state.months -= result;
        txt += " "+['One','Two','Three','Four'][result-1]+" month"+(result!=1?"s are":" is")+" expended in the futile attempt to save his life.";
       }
       if (!hasMedicalOfficer() && state.team.med.int <= 6) {
        txt += " The virus has infected another crew member."; //TODO: repeat
       }
       pandora_log(144,txt);
       break;
     }
   return { next_state: p201b, type:'ok' };
}
function p064() {
/* TODO
Mz: Op Kk Pl Nw Br
Mp: Op Kk Pl
Pc: Op Kk Pl Br
Op: Kk Pl Nw Br Sw
Br: Kk Pl
En: Op Kk Pl

9pl 36links
If the route of the current interstellar jump enters hex 14 (Opoplo) or any hex adjacent to 14 at any point.
The Pandora's sensors pick up a series of indecipherable transmissions from the planet. Galactic Survey Commission regulations require that the Pandora investigate.
The course of the Pandora must be altered (if necessary from the hex in which the transmission is received to Opoplo. and Tour Time expended is altered to fit the new destination.
Consult 088 to determine the attributes of the planet, then organize an expedition to the planet's surface (see 5.0). Do not roll the die to determine which hex the
expedition is placed in; instead place the party in hex 0817 and proceed to 076.

The shuttle has landed on a plain dotted with grasslike patches. Beneath the plain lies the source of the transmissions. An alien structure is considered to exist underground in hexes
0715 and 016. The climate is temperate. Deploy thecharacters, bots, and tools in the expedition display (see 5.6). Exploration of the landing hex is not required;
any expedition action may be performed. The party may not leave the environ until hex 0715 or 016 has been explored underground.
*/

   pandora_log(0,"<em>Opoplo Event TODO</em>");

   return { next_state: p201b };
}


var choice = { prompt:"Choose length of the mission.", type:'list', values: [0,1,2], value_names: { 0:"10 months", 1:"20 months", 2:"30 months" }, next_state:p000 } as any; 
//choice = choice.next_state(2);
//choice = choice.next_state();
//choice = choice.next_state(12);
//var zzz = 0;
//while (choice.next_state != p999 && zzz++ < 100) {
//choice = choice.next_state();
//}
/* display 
mission log / current actions / mission time
inventory ship/shuttle/away, character stats
interstellar map
planet map / planet stat / planet time
creature log
*/
function display() {
var tab;
if (state) {
tab = "<h3>Time Left: " + state.months + " VP: " + victoryPoints() + "</h3>";
tab += "<table><tr><th></th>";
var stats = [ 'cac','kic','wht','prt','spd','int','end'];
var stats_name = [ 'C','K','W','P','S','I','E' ];
for (var i = 0; i < stats.length; i++) {
  tab += "<th>"+stats_name[i]+"</th>";
}
for (var who in state.team) {
tab += "<tr><th>"+member_names[who]+"</th>";
for (var i = 0; i < stats.length; i++) {
  var val = state.team[who][stats[i]];
  if (stats[i] === 'end') {
    var r = '';
    if (1 || choice.type == 'damage' && !(choice.exclude && who in choice.exclude)) {
      var cur = choice.result ? choice.result[who] || 0 : 0;
      console.log(who+cur);
      for (var j = 0; j < 6; j++) {
        if (j < val) {
	r += '<span class="button" style="color:'+(j<val-cur?'black':'red')+'" onclick="console.log(choice.result);choice.result.'+who+'='+(cur==val-j?0:val-j)+';display();">???</span>';
	} else r += '???';
      } 
    } else for (var j = 0; j < 6; j++) {
      r += j<val?'???':'???';
    }
    val = r;
  }
  tab += "<td>"+val+"</td>";
}
}
tab += "</table>";
console.log(tab);
document.getElementById("inv")!.innerHTML = tab;
tab = "<h3>Ship</h3>";
for (const [what, count] of state.ship) if (!isTeamMemeber(what)) {
tab += what + ": " + count + "<br>";
}
document.getElementById("inv")!.innerHTML += tab;
document.getElementById("log")!.innerHTML = state.log;
}
if (choice.prompt)
  document.getElementById("log")!.innerHTML += tag('p',choice.prompt);
var values = choice.values;
var value_names = choice.value_names;
switch (choice.type) {
  case 'list':
   break;
  case 'planet':
   values = [2,12];
   value_names = { 2: "close", 12:"far" };
   break;
  case 'damage':
   values = ['choice.result'];
   value_names = { 'choice.result': 'Assigned' };
   choice.param = {};
   break;
  case 'yesno':
   values = [true, false];
   value_names = { true:'Yes', false:'No' };
   break;
  case 'ok':
   values = [0];
   value_names = { 0: "OK" };
   break;
  default:
   values = [0];
   value_names = { 0: "Auto" };
}
if (values) {
  tab = '';
  for (var i = 0; i < values.length; i++) {
    tab += tag('li', value_names[values[i]], {class:'button',onclick:'advance('+values[i]+')'});
  }
  tab = tag('ul',tab);
  document.getElementById("log")!.innerHTML += tab;
}
}
display();
function advance(param) {
  console.log(param);
  console.log(choice);
  choice = choice.next_state(param);
  while (!choice.type) {
    choice = choice.next_state();
  }
  choice.result = {};
  console.log(choice);
  display();
}

//onboard actions
function onboardRepair() {
//chooese tools/bots
//fix tools/bots
//return hasMaintenanceOfficer()?1:Math.ceil(num/4);
}
function onboardHeal() {
//choose endurance
//return Math.ceil(Math.max(max/(hasMedicalOfficer()?2:3),tot/(hasMedicalOfficer()?4:6)))
}
function onboardStudy() {
//return hasScienceOfficer() ? 0 : 1;
}
