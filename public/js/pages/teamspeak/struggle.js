$(document).ready(function () {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  // ---

	// --- Initial setup

  var socket = io("/struggle");
  socketSetup(socket, _csrf);
  toggleHeader(false);
  toggleFooter(false);
  scrollEvents(false);
  buyUnitEvents(true, socket);
  toggleContainerEvents();
  tooltipHoverEvents();
  detailsContainerEvents(true, socket);
  toggleAnimationsEvents();
  clearGraceEvents(socket);
  setTimeout(function() {resize();},100);
  setTimeout(function() {toggleClickContainer(false);toggleManageContainer(false);}, 500);
  spinResetIntervals();
});
var clickCounter = [],
    updateInterval = [],
    inRaidIntervals = [],
    outRaidIntervals = [],
    gracePeriodIntervals = [],
    dropIntervals = [],
    spinIntervals = [],
    spinBlock = false,
    spinCount = 0,
    disableAnimations = false,
    lastPurchase = new Date();
// Clear grace period event
function clearGraceEvents(socket) {
  $("#clear_grace_text").off("click");
  $("#clear_grace_text").on("click", function() {
    $("#raid_confirm_title").text("Are you sure you want to relinquish your grace pertiod?");
    $("#raid_confirm_text").html("<b>WARNING!</b> This cannot be undone!");
    toggleRaidConfirmContainer(true);
    $("#raid_confirm_yes").off("click")
    $("#raid_confirm_yes").on("click", function() {
      $(this).css("box-shadow", "0 0 20px rgba(184,38,1,1)")
      $("#raid_confirm_text").html("Click again to confirm!");
      $("#raid_confirm_yes").off("click")
      $("#raid_confirm_yes").on("click", function() {
        socket.emit("clearGrace");
        toggleRaidConfirmContainer(false);
      });
    });
  });
}
// Toggle animations events
function toggleAnimationsEvents() {
  $("#toggle_animations_button").off("click").on("click", function() {
    toggleAnimations();
  });
}
// Toggle animations
function toggleAnimations() {
  disableAnimations = !disableAnimations;
  if(disableAnimations) $("#toggle_animations_text").text("Enable Animations"); else $("#toggle_animations_text").text("Disable Animations");;
}
// Generic not-specific events
function otherEvents(socket) {
  $(window).on("beforeunload", function() {
    socket.emit("addMoney", JSON.stringify({money: currMoney}));
  });
  $("#click_coin_trigger, click_coin").on("select", function() {
    return false;
  });
  $(window).on("resize", function() {
    toggleClickContainer(false);
    toggleManageContainer(false);
    resize();
  });
  $("#raid_all_button").off("click");
  $("#raid_all_button").on("click", function() {
    socket.emit("getData", JSON.stringify({allRaids: true}));
  });
}
// Resizes unit info containers
function resize() {
  var width = $("#worker_container").width();
  if(width < 430) {
    $("#worker_container").css("grid-template-columns", "auto");
    $("#soldier_container").css("grid-template-columns", "auto");
    $("[id=units_info_container]").css("margin", "10px");
    $("[id=units_buy_container]").css("margin", "10px");
  } else {
    $("#worker_container").css("grid-template-columns", "auto auto");
    $("#soldier_container").css("grid-template-columns", "auto auto");
    $("[id=units_info_container]").css("margin", "10px 5px 10px 10px");
    $("[id=units_buy_container]").css("margin", "10px 10px 10px 5px");
  }
}
// Chain for not logged in setup
function loginTimeoutSetup() {
  var loginTimeout = setTimeout(function() {
    toggleNotification(true, "loader", "Connection taking a long time...");
    $("#first_time_title").text("We can't connect you to the server.");
    $("#first_time_text1").html("Either you're not <a href='/login'><b>logged</b></a> in, or an error has occured.");
    $("#first_time_text2").html("Refreshing in...");
    $("#first_time_container").show();
    $("#first_time_title").show();
    $("#first_time_text1").show();
    setTimeout(function() {
      $("#first_time_counter").fadeIn(200, "swing");
      $("#first_time_text2").fadeIn(200, "swing");
      $("#first_time_counter").text("5");
    }, 1000);
    var i = 5;
    setInterval(function() {
      $("#first_time_counter").text(i);
      i = i - 1;
    }, 1000);
    setTimeout(function() {
      location.reload();
    }, 6000);
  }, 5000);
  return loginTimeout;
}
// Chain for not synced setup
function notSyncedSetup() {
  $("body").css("opacity", "1");
  $("body").children()
    .not("#first_time_container")
    .not("#notification_container")
    .not("#top_container")
    .css("opacity", "0");
  $("#first_time_container").show();
  setTimeout(function() {$("#first_time_title").fadeIn(200, "swing").text("Your account is not synced!");}, 1000);
  setTimeout(function() {$("#first_time_text1").fadeIn(200, "swing").html("Sync your account on the <b><a href='/teamspeak'>TeamSpeak</a></b> page in order to play.");}, 2000);
  setTimeout(function() {$("#first_time_text2").fadeIn(200, "swing").text("Redirecting in...");}, 4000);
  setTimeout(function() {$("#first_time_counter").fadeIn(200, "swing").text("3");}, 5000);
  setTimeout(function() {$("#first_time_counter").text("2");}, 6000);
  setTimeout(function() {$("#first_time_counter").text("1");}, 7000);
  setTimeout(function() {$("#first_time_counter").text("0");}, 8000);
  setTimeout(function() {window.location = "/teamspeak";}, 8000);
}
// Chain for a first time setup
function firstTimeSetup() {
  $("body").css("opacity", "1");
  $("body").children()
    .not("#first_time_container")
    .not("#notification_container")
    .not("#top_container")
    .css("opacity", "0");
  $("#first_time_container").show();
  setTimeout(function() {$("#first_time_title").text("Welcome to Teamspeak Struggle").fadeIn(200, "swing");}, 1000);
  setTimeout(function() {$("#first_time_text1").text("Just some info before you start.").fadeIn(200, "swing");}, 3000);
  setTimeout(function() {$("#first_time_text2").text("To get started, start by clicking the coin and buying units.").fadeIn(200, "swing");}, 5000);
  setTimeout(function() {$("#first_time_text2").text("You will start with an hour grace period in which you can't be attacked.").hide().fadeIn(200, "swing");}, 10000);
  setTimeout(function() {$("#first_time_text2").text("Be sure to use the help menus, click the i to keep them open.").hide().fadeIn(200, "swing");}, 15000);
  setTimeout(function() {
    $("#first_time_text1").text("Now just name your village, and you're ready to go!").hide().fadeIn(200, "swing");
    $("#first_time_text2").hide();
  }, 20000);
  setTimeout(function() {$("#first_time_text2").text("Starting in...").fadeIn(200, "swing");}, 21000);
  setTimeout(function() {$("#first_time_counter").text("3").fadeIn(200, "swing");}, 22000);
  setTimeout(function() {$("#first_time_counter").text("2");}, 23000);
  setTimeout(function() {$("#first_time_counter").text("1");}, 24000);
  setTimeout(function() {$("#first_time_counter").text("0");}, 25000);
  setTimeout(function() {
    $("#details_input_container").css("opacity", "1");
    $("#first_time_container").hide();
    toggleDetailsInputContainer(true);
  }, 26000);
}
// Handles details container events
function detailsContainerEvents(state, socket) {
  $("#details_input_submit").off("click");
  $("#details_input_toggle_text").off("click");
  $("#details_input_close").off("click");
  if(!state) return;
  $("#details_input_submit").on("click", function() {
    detailsInputErrorChecker(socket);
  });
  $("#details_input_toggle_text").on("click", function() {
    toggleDetailsInputContainer(true);
  });
  $("#details_input_close").on("click", function() {
    toggleDetailsInputContainer(false);
    socket.emit("getData", JSON.stringify({allRaids: false}));
  });
}
// Handles tooltip hover events
function tooltipHoverEvents() {
  $(".struggle_tooltip_trigger").off("toggled");
  $(".struggle_tooltip_trigger").on("toggled", function() {});
  $(".struggle_tooltip_trigger").off("click");
  $(".struggle_tooltip_trigger").on("click", function() {
    $(this).fadeOut(50, "swing");
    $(this).fadeIn(200, "swing");
    var evData = $._data(this, "events");
    if(evData.toggled) {
      $(this)
        .off("toggled")
        .off("mouseleave")
        .text("X")
    } else {
      $(this)
        .on("toggled", function() {})
        .on("mouseleave", function() {$(this).next().fadeOut(200, "swing")})
        .text("i")
    }
  });
  $("#units_toggle").off("click");
  $("#units_toggle").on("click", function() {
    var expanded = $(this).attr("expanded"),
        width = parseInt($("#soldier_container").css("width")) - 20;
    if(expanded != "true") {
      $("#units_toggle").text("Collapse");
      $(this).attr("expanded", "true");
      $("[id=units_info_container]").velocity({
        minWidth: width
      }, {
        duration: 200,
        easing: "easeOutQuart",
        queue: false,
      });
    } else {
      $("#units_toggle").text("Expand");
      $(this).attr("expanded", "false");
      $("[id=units_info_container]").velocity({
        minWidth: 200
      }, {
        duration: 200,
        easing: "easeOutQuart",
        queue: false,
      });
    }
  });
}
// Handles key press events for unit costs ? shift & shift+alt
function keyPressEvents(state, data) {
  $(window).off("keydown").off("keyup");
  if(state) {
    $(window).on("keydown", function(event) {
      var added = 1;
      if(event.shiftKey) {
        if(event.altKey) {
          $("[id=units_buy_amount]").text("100");
          added = 100;
          /*if(event.keyCode == 45 && event.ctrlKey) {
            setInterval(function() {
              var offset = $("#click_coin_trigger").offset();
              var e = {pageX: offset.left+100, pageY: offset.top+100}
              coinClick(e, true, data);
            }, 100);
          }*/
        } else {
          $("[id=manage_units_assigned_increase]").text("++").css("width", 35);
          $("[id=manage_units_assigned_decrease]").text("- -").css("width", 35);
          $("[id=units_buy_amount]").text("10");
          added = 10;
        }
      }
      updateCosts(data.units, Object.assign({}, data.struggle.workers, data.struggle.soldiers), added);
    });
    $(window).on("keyup", function(event) {
      if(!event.shiftKey) {
        $("[id=units_buy_amount]").text("1");
        $("[id=manage_units_assigned_increase]").text("+").css("width", 25);
        $("[id=manage_units_assigned_decrease]").text("-").css("width", 25);
      } else if(!event.altKey) {
        $("[id=units_buy_amount]").text("10");
      } if(event.keyCode == 13) {
        var offset = $("#click_coin_trigger").offset(),
            offsetX = (Math.random()*100)+50,
            offsetY = (Math.random()*100)+50,
            e = {pageX: offset.left+offsetX, pageY: offset.top+offsetY};
        coinClick(e, true, data);
      }
      updateCosts(data.units, Object.assign({}, data.struggle.workers, data.struggle.soldiers), 0);
    });
  }
}
// Updates unit costs
function updateCosts(units, usersUnits, added) {
  for(var i in units) {
    var baseUnitCost = units[i].cost;
    var unitCost = 0;
    var unitAmount = usersUnits[i].amount;
    if(units[i].type == "worker") {
      for(var ii = 0; ii < added; ii++) {
        unitCost = unitCost + (baseUnitCost*(Math.pow(1.1, (unitAmount+ii))));
      } if(unitCost == 0) {
        unitCost = (baseUnitCost*(Math.pow(1.1, (unitAmount))));
      }
    } else {
      unitCost = baseUnitCost * added;
      if(unitCost == 0) {
        unitCost = baseUnitCost;
      }
    }
    var newCost = {
      bronze: Math.floor(unitCost%100),
      silver: Math.floor((unitCost%10000)/100),
      gold: Math.floor(unitCost/10000)
    }
    $(".buy_bronze_"+i).text(newCost.bronze);
    $(".buy_silver_"+i).text(newCost.silver);
    $(".buy_gold_"+i).text(newCost.gold);
    $(".tooltip_bronze_"+i).text(newCost.bronze);
    $(".tooltip_silver_"+i).text(newCost.silver);
    $(".tooltip_gold_"+i).text(newCost.gold);
  };
}
// Handles side container click events
function toggleContainerEvents() {
  $("#click_toggle_button").off("click").on("click", function() {
    toggleSideContainer("click_container");
  });
  $("#units_toggle_button").off("swipe").on("click", function() {
    toggleSideContainer("units_container");
  });
}
// Toggles side container
function toggleSideContainer(element) {
  if(element == "click_container") {
    var state = true;
    if($("#click_container").css("left") == "0px") {
      state = false;
    }
    toggleClickContainer(state);
  } else {
    var state = true;
    if($("#units_container").css("right") == "0px") {
      state = false;
    }
    toggleManageContainer(state);
  }
}
// Toggles click container (left)
function toggleClickContainer(state) {
  var width = $("#click_container").width();
  if(state) {
    $("#click_container").velocity({
      left: 0
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
  } else {
    $("#click_container").velocity({
      left: "-" + width + "px"
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
  }
}
// Toggles unit management container (right)
function toggleManageContainer(state) {
  var width = $("#units_container").width();
  if(state) {
    $("#units_container").velocity({
      right: 0
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
  } else {
    $("#units_container").velocity({
      right: "-" + width + "px"
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
  }
}
// Toggles details input container
function toggleDetailsInputContainer(state) {
  if(state) {
    $("body").children()
      .not("#details_input_container")
      .not("#notification_container")
      .not("#top_container")
      .css("opacity", "0");
    $("#details_input_sub_container").slideDown(200, "swing");
  } else {
    $("body").children().css("opacity", "1");
    $("#details_input_sub_container").slideUp(200, "swing");
  }
}
// Details error checker
function detailsInputErrorChecker(socket) {
  toggleNotification(true, "loader", "Checking details...");
  // Bind fields
  var userData = {
    villageName: $("#villageName").val()
  }
  socket.emit("detailsEdit", JSON.stringify(userData));
};
// Error Handler
function renderErrors(errors) {
  $(".input").each(function(i, value) {
    $(value).css("border-color", "rgba(38,184,1,1)");
    $(value).next(".error_text").text("✓")
  });
  for(var i in errors) {
    var error = errors[i];
    for(var ii in error.fields) {
      var field = error.fields[ii]
      $("#" + field).css("border-color", "rgba(184,38,1,1)");
      $("#" + error.fields[ii]).next(".error_text").text(error.message);
    }
  }
}
// Updates raid times
function updateTimes(data) {
  $(".raid_timer_container").hide();
  for(var i in inRaidIntervals) {
    clearInterval(inRaidIntervals[i]);
  } for(var i in outRaidIntervals) {
    clearInterval(outRaidIntervals[i]);
  } for(var i in gracePeriodIntervals) {
    clearInterval(gracePeriodIntervals[i]);
  }
  if(data.incommingRaid) {
    var raidStart = new Date(data.incommingRaid.raidStart),
        raidEnd = new Date(data.incommingRaid.raidEnd);
    $("#incomming_raid_container").show();
    $("#incomming_raid_text")
      .text("Warning: Raid incomming!");
    var timerInterval = setInterval(function() {
      var endMessage = generateTimeMessage(raidEnd, true);
      $("#incomming_raid_text")
        .text("⚠️ Raid incomming! ETA: " + endMessage.message);
    }, 1000);
    inRaidIntervals.push(timerInterval);
  }
  if(data.currentRaid) {
    var raidStart = new Date(data.currentRaid.raidStart),
        raidEnd = new Date(data.currentRaid.raidEnd);
    $("#outgoing_raid_container").show();
    $("#outgoing_raid_text")
      .text("Raid started!");
    var timerInterval = setInterval(function() {
      var endMessage = generateTimeMessage(raidEnd, true);
      $("#outgoing_raid_text")
        .text("🥾 Raid ongoing! ETA: " + endMessage.message);
    }, 1000);
    outRaidIntervals.push(timerInterval);
  }
  var timerInterval = setInterval(function() {
    var graceMessage = generateTimeMessage(new Date(data.struggle.graceEnd), true);
    if(graceMessage.diff > 0) {
      $("#grace_period_container, #clear_grace_text").show();
      $("#grace_period_text")
        .text("🛡️ Grace period: " + graceMessage.message);
    } else {
      $("#grace_period_container, #clear_grace_text").hide();
      for(var i in gracePeriodIntervals) {
        clearInterval(gracePeriodIntervals[i]);
      }
    }
  }, 1000);
  gracePeriodIntervals.push(timerInterval);
}
// Generate time message
function generateTimeMessage(date, fromCurrent) {
  var currentDate = new Date(),
      diff = (fromCurrent) ? date.getTime() - currentDate.getTime() : currentDate.getTime() - date.getTime(),
      message = "Awaiting results...";
  if(diff >= 0) {
    var h = Math.floor(diff/(1000 * 60 * 60)),
    m = Math.floor(diff/(1000 * 60) - (h * 60)),
    s = Math.floor(diff/(1000) - ((h * 60 * 60) + (m * 60))),
    message = h + " hours " + m + " minutes " + s + " seconds.";
  }
  return {diff: diff, message: message};
}
// Cost formatter
function numberFormatter(int) {
  return int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// Coin formatter
function coinFormatter(int) {
  var coins = {
    gold: numberFormatter(Math.floor(int/10000)),
    silver: Math.floor((int%10000)/100),
    bronze: Math.floor(int%100)
  }
  return coins;
}
