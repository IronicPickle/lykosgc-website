// Updates user info
function updateUserInfo(socket, data) {
  var struggle = data.struggle;
  $("#village_title").text(struggle.villageName);
  $("#username").attr("value", struggle.username);
}
// Updates unit info on the client side
function updateUnits(socket, data) {
  keyPressEvents(true, JSON.parse(JSON.stringify(data)));
  var units = data.units,
      struggle = data.struggle,
      usersUnits = Object.assign(struggle.workers, struggle.soldiers);
  for(var i in usersUnits) {
    $(".current_"+i).text(usersUnits[i].amount);
    $(".role_"+i).text(units[i].role);
    if(units[i].type == "worker") {
      $(".cps_"+i).text(units[i].cps * usersUnits[i].amount);
    }
  }
  updateCosts(units, usersUnits, 0);
  for(var i in clickCounter) {
    clearInterval(clickCounter[i]);
    clickCounter.splice(i);
  }
  var totalCPS = 0;
  for(var i in units) {
    if(units[i].type == "worker") {
      totalCPS = totalCPS + (units[i].cps * usersUnits[i].amount);
    }
  }
  clickCounter.push(setInterval(function() {
    currMoney = currMoney + totalCPS;
    numIncr();
  }, 1000));
}
// Click evnets for buying units
function buyUnitEvents(state, socket) {
  $("[id=units_buy_button]").off("click");
  if(state) {
    $("[id=units_buy_button]").on("click", function(event) {
      if((new Date().getTime() - lastPurchase.getTime()) < 200) return;
      lastPurchase = new Date();
      var amount = 1;
      if(event.shiftKey) {
        if(event.altKey) {
          amount = 100;
        } else {
          amount = 10;
        }
      }
      var name = $(this).attr("unit");
      socket.emit("addMoney", JSON.stringify({money: currMoney}));
      socket.emit("buyUnit", JSON.stringify({name: name, amount: amount}));
    });
  }
}
// Update unit layout
function updateLayout(socket, data, type) {
  var units = data.units,
      layout = data.struggle.unitLayout[type];
      raidSpeed = data.raidSpeed;
  if(type == "offense") $("#manage_layout_raid_speed").text("ETA: " + raidSpeed + " mins"); else $("#manage_layout_raid_speed").text("");
  $("#manage_layout_luck_boost").text("Luck: " + Math.floor(data.stats.boosts[type].luckBuff*100) + "%");
  $("[id=manage_layout_img]").attr("src", "/images/struggle/soldiers/none.png");
  $("[id=manage_layout_name]").text("None");
  $("#manage_layout_title").text(type.charAt(0).toUpperCase() + type.slice(1).replace("_", " "));
  for(var i in layout) {
    $("[id=manage_layout_img]").eq((i-3)*-1).attr("src", "/images/struggle/soldiers/" + layout[i] + ".png");
    $("[id=manage_layout_name]").eq((i-3)*-1).text((parseInt(i)+1) + ": " + units[layout[i]].name);
  }
  $("#manage_units_grid_container").children().remove();
  var soldiers = data.struggle.soldiers;
  var offenseSoldiers = data.stats.charStats.defence.soldiers;
  for(var i in soldiers) {
    var amount = offenseSoldiers[i].amount,
        assigned = soldiers[i].assigned,
        unavailable = soldiers[i].amount - offenseSoldiers[i].amount;
    if(data.struggle.soldiers[i].amount > 0) {
      $("#manage_units_grid_container").append(
        "<img src='/images/struggle/soldiers/"+i+".png' alt='' id='manage_units_unit_img'/>"+
        "<p id='manage_units_unit_name'>"+units[i].name+" "+
          "<span id='manage_units_assigned'>"+
            assigned+
          "</span>/"+
          amount+
          "<br/><span style=';font-size:16px;'>&nbsp;Unavailable ("+unavailable+")</span>"+
        "</p>"+
        "<div id='manage_units_assigned_container'>"+
          "<div id='manage_units_assigned_increase' unit='"+i+"'>+</div>"+
          "<div id='manage_units_assigned_decrease' unit='"+i+"'>-</div>"+
        "</div>"
      );
    }
  }
  manageClickEvents(socket, data);
}
// Manage units events
function manageClickEvents(socket, data) {
  $("[id=manage_units_unit_img]").off("click");
  $("#manage_layout_toggle_button").off("click");
  $("#manage_layout_clear_button").off("click");
  $("[id=manage_units_unit_img]").on("click", function() {
    var index = $(this).index("[id=manage_units_unit_img]");
    var units = data.units;
    var usersUnits = data.struggle.soldiers;
    for(var i in usersUnits) {
      if(usersUnits[i].amount <= 0) {
        delete usersUnits[i];
      }
    }
    var name = Object.keys(usersUnits)[index];
    var type = $("#manage_layout_title").text().toLowerCase().replace(" ", "_");
    socket.emit("updateUnits", JSON.stringify({name: name, type: type}));
  });
  $("#manage_layout_toggle_button").on("click", function() {
    var type = $("#manage_layout_title").text().toLowerCase().replace(" ", "_");
    if(type == "offense") {
      updateLayout(socket, data, "defence");
    } else {
      updateLayout(socket, data, "offense");
    }
  });
  $("#manage_layout_clear_button").on("click", function() {
    var type = $("#manage_layout_title").text().toLowerCase().replace(" ", "_");
    socket.emit("clearUnits", JSON.stringify({type: type}));
  });
  $("[id=manage_units_assigned_increase]").off("click");
  $("[id=manage_units_assigned_decrease]").off("click");
  $("[id=manage_units_assigned_increase]").on("click", function(event) {
    var unit = $(this).attr("unit"),
        assigned = data.struggle.soldiers[unit].assigned,
        amount = data.struggle.soldiers[unit].amount,
        change = 1;
    if(event.shiftKey) {
      change = (amount - assigned);
    }
    socket.emit("updateAssign", JSON.stringify({unit: unit, change: change}));
  });
  $("[id=manage_units_assigned_decrease]").on("click", function(event) {
    var unit = $(this).attr("unit"),
        assigned = data.struggle.soldiers[unit].assigned,
        amount = data.struggle.soldiers[unit].amount,
        change = -1;
    if(event.shiftKey) {
      change = assigned*-1;
    }
    socket.emit("updateAssign", JSON.stringify({unit: unit, change: change}));
  });
}
// Updates unit layout stats
function updateStats(socket, data) {
  unitStatClickEvents(data);
}
// Unit layout stat click events
function unitStatClickEvents(data) {
  $("#manage_stats_title").text("Select a unit");
  $("#manage_stats_text").hide();
  $("#manage_stats_img").hide();
  $("[id=manage_layout_img]").off("click");
  $("[id=manage_layout_img]").on("click", function() {
    var type = $("#manage_layout_title").text().toLowerCase().replace(" ", "_"),
        name = $(this).prev().prev().prev().prev().text();
    name = name.slice(3).toLowerCase().replace(" ", "_");
    if(name == "e") return;
    var soldier = data.struggle.soldiers[name],
        offenseSoldier = data.stats.charStats[type].soldiers[name],
        boosts = data.stats.boosts[type],
        unavailable = soldier.amount - offenseSoldier.amount;
    $("#manage_stats_title").text("Stats");
    $("#manage_stats_text").show();
    $("#manage_stats_img").show();
    $("#manage_stats_img").attr("data", "/images/struggle/soldiers/" + name + ".svg");
    $("#manage_stats_name").text(name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "));
    $("#manage_stats_assigned").text("Available: " + offenseSoldier.assigned + " / " + offenseSoldier.amount);
    $("#manage_stats_unavailable").text("("+unavailable+")");
    $("#manage_stats_health").text(Math.round(offenseSoldier.health));
    $("#manage_stats_healthBuff").text(Math.round((boosts.health*100) * 10) / 10);
    $("#manage_stats_damage").text(Math.round(offenseSoldier.damage));
    $("#manage_stats_damageBuff").text(Math.round((boosts.damage*100) * 10) / 10);
    $("#manage_stats_moveSpeed").text(Math.round(offenseSoldier.moveSpeed));
    $("#manage_stats_moveSpeedBuff").text(Math.round((boosts.moveSpeed*100) * 10) / 10);
    $("#manage_stats_attackRange").text(Math.round(offenseSoldier.attackRange));
  });
}
// Updates village list
function updateVillages(socket, data) {
  $("#village_container").children().not(":eq(0)").remove();
  for(var i in data) {
    var coins = coinFormatter(data[i].money);
    $("#village_container").append(
      "<div id='village_item_container'>"+
        "<p id='village_item_username'>"+data[i].username+"</p>"+
        "<p id='village_item_villagename'>"+data[i].villageName+"</p>"+
        "<object id='village_item_img' data='/images/struggle/village1.svg' type='image/svg+xml'></object>"+
        "<div id='village_item_money_container'>"+
          "<object data='/images/struggle/bronze_coin.svg' type='image/svg+xml' id='village_item_money_coin'></object>"+
          "<span id='village_item_money' class='village_item_money_bronze'>"+coins.bronze+"</span>"+
          "<object data='/images/struggle/silver_coin.svg' type='image/svg+xml' id='village_item_money_coin'></object>"+
          "<span id='village_item_money' class='village_item_money_silver'>"+coins.silver+"</span>"+
          "<object data='/images/struggle/gold_coin.svg' type='image/svg+xml' id='village_item_money_coin'></object>"+
          "<span id='village_item_money' class='village_item_money_gold'>"+coins.gold+"</span>"+
        "</div>"+
        "<span id='village_item_villageID' hidden>"+data[i]._id+"</span>"+
      "</div>"
    );
  }
  villageClickEvents(socket);
}
// Villages click events
function villageClickEvents(socket) {
  $("[id=village_item_container]").off("click");
  $("[id=village_item_container]").on("click", function() {
    var villageData =  {
      _id: $(this).children("#village_item_villageID").text(),
      username: $(this).children("#village_item_username").text(),
      villagename: $(this).children("#village_item_villagename").text()
    }
    toggleRaidConfirmContainer(true, villageData);
    $("#raid_confirm_yes").off("click");
    $("#raid_confirm_yes").on("click", function() {
      toggleNotification(true, "loader", "Starting raid...");
      toggleRaidConfirmContainer(false);
      var villageID = $()
      socket.emit("startRaid", JSON.stringify({_id: villageData._id}));
    });
  });
  $("#raid_confirm_no, #page_cover").off("click");
  $("#raid_confirm_no, #page_cover").on("click", function() {
    toggleRaidConfirmContainer(false);
    toggleRaidResultsContainer(false);
  });
}
// Toggles raid confirmation container
function toggleRaidConfirmContainer(state, villageData) {
  if (villageData) {
    $("#raid_confirm_text").html("<b>" + villageData.username + "'s Village:</b> <br/>" + villageData.villagename);
    $("#raid_confirm_title").text("Are you sure you want to raid:");
  }
  if(state) {
    $("#raid_confirm_yes").css("box-shadow", "")
    $("#raid_confirm_sub_container").slideDown(200, "swing");
    $("#page_cover").fadeIn();
    $("#raid_confirm_yes").focus();
  } else {
    $("#raid_confirm_sub_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  }
}
// Toggles raid results container
function toggleRaidResultsContainer(state) {
  if (state) {
    $("#raid_results_sub_container").slideDown(200, "swing");
    $("#page_cover").fadeIn();
  } else {
    $("#raid_results_sub_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  }
}
// Updates client with raid results
function updateRaidResults(socket, data) {
  var results = data.results;
  if(results.length == 0) return;
  $("#raid_results_round").text(1);
  $("#raid_results_raid_no").text(1);
  toggleRaidResultsContainer(true);
  raidResultsClickEvents(results, 0);
  constructRaidResults(results, 0, 0);
  raidNextClickEvents(results);
  $("#raid_results_close").off("click");
  $("#raid_results_close").on("click", function() {
    toggleRaidResultsContainer(false);
  });
  if(results.length == 1) {
    $(".raid_results_nav_raids_next").hide();
  } else {
    $(".raid_results_nav_raids_next").show();
  }
}
// Handles raid results click events ? Next raids
function raidNextClickEvents(results) {
  $(".raid_results_nav_raids_next").off("click");
  $(".raid_results_nav_raids_next").on("click", function() {
    var direction = $(this).attr("direction");
    var raidNo = parseInt($("#raid_results_raid_no").text())-1;
    if(direction == "next") {
      if(raidNo < results.length-1) raidNo = raidNo + 1; else raidNo = 0;
    } else {
      if(raidNo > 0) raidNo = raidNo - 1; else raidNo = results.length-1;
    }
    $("#raid_results_raid_no").text(raidNo+1);
    raidResultsClickEvents(results, raidNo);
    constructRaidResults(results, raidNo, 0);
  });
}
// Handles raid results click events ? Rounds
function raidResultsClickEvents(results, i) {
  $("[id=raid_results_nav]").off("click");
  $("[id=raid_results_nav]").on("click", function() {
    var direction = $(this).attr("direction");
    var round = parseInt($("#raid_results_round").text())-1;
    if(direction == "next") {
      if(round < results[i].results.raidLog.length-1) round = round + 1; else round = 0;
    } else {
      if(round > 0) round = round - 1; else round = results[i].results.raidLog.length-1;
    }
    $("#raid_results_round").text(round+1);
    constructRaidResults(results, i, round);
  });
}
// Constructs raid results
function constructRaidResults(results, i, round) {
  if(round > 0) $(".raid_results_nav_prev").text("Round " + (round)); else $(".raid_results_nav_prev").text("Round " + (results[i].results.raidLog.length));
  if(round < results[i].results.raidLog.length-1) $(".raid_results_nav_next").text("Round " + (round+2)); else $(".raid_results_nav_next").text("Round " + 1);
  var raidLog = results[i].results.raidLog;
      coinFlip = results[i].results.coinFlip;
      stats = raidLog[round].stats,
      ally = {side: results[i].side, winner: (results[i].results.totalHealth[results[i].side] <= 0) ? false : true},
      enemy = {side: (ally.side == "offense") ? "defence" : "offense"};
  if(ally.winner) {
    $("#raid_results_title_text").text("You defeated");
    $("#raid_results_title_winner").text(results[i][enemy.side].username);
    $("#raid_results_lost_workers_title").text("Gained Workers");
  } else {
    $("#raid_results_title_text").text("You have been defeated by");
    $("#raid_results_title_winner").text(results[i][enemy.side].username);
    $("#raid_results_lost_workers_title").text("Lost Workers");
  }
  var prevRound = (round == 0) ? round : round-1;
  enemy.lineup = raidLog[prevRound].stats[enemy.side].unitLayout[enemy.side];
  enemy.soldiers = stats[enemy.side].soldiers;
  ally.lineup = raidLog[prevRound].stats[ally.side].unitLayout[ally.side];
  ally.soldiers = stats[ally.side].soldiers;
  $("[id=raid_results_lineup_grid_container]").children().remove();
  $("[id=raid_results_lineup_grid_container]").eq(0).css("grid-template-columns", "repeat("+enemy.lineup.length+", "+100/enemy.lineup.length+"%)");
  $("[id=raid_results_lineup_grid_container]").eq(1).css("grid-template-columns", "repeat("+ally.lineup.length+", "+100/ally.lineup.length+"%)");
  for(var ii in enemy.lineup) {
    $("[id=raid_results_lineup_grid_container]")
      .eq(0)
      .append("<img alt='' src='/images/struggle/soldiers/" + enemy.lineup[ii] + ".png' style='box-shadow: 0 0 5px rgba(184,38,1,1);' id='raid_results_lineup_grid_img'></object>");
  }
  for(var ii in enemy.lineup) {
    $("[id=raid_results_lineup_grid_container]")
      .eq(0)
      .append("<span>" + (parseInt(ii)+1) + ": " + enemy.lineup[ii].charAt(0).toUpperCase() + enemy.lineup[ii].slice(1).replace("_", " ") + " x" + enemy.soldiers[enemy.lineup[ii]].assigned + "<br/>("+Math.round(enemy.soldiers[enemy.lineup[ii]].health)+" ❤️)<br/>("+Math.round(enemy.soldiers[enemy.lineup[ii]].damage)+"🗡️)</span>");
  }
  if(enemy.lineup.length == 0) {
    $("[id=raid_results_lineup_grid_container]")
      .eq(0)
      .append("<img alt='' src='/images/struggle/soldiers/none.png' style='box-shadow: 0 0 5px rgba(184,38,1,1);'  id='raid_results_lineup_grid_img'></object>")
      .append("<span><br/>No units left!</span>");
  }
  for(var ii in ally.lineup) {
    $("[id=raid_results_lineup_grid_container]")
      .eq(1)
      .append("<img alt='' src='/images/struggle/soldiers/" + ally.lineup[ii] + ".png' style='box-shadow: 0 0 5px rgba(38,184,1,1);' id='raid_results_lineup_grid_img'></object>");
  }
  for(var ii in ally.lineup) {
    $("[id=raid_results_lineup_grid_container]")
      .eq(1)
      .append("<span>" + (parseInt(ii)+1) + ": " + ally.lineup[ii].charAt(0).toUpperCase().replace("_", " ") + ally.lineup[ii].slice(1) + " x" + ally.soldiers[ally.lineup[ii]].assigned + "<br/>("+Math.round(ally.soldiers[ally.lineup[ii]].health)+" ❤️)<br/>("+Math.round(ally.soldiers[ally.lineup[ii]].damage)+"🗡️)</span>");
  }
  if(ally.lineup.length == 0) {
    $("[id=raid_results_lineup_grid_container]")
      .eq(1)
      .append("<img alt='' src='/images/struggle/soldiers/none.png' style='box-shadow: 0 0 5px rgba(38,184,1,1);' id='raid_results_lineup_grid_img'></object>")
      .append("<span><br/>No units left!</span>");

  }
  $(".raid_results_lost_container").children().not(".raid_results_lost_title").remove();
  var lostUnits = results[i].results.lostUnits[ally.side];
  for(var ii in lostUnits) {
    if(lostUnits[ii] != 0 && lostUnits[ii] != null) {
      $("#raid_results_lost_soldiers_container")
        .append("<object data='/images/struggle/soldiers/" + ii + ".svg' type='' class='raid_results_lost_img'></object>")
        .append("<p class='raid_results_lost_text'>x"+lostUnits[ii]+"</p>");
    }
  }
  var newWorkers = results[i].results.newWorkers[ally.side],
      oldWorkers = stats[ally.side].workers,
      workerChange = {};
  for(var ii in newWorkers) {
    workerChange[ii] = Math.abs(newWorkers[ii].amount - oldWorkers[ii].amount);
  }
  for(var ii in workerChange) {
    if(workerChange[ii] != 0) {
      $("#raid_results_lost_workers_container")
        .append("<object data='/images/struggle/workers/" + ii + ".svg' type='' class='raid_results_lost_img'></object>")
        .append("<p class='raid_results_lost_text'>x"+workerChange[ii]+"</p>");
    }
  }
  if(ally.side == coinFlip.winner) {
    $("#raid_results_coin_flip_text")
      .html("You <b style='color:rgba(38,184,1,1);'>won</b> the coin toss, and attacked first!");
  } else {
    $("#raid_results_coin_flip_text")
    .html("You <b style='color:rgba(184,38,1,1);'>lost</b> the coin toss, and attacked second!");
  }
}

// Reverses an Object
function reverseObject(object) {
  var array = Object.entries(object)
  delete object;
  object = {};
  for(var i = array.length-1; i >= 0; i--) {
    object[array[i][0]] = array[i][1]
  }
  return object;
}
