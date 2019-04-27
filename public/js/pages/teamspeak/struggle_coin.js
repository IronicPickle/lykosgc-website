// Updates current money on client side
function updateMoney(socket, data) {
  currMoney = data.struggle.money;
  numIncr();
  updateCPS(data);
}
// Coin mouse events
function coinEvents(socket, data, state) {
  $("#click_coin_trigger").off();
  $("[id=click_coin_drop]").off();
  if(state) {
    $("#click_coin_trigger").on("click", function(event) {
      coinClick(event, true, data);
    });
    $("#click_coin_trigger").on("mouseover", function(event) {
      coinClick(event, false);
    });
    $("#click_coin_trigger").on("mouseleave", function(event) {
      coinClick(event, false);
    });
  }
}
// Coin click event
function coinClick(event, add, data) {
  var coinOffset = $("#click_coin").offset(),
      mouseOffset = [event.pageX - coinOffset.left, event.pageY - coinOffset.top],
      totalCPS = 0;
  if(add) {
    for(var i in data.struggle.workers) {
      totalCPS = totalCPS + (data.units[i].cps * data.struggle.workers[i].amount);
    }
    if(totalCPS == 0) totalCPS = 1;
  }
  var defVals = clickRNG(1, totalCPS);
  if(add) {
    //var audio = document.getElementById("click_sound");
    //audio.currentTime = 0;
    //audio.play();
    currMoney = currMoney + defVals.addedMoney;
    spinCoin();
    numIncr();
    summonCoin(event, defVals);
  }
  coinOffset = offsetCalc(mouseOffset, defVals.factor);
  coinShake(defVals.addedMoney, coinOffset)
}
// Spins background coin
function spinCoin() {
  spinCount = spinCount + 1;
  spinBlock = true;
  for(var i in spinIntervals) {
    clearInterval(spinIntervals[i]);
  }
  spinIntervals.push(setTimeout(function() {
    spinBlock = false;
  }, 1000));
}
// Resets spin intervals
function spinResetIntervals() {
  setInterval(function() {
    if(spinCount>0 && !spinBlock) spinCount = spinCount - 1;
  }, 50);
  setInterval(function() {
    if(!disableAnimations) {
      var values = $("#click_coin_background").css("transform").split('(')[1];
          values = values.split(')')[0],
          values = values.split(','),
          a = values[0],
          b = values[1],
          c = values[2],
          d = values[3],
          scale = Math.sqrt(a*a + b*b),
          sin = b/scale,
          angle = Math.round(Math.atan2(b, a) * (180/Math.PI));

      $("#click_coin_background")
        .velocity({
          transform: ["rotate("+(angle+spinCount)+"deg)", "rotate("+angle+"deg)"]
        }, {
          duration: 200,
          easing: "linear",
          queue: false
        });
    }

    var rps = (spinCount/360) * 10,
        rpm = Math.floor(rps * 60) / 10,
        rpmMulti = Math.floor(((rpm / 100) + 1) * 100) / 100;
    if(rpmMulti >= 2.5) rpmMulti = 2.5;
    if(spinBlock) {
      if(rpm == 0) $("#click_coin_notes").html("RPM: "+rpm+"<br>Click the wheel!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 0) $("#click_coin_notes").html("RPM: "+rpm+"<br>Here we go...<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 10) $("#click_coin_notes").html("RPM: "+rpm+"<br>Spinning up!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 30) $("#click_coin_notes").html("RPM: "+rpm+"<br>Getting faster!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 50) $("#click_coin_notes").html("RPM: "+rpm+"<br>Oh boy...<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 100) $("#click_coin_notes").html("RPM: "+rpm+"<br>Holy shit!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 150) $("#click_coin_notes").html("RPM: "+rpm+"<br>You just don't stop!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 250) $("#click_coin_notes").html("RPM: "+rpm+"<br>Ok, calm down...<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 500) $("#click_coin_notes").html("RPM: "+rpm+"<br>Now this is just absurd!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 1000) $("#click_coin_notes").html("RPM: "+rpm+"<br>This is the part where you stop.<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 2000) $("#click_coin_notes").html("RPM: "+rpm+"<br>You really gotta stop dude.!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 3000) $("#click_coin_notes").html("RPM: "+rpm+"<br>You know this doesn't get you anything right?<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 4000) $("#click_coin_notes").html("RPM: "+rpm+"<br>Do you want a medal or something?<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 4100) $("#click_coin_notes").html("RPM: "+rpm+"<br>If I give you a medal will you stop?<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 5000) $("#click_coin_notes").html("RPM: "+rpm+"<br>Here's a medal, now please leave.<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 10000) $("#click_coin_notes").html("RPM: "+rpm+"<br>Why are you still here?<br>Coin Multiplier: " + rpmMulti);
    } else {
      if(rpm == 0) $("#click_coin_notes").html("RPM: "+rpm+"<br>Click the wheel!<br>Coin Multiplier: " + rpmMulti);
      if(rpm > 0) $("#click_coin_notes").html("RPM: "+rpm+"<br>Spinning down...<br>Coin Multiplier: " + rpmMulti);
    }

  }, 200);
}
// Increases money counters
function numIncr() {
  var gold = numberFormatter(Math.floor(currMoney/10000)),
      silver = Math.floor((currMoney%10000)/100),
      bronze = Math.floor(currMoney%100);
  $(".gold").text(gold);
  $(".silver").text(silver);
  $(".bronze").text(bronze);
}
// Updates CPS box
function updateCPS(data) {
  var workers = data.struggle.workers,
      units = data.units,
      totalCPS = 0;
  for(var i in workers) {
    totalCPS = totalCPS + (units[i].cps * workers[i].amount);
  }
  $("#click_cps_text").text("CPS: " + numberFormatter(totalCPS));
}
// Calculates mouse pos
function offsetCalc(mouseOffset, factor) {
  var size = [$("#click_coin").width()/2, $("#click_coin").height()/2];
  mouseOffset = [mouseOffset[0] - size[0], mouseOffset[1] - size[1]];
  mouseOffset = [mouseOffset[0] / size[0], mouseOffset[1] / size[1]];
  mouseOffset = [mouseOffset[0] * factor, mouseOffset[1] * factor];
  mouseOffset = [mouseOffset[0] * -1, mouseOffset[1] * -1];
  mouseOffset = [mouseOffset[0].toFixed(1), mouseOffset[1].toFixed(1)];
  return mouseOffset;
}
// Handles coin shake
function coinShake(addedMoney, coinOffset) {
  if(disableAnimations) return;
  var animateSize = 180;
  $("#click_coin")
    .velocity({
      width: [animateSize, 200],
      height: [animateSize, 200],
      transform: ["translate("+coinOffset[0]+"px,"+coinOffset[1]+"px)", "translate("+coinOffset[0]/2+"px,"+coinOffset[1]/2+"px)"],
      boxShadow: ["0 0 500px", "0 0 50px"]
    }, {
      duration: 100,
      easing: "swing",
      queue: false
    });
  setTimeout(function() {
    $("#click_coin")
      .velocity({
        width: [200, animateSize],
        height: [200, animateSize],
        transform: ["translate(0px,0px)", "translate("+coinOffset[0]+"px,"+coinOffset[1]+"px)"],
        boxShadow: ["0 0 50px", "0 0 500px"]
      }, {
        duration: 1000,
        easing: [100, 10],
        queue: false
      })
  }, 100);
}
// Summons click coins
function summonCoin(event, defVals) {
  if(disableAnimations) return;
  var size = [$("#click_container").width(), $("#click_container").height()],
      offset = $("#click_container").offset(),
      ii = {},
      dropInterval = {};
  for(var i in defVals.coins) {
    summonNum(event, defVals.coins[i], i);
    var animationsLeft = 10 - $("[id=click_coin_drop]").length;
    defVals.coins[i].coinAmount = Math.ceil((defVals.coins[i].coinAmount / 10))
    if(defVals.coins[i].coinAmount > animationsLeft) defVals.coins[i].coinAmount = animationsLeft;
    var coords = [((event.pageX - offset.left)-(defVals.coins[i].coinSize/2)), ((event.pageY - offset.top)-(defVals.coins[i].coinSize/2))];
    summonCoinInterval(defVals.coins[i], coords);
  }
}
// Summon coin interval
function summonCoinInterval(coins, coords) {
  var ii = 0;
  dropInterval = setInterval(function() {
    ii = ii + 1;
    if(ii <= coins.coinAmount) {
      $("#click_container").prepend("<object id='click_coin_drop' style='width:"+coins.coinSize+"px;left:"+coords[0]+"px;top:"+coords[1]+"px;' data='/images/struggle/"+coins.coinType+"_coin.svg' type='image/svg+xml'></object>");
      coinAnimation(coords);
    } else {
      clearInterval();
    }
  }, 50);
}
// Handles coin animation
function coinAnimation(coords) {
  var randX = [(coords[0]-(Math.random()*100))-50, (coords[0]+(Math.random()*100))+50],
      animateParams;
  if(Math.random() > 0.5) {
    animateParams = {
      start: {x: coords[0], y: coords[1], angle: -200, length: 0.50},
      end: {x:randX[0], y:coords[1]+400, angle: -15, length: 1.5}
    }
  } else {
    animateParams = {
      start: {x: coords[0], y: coords[1], angle: 200, length: 0.50},
      end: {x:randX[1], y:coords[1]+400, angle: 15, length: 1.5}
    }
  }
  $("#click_coin_drop").animate({
    path: new $.path.bezier(animateParams),
    opacity: 0.25
  }, {
    duration: 500,
    easing: "linear"
  });
  setTimeout(function() {
    $("[id=click_coin_drop]").last().remove();
  }, 500);
}
// Summons click numbers
function summonNum(event, defVals, i) {
  if(defVals.coinAmount == 0) return;
  var size = [$("#click_coin_container").width(), $("#click_coin_container").height()],
      offset = $("#click_coin_container").offset(),
      coords = [(event.pageX - offset.left)-(defVals.coinSize/2), (event.pageY - offset.top)-(defVals.coinSize/2)];
  coords[0] = coords[0]-(Math.random()-0.5)*50;
  coords[1] = coords[1]-25
  $("#click_coin_container").prepend("<span id='click_coin_drop_num' style='z-index:"+(parseInt(i)+1)+";color:"+defVals.textColor+";font-size:"+defVals.coinSize/1.1+"px;left:"+coords[0]+"px;top:"+coords[1]+"px;'>+"+defVals.coinAmount+"</span>");
  $("[id=click_coin_drop_num]").velocity({
    top: coords[1]-100,
    opacity: 0.5
  }, {
    duration: 1000,
    easing: "swing",
    queue: false
  });
  setTimeout(function() {
    $("[id=click_coin_drop_num]").last().remove();
  }, 500);
}
