// Random Generator
module.exports = {
  calcStats: function(units, struggle, target, struggleRaid, raid) {
    var charStats = {offense: struggle}
    if(target) {
      charStats.defence = target;
    }
    var boosts = {
      offense: {health: 0, damage: 0, moveSpeed: 0, luckBuff: 0},
      defence: {health: 0, damage: 0, moveSpeed: 0, luckBuff: 0}
    }
    // Main stat calculation
    for(var i in charStats) {
      // Stat boost calculation
      for(var ii in charStats[i].unitLayout[i]) {
        var soldierName = charStats[i].unitLayout[i][ii];
        var assigned = (i == "defence") ? charStats[i].soldiers[soldierName].amount : charStats[i].soldiers[soldierName].assigned
        boosts[i].damage = boosts[i].damage + ((units[soldierName].damageBuff/100)*assigned);
        boosts[i].health = boosts[i].health + ((units[soldierName].healthBuff/100)*assigned);
        boosts[i].moveSpeed = boosts[i].moveSpeed + ((units[soldierName].moveSpeedBuff/100)*assigned);
        boosts[i].luckBuff = boosts[i].luckBuff + ((units[soldierName].luckBuff/100)*assigned);
      }
      charStats[i].boosts = boosts;
      for(var ii in charStats[i].unitLayout[i]) {
        var soldierName = charStats[i].unitLayout[i][ii],

            assigned = charStats[i].soldiers[soldierName].assigned,
            amount = charStats[i].soldiers[soldierName].amount
        if(i == "defence") { // Defenending -- Should use all units
          assigned = amount;
        } else { // Offending -- Should use only assigned units
          assigned = assigned;
        }
        if(i == "defence") {
          if(struggleRaid) { // Raiding -- should have raiding units minused
            var raiding = struggleRaid.offense.soldiers[soldierName].assigned
            assigned = assigned - raiding;
            amount = amount - raiding;
          }
        }
        charStats[i].soldiers[soldierName].assigned = assigned;
        charStats[i].soldiers[soldierName].amount = amount;
        charStats[i].soldiers[soldierName].health = (units[soldierName].health * assigned) * (boosts[i].health + 1);
        charStats[i].soldiers[soldierName].damage = (units[soldierName].damage * assigned) * (boosts[i].damage + 1);
        charStats[i].soldiers[soldierName].attackRange = units[soldierName].attackRange;
        charStats[i].soldiers[soldierName].moveSpeed = (units[soldierName].moveSpeed) * (boosts[i].moveSpeed + 1);
        charStats[i].soldiers[soldierName].damageBuff = units[soldierName].damageBuff;
        charStats[i].soldiers[soldierName].healthBuff = units[soldierName].healthBuff;
        charStats[i].soldiers[soldierName].moveSpeedBuff = units[soldierName].moveSpeedBuff;
      }
    }

    // Attack calculations
    if(raid) {
      for(var i in charStats.offense.unitLayout.offense) {
        if(charStats.offense.soldiers[charStats.offense.unitLayout.offense[i]].health <= 0) {
          charStats.offense.unitLayout.offense.splice(i, 1);
        }
      }
    }
    return {charStats: Object.assign(charStats), boosts: boosts};
  },
  calcSpeed: function(charStats) {
    var speed = 0,
        chars = 0;
    for(var i in charStats) { // Calculates total speed
      if(parseInt(charStats[i].moveSpeed)) { // Checks if soldiers has movement speed
        chars = chars + 1;
        speed = speed + charStats[i].moveSpeed
      }
    }
    var distance = speed/chars;
    speed = Math.round((1000/distance) * 100) / 100;
    return speed;
  },
  calcRaid: function(offenseLayout, attackPattern, charStats) {
    var charStatsBefore = JSON.parse(JSON.stringify(charStats)),
        raidLog = [],
        loop = true,
        struggleConfig = require("../config/struggle/struggle.json"); // Struggle config
    if(offenseLayout.length <= 0) {
      loop = false;
    }
    var round = 0;
    raidLog.push({
      round: round,
      stats: JSON.parse(JSON.stringify(charStats))
    });
    var luckOffense = charStats.offense.boosts.offense.luckBuff/2,
        luckDefence = charStats.defence.boosts.defence.luckBuff/2;
    // Calculates who goes first randomly | 50%/50%
    var coinFlip = {
      flip: Math.random(), // 0-1 rng | Higher number favors offense, lower favors defence
      evaluator: (struggleConfig.raid.flipEvaluator + luckOffense) - luckDefence,
      offense: "b", // Defence goes first
      winner: "defence"
    }
    if(coinFlip.flip < coinFlip.evaluator) {
      coinFlip.offense = "a"; // Offense goes first
      coinFlip.winner = "offense";
    }
    //console.log(coinFlip.winner + " won the coin flip");
    while(loop) {
      round = round + 1;
      //console.log("Round: " + round)
      var attacks = {
        offense: {},
        defence: {}
      }
      for(var i in attackPattern) {
        var team = (attackPattern[i].team == coinFlip.offense) ? "offense" : "defence", // Calculates attacking team
            enemy = ((team == "offense") ? "defence" : "offense"), // Calculates defending team
            slot = attackPattern[i].slot - 1, // Calculates slot from which attack will come
            offenderName = charStats[team].unitLayout[team][slot], // Calculates unit that will attack
            offender = charStats[team].soldiers[offenderName]; // Gets attacking unit's stats
        if(typeof offenderName != "undefined") {
          var attackRange = offender.attackRange; // Gets attacking unit's attack range
          var enemySlot = ((slot - attackRange) * -1) - 1;
          if(enemySlot >= charStats[enemy].unitLayout[enemy].length) {
            enemySlot = (charStats[enemy].unitLayout[enemy].length-1);
          }
          if(enemySlot < 0) {
            //console.log(offenderName+"("+offender.damage+")" + " =/>")
            var totalHealth = 0;
            for(var ii in charStats[enemy].unitLayout[enemy]) {
              totalHealth = totalHealth + charStats[enemy].soldiers[charStats[enemy].unitLayout[enemy][ii]].health;
            }
          } else {
            var defenderName = charStats[enemy].unitLayout[enemy][enemySlot], // Gets defending unit's name
                defender = charStats[enemy].soldiers[defenderName]; // Gets defending unit's stats
            //console.log(offenderName+"("+offender.damage+")" + " => " + defenderName+"("+defender.health+")");
            defender.health = defender.health - offender.damage;
            var totalHealth = 0;
            for(var ii in charStats[enemy].unitLayout[enemy]) {
              totalHealth = totalHealth + charStats[enemy].soldiers[charStats[enemy].unitLayout[enemy][ii]].health;
            }
            if(defender.health <= 0) {
              defender.health = 0;
              //console.log(enemy + "'s unit has died: " + defenderName + "("+defender.health+")");
              charStats[enemy].unitLayout[enemy].splice(enemySlot, 1);
              /*killLog.push({
                team: enemy,
                name: defenderName,
                remaining: Array.from(charStats[enemy].unitLayout[enemy])
              });*/
            }
          }
          if(totalHealth <= 0) {
            loop = false;
          }
        }
        attacks[team][slot] = enemySlot;
      }
      raidLog.push({
        round: round,
        stats: JSON.parse(JSON.stringify(charStats)),
        attacks: attacks
      });
    }
    var totalHealth = {
      offense: 0,
      defence: 0
    }
    for(var i in totalHealth) {
      for(var ii in charStats[i].unitLayout[i]) {
        totalHealth[i] = totalHealth[i] + charStats[i].soldiers[charStats[i].unitLayout[i][ii]].health;
      }
    }
    var lostUnits = {
      offense: {},
      defence: {}
    }
    var finalRound = raidLog[raidLog.length-1].stats
    for(var i in finalRound) {
      var statsBefore = charStatsBefore[i].soldiers,
          statsAfter = finalRound[i].soldiers,
          boosts = charStatsBefore[i].boosts
      for(var ii in statsBefore) {
        if(typeof statsBefore[ii].health != "undefined") {
          var healthBoost = ((boosts[i].health+1)*100),
              totalHealthBefore = Math.round((statsBefore[ii].health/healthBoost)*100),
              totalHealthAfter = Math.round((statsAfter[ii].health/healthBoost)*100),
              singleHealth = totalHealthBefore/statsBefore[ii].assigned,
              lostUnitsNo = Math.floor((totalHealthBefore - totalHealthAfter) / singleHealth);
          lostUnits[i][ii] = lostUnitsNo;
        }
      }
    }
    return {totalHealth: totalHealth, raidLog: raidLog, lostUnits: lostUnits, coinFlip: coinFlip};
  },
  subtractSoldiers: function(soldiers, lostUnits) {
    for(var i in soldiers) {
      for(var ii in lostUnits) {
        if(i == ii) {
          if(!isNaN(lostUnits[ii])) soldiers[i].amount = soldiers[i].amount - lostUnits[ii];
          if(soldiers[i].assigned > soldiers[i].amount) soldiers[i].assigned = soldiers[i].amount;
        }
      }
    }
    return soldiers;
  },
  subtractLayout: function(soldiers, unitLayout) {
    for(var i in soldiers) {
      if(soldiers[i].amount <= 0) {
        for(var ii in unitLayout) {
          var index = unitLayout[ii].indexOf(i)
          if(index != -1) unitLayout[ii].splice(index, 1);
        }
      }
    }
    return unitLayout;
  },
  transferWorkers: function(results) {
    var stats = results.raidLog[0].stats,
        totalHealth = results.totalHealth,
        winner = (totalHealth.offense < totalHealth.defence) ? "defence" : "offense",
        loser = (totalHealth.offense > totalHealth.defence) ? "defence" : "offense",
        winnerWorkers = stats[winner].workers,
        loserWorkers = stats[loser].workers
    if(winner == "offense") {
      for(var i in loserWorkers) {
        winnerWorkers[i].amount = (winnerWorkers[i].amount + Math.ceil(loserWorkers[i].amount/2));
        loserWorkers[i].amount = (loserWorkers[i].amount - Math.ceil(loserWorkers[i].amount/2));
      }
    }
    var workers = {};
    workers[winner] = winnerWorkers;
    workers[loser] = loserWorkers;
    return workers;
  }
};
