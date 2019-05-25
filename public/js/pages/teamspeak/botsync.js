$(document).ready(function () {
  loadPlayer();
});
// On player ready
function onPlayerReady(event) {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  // ---
  var socket = io("/botSync");
  socketSetup(socket, _csrf);
  toggleHeader(false);
  toggleFooter(false);
  loadPlayer();
  submitURLEvents(socket);
  volumeBarEvents(socket);

	// --- Initial setup
}
// Global variables
var seekBarIntervals = [],
    seekTimeouts = [],
    toggleUITimeouts = [],
    syncCheckTimeouts = [],
    selectedInstance = {},
    player;
// Loads embedded player
function loadPlayer() {
  var tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  var firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}
// On embedded player ready
function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    playerVars: {
      rel: 0,
      showinfo: 0,
      controls: 0,
      mute: 1
    },
    events: {
      "onReady": onPlayerReady,
      "onStateChange": onPlayerStateChange
    }
  });
}
// On player state change
function onPlayerStateChange(event) {
}
// Selects instance
function selectInstance(socket, uuid) {
  selectedInstance.uuid = uuid;
  socket.emit("selectInstance", JSON.stringify({uuid: uuid}));
}
// Constructs instance list
function constructInstanceList(socket, instances) {
  $("[id=instances_row]").remove();
  for(var i in instances) {
    $("#instances_container").append(`<div uuid="`+instances[i].uuid+`" id="instances_row">
      <svg id="instances_row_power" class="instances_row_img" height="16px" version="1.1" viewBox="0 0 16 16" width="16px"><title/><defs/><g fill="none" fill-rule="evenodd" id="Icons with numbers" stroke="none" stroke-width="1"><g fill="`+ ((instances[i].running) ? `rgba(38,184,1,1)` : `rgba(184,38,1,1)`) +`" id="Group" transform="translate(-240.000000, -144.000000)"><path d="M248,158 C250.761424,158 253,155.761424 253,153 C253,151.364186 252.214451,149.911848 251,148.999634 L251,146.673631 C253.364945,147.797092 255,150.207602 255,153 C255,156.865993 251.865993,160 248,160 C244.134007,160 241,156.865993 241,153 C241,150.207602 242.635055,147.797092 245,146.673631 L245,148.999634 C243.785549,149.911848 243,151.364186 243,153 C243,155.761424 245.238576,158 248,158 Z M248,153 C247.443865,153 247,152.553614 247,152.00297 L247,145.99703 C247,145.453036 247.447715,145 248,145 C248.556135,145 249,145.446386 249,145.99703 L249,152.00297 C249,152.546964 248.552285,153 248,153 Z M248,153" id="Oval 188"/></g></g></svg>
      <p id="instances_row_text">`+instances[i].nick+`</p>
    </div>`);
  }
  instanceListEvents(socket, instances);
}
// Instance list events
function instanceListEvents(socket, instances) {
  $("[id=instances_row_power]").on("click", function() {
    var index = $("[id=instances_row_power]").index(this),
        uuid = instances[index].uuid;
    toggleNotification(true, "loader", "Toggling '"+instances[index].nick+"'");
    socket.emit("togglePower", JSON.stringify({uuid: uuid}));
  });
  $("[id=instances_row_text]").on("click", function() {
    var index = $("[id=instances_row_text]").index(this),
        uuid = instances[index].uuid;
    selectedInstance = index;
    toggleNotification(true, "loader", "Selecting instance: '"+instances[index].nick+"'", 1000);
    selectInstance(socket, uuid);
  });
}
// Seek bar events
function seekBarEvents(socket, data) {
  $("#seek_bar_outer").off("click").on("click", function(event) {
    var width = $("#seek_bar_outer").width(),
        offsetX = event.offsetX,
        percent = offsetX / (width / 100),
        duration = data.currentTrack.duration,
        ms = duration * (percent / 100)
    socket.emit("seek", JSON.stringify({ms: ms}));
  });
}
function volumeBarEvents(socket) {
  $("#volume_bar_outer").off("click").on("click", function(event) {
    var width = $("#seek_bar_outer").width(),
        offsetX = event.offsetX;
    socket.emit("volumeChange", JSON.stringify({vol: offsetX}));
  });
}
// Toggle ui events
function toggleUIEvents(state) {
  for(var i in toggleUITimeouts) clearTimeout(toggleUITimeouts[i]);
  if(state) {
    toggleUI(false);
    $("#main_container, #player").off("mousemove").on("mousemove", function() {
      toggleUI(true);
    }).off("mouseleave").on("mouseleave", function() {
      toggleUITimeouts.push(setTimeout(function() {
        toggleUI(false);
      }, 2500));
    });
  } else {
    $("#main_container, #player").off("mouseover").off("mouseleave");
    toggleUI(true);
  }

}
// Player state events
function playerStateEvents(socket) {
  $("#track_state_img").off("click").on("click", function() {
    socket.emit("toggleTrack");
  });
}
// Submit url events
function submitURLEvents(socket) {
  $("#submit_url_queue").off("click").on("click", function() {
    var url = $("#submit_url_link").val();
    $("#submit_url_link").val("");
    toggleNotification(true, "loader", "Submitting URL...", 2000);
    socket.emit("submitURL", JSON.stringify({type: "queue", url: url}));
  });
  $("#submit_url_play").off("click").on("click", function() {
    var url = $("#submit_url_link").val();
    $("#submit_url_link").val("");
    toggleNotification(true, "loader", "Submitting URL...", 2000);
    socket.emit("submitURL", JSON.stringify({type: "play", url: url}));
  });
}
// Submit url events
function skipEvents(socket) {
  /*$("#skip_vote").off("click").on("click", function() {
    toggleNotification(true, "loader", "Voting to skip song...", 2000);
    socket.emit("skip", JSON.stringify({type: "vote"}));
  });*/
  $("#track_skip_img").off("click").on("click", function() {
    toggleNotification(true, "loader", "Skipping song...", 2000);
    socket.emit("skip", JSON.stringify({type: "force"}));
  });
}
// Construct instance
function constructInstance(socket, data) {
  for(var i in seekTimeouts) {
    clearTimeout(seekTimeouts[i]);
  }
  $("[id=instances_row]").css("border-color", "");
  $("[uuid='"+data.uuid+"']").css("border-color", "rgba(255,255,255,1)");
  stopSyncChecker();
  updatePlayer(socket, data);
  constructQueue(socket, data);
  if(data.currentTrack.isPlaying) {
    updateSeekBar(socket, JSON.parse(JSON.stringify(data)));
    seekBarEvents(socket, data);
    if(data.type != "queueChange" && data.type != "volumeChange") {
      setTimeout(function() {
        syncPlayer(socket, data);
      }, 500);
    }
  } else {
    toggleUIEvents(false);
    moveSeekBar(0);
    toggleNotification(false);
    updateMeta(socket, data);
    skipEvents(socket);
    playerStateEvents(socket);
  }
}
// Construct queue
function constructQueue(socket, data) {
  var queue = data.queue;
  queue.splice(0, 1);
  $("[id=queue_row]").remove();
  if(queue.length == 0) {
    $("#queue_container").append(`
      <div id="queue_row">
        <img id="queue_row_img" src="/images/title/info.png" alt="">
        <p id="queue_row_text">
          Queue is empty
        </p>
    `);
  }
  for(var i in queue) {
    var snippet = queue[i].snippet;
    $("#queue_container").append(`
      <div id="queue_row">
        <a href="`+queue[i].url+`" target="_blank">
          <img id="queue_row_thumbnail" src="`+snippet.thumbnails.medium.url+`" alt="">
        </a>
        <p id="queue_row_text">
          <a href="`+queue[i].url+`" target="_blank">
            <b>
              `+snippet.title+`
            </b>
          </a>
          </br>
          <a href="https://www.youtube.com/channel/`+snippet.channelId+`" target="_blank">
            `+snippet.channelTitle+`
          </a>
        </p>
      </div>
    `);
  }
}
// Update metadata
function updateMeta(socket, data) {
  if(data.volume >= 50) {
    $("#track_volume_img").replaceWith(`<svg id="track_volume_img" height="24px" version="1.1" viewBox="0 0 16 16" width="24px"><title/><defs/><g fill="none" fill-rule="evenodd" id="Icons with numbers" stroke="none" stroke-width="1"><g fill="rgba(255,255,255,1)" id="Group" transform="translate(-384.000000, -384.000000)"><path d="M386,390 L388,390 L391,387 L391,397 L388,394 L386,394 L386,392 Z M398,392 C398,389.94572 397.286118,388.059903 396.095306,386.58195 L396.846616,385.914119 C398.192284,387.570434 399,389.689914 399,392 C399,394.310086 398.192284,396.429566 396.846616,398.085881 L396.095306,397.41805 C397.286118,395.940097 398,394.05428 398,392 Z M396,392.000549 C396,390.462276 395.465646,389.048809 394.572419,387.935628 L395.320674,387.270512 C396.370616,388.560969 397,390.207259 397,392.000549 C397,393.79354 396.370826,395.43958 395.321193,396.729949 L394.572933,396.06483 C395.465851,394.951747 396,393.538527 396,392.000549 Z M394,392 C394,390.980672 393.618605,390.05656 393,389.381781 L393,389.333333 L393.746778,388.66953 C394.522956,389.533814 395,390.707359 395,392 C395,393.292641 394.522956,394.466186 393.746778,395.33047 L393,394.666667 L393,394.618219 C393.618605,393.94344 394,393.019328 394,392 Z M394,392" id="Rectangle 198"/></g></g></svg>`);
  } else {
    $("#track_volume_img").replaceWith(`<svg id="track_volume_img" height="24px" version="1.1" viewBox="0 0 16 16" width="24px"><title/><defs/><g fill="none" fill-rule="evenodd" id="Icons with numbers" stroke="none" stroke-width="1"><g fill="rgba(255,255,255,1)" id="Group" transform="translate(-336.000000, -384.000000)"><path d="M339,390.085881 L341,390.085881 L344,387.085881 L344,397.085881 L341,394.085881 L339,394.085881 L339,392.085881 Z M347,392.085881 C347,391.066553 346.618605,390.142441 346,389.467662 L346,389.419214 L346.746778,388.755411 C347.522956,389.619694 348,390.79324 348,392.085881 C348,393.378521 347.522956,394.552067 346.746778,395.41635 L346,394.752547 L346,394.7041 C346.618605,394.02932 347,393.105208 347,392.085881 Z M347,392.085881" id="Rectangle 198 copy"/></g></g></svg>`);
  }
  moveVolumeBar(data.volume);
  if(data.currentTrack.isPlaying) {
    $("#track_title").html("<u>Now Playing</u>: " + data.currentTrack.title);
    $("#track_state_img").replaceWith(`<svg id="track_state_img" height="24px" version="1.1" viewBox="0 0 16 16" width="20px"><title/><defs/><g fill="none" fill-rule="evenodd" id="Icons with numbers" stroke="none" stroke-width="1"><g fill="rgba(255,255,255,1)" id="Group" transform="translate(-576.000000, -144.000000)"><path d="M580,146 L583,146 L583,158 L580,158 Z M585,146 L588,146 L588,158 L585,158 Z M585,146" id="Rectangle 201"/></g></g></svg>`);
    $("#track_skip_img").replaceWith(`<svg id="track_skip_img" height="24px" version="1.1" viewBox="0 0 16 16" width="24px"><title/><defs/><g fill="none" fill-rule="evenodd" id="Icons with numbers" stroke="none" stroke-width="1"><g fill="rgba(255,255,255,1)" id="Group" transform="translate(-480.000000, -144.000000)"><path d="M493,147 L495,147 L495,157 L493,157 Z M486,152 L481,157 L481,147 Z M492,152 L487,157 L487,147 Z M492,152" id="Rectangle 198 copy"/></g></g></svg>`);
    var duration = new Date(data.currentTrack.duration),
        position = new Date(data.currentTrack.position),
        t = {durH: duration.getHours() - 1, durM: duration.getMinutes(), durS: duration.getSeconds(),
                posH: position.getHours() - 1, posM: position.getMinutes(), posS: position.getSeconds()};
        for(var i in t) {
          if((""+t[i]).length < 2) {
            t[i] = "0" + t[i];
          }
        }
    $("#track_position").text(((t.posH == "0") ? t.posH + ":" : "") + t.posM + ":" + t.posS + " / " + ((t.durH == "0") ? t.durH + ":" : "") + t.durM + ":" + t.durS);
  } else {
    $("#track_title").html("<u>Now Playing</u>: N/A");
    $("#track_state_img").replaceWith(`<svg id="track_state_img" height="24px" version="1.1" viewBox="0 0 16 16" width="20px"><title/><defs/><g fill="none" fill-rule="evenodd" id="Icons with numbers" stroke="none" stroke-width="1"><g fill="rgba(255,255,255,1)" id="Group" transform="translate(-528.000000, -144.000000)"><path d="M543,152 L531,158 L531,146 L543,152 L543,152 Z M543,152" id="Shape"/></g></g></svg>`);
    $("#track_skip_img").replaceWith(`<svg id="track_skip_img" height="24px" version="1.1" width="20px"></svg>`);
    $("#track_position").text("");
  }
}
// Syncs player
function syncPlayer(socket, data) {
  var ping = new Date() - new Date(data.sent) - 2500,
      playerTime = player.getCurrentTime() * 1000,
      correctTime = data.currentTrack.position + ping,
      offset = playerTime - correctTime;
  //console.log("Player Time: " + playerTime);
  //console.log("Correct Time: " + correctTime);
  //console.log("Offset: " + offset);
  if(offset > 50 || offset < -50) {
    if(offset > 50) data.playerOffset -= 25;
    if(offset < -50) data.playerOffset += 25;
    if(offset > 100) data.playerOffset -= 50;
    if(offset < -100) data.playerOffset += 50;
    socket.emit("getInstanceUpdate", JSON.stringify({playerOffset: data.playerOffset, type: "resync"}));
    toggleNotification(true, "loader", "Attempting to sync player...");
    toggleUIEvents(false);
    stopSyncChecker();
  } else {
    toggleNotification(false);
    toggleUIEvents(true);
    startSyncChecker(socket, data);
  }
}
// Start sync checker
function startSyncChecker(socket, data) {
  syncCheckTimeouts.push(setTimeout(function() {
    syncPlayer(socket, data);
  }, 5000));
}
// Stop sync checker
function stopSyncChecker() {
  for(var i in syncCheckTimeouts) {
    clearTimeout(syncCheckTimeouts[i]);
  }
}
// Updates embedded player
function updatePlayer(socket, data) {
  if(!data.currentTrack.isPlaying) {
    togglePlayer(false)
    return;
  }
  togglePlayer(true);
  var ping = (new Date() - new Date(data.sent)) - 500,
      correctTime = data.currentTrack.position + data.playerOffset + ping;
  if(!player.getVideoData()) return;
  if(player.getVideoData().video_id == data.queue[0].id) {
    player.seekTo((correctTime - 1000) / 1000);
  } else {
    player.loadVideoById(data.queue[0].id, correctTime / 1000, "default");
  }
}
// Toggles player
function togglePlayer(state) {
  if(state) {
    $("#player").fadeIn(500, "swing");
  } else {
    $("#player").fadeOut(500, "swing");
    player.stopVideo();
  }
}
// Toggles player ui
function toggleUI(state) {
  if(state) {
    $(".ui_element").fadeIn(200, "swing");
    $("#seek_bar_outer").velocity({
      height: 10
    }, {
      duration: 100,
      easing: "swing",
      queue: false,
    });
  } else {
    $(".ui_element").fadeOut(200, "swing");
    $("#seek_bar_outer").velocity({
      height: 5
    }, {
      duration: 100,
      easing: "swing",
      queue: false,
    });
  }
}
// Updates and handles seek bar
function updateSeekBar(socket, data) {
  var position = data.currentTrack.position,
      duration = data.currentTrack.duration;
  for(var i in seekBarIntervals) {
    clearInterval(seekBarIntervals[i]);
  }
  seekBarIntervals.push(setInterval(function() {
    data.currentTrack.position += 500;
    var percent = data.currentTrack.position / (duration / 100);
    moveSeekBar(percent);
    updateMeta(socket, data);
    playerStateEvents(socket);
    skipEvents(socket);
  }, 500));
}
// Changes seek bar position
function moveSeekBar(percent) {
  $("#seek_bar_inner").velocity({
    width: percent + "%"
  }, {
    duration: 500,
    easing: "easeOutQuart",
    queue: false,
  });
}
// Changes seek bar position
function moveVolumeBar(percent) {
  $("#volume_bar_inner").velocity({
    width: percent + "%"
  }, {
    duration: 500,
    easing: "easeOutQuart",
    queue: false,
  });
}
