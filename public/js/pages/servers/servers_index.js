$(document).ready(function () {
  // ---

	// --- Initial setup
  $("#page_cover, #delete_confirm_no").click(function() {
    $("#delete_confirm_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  })
});

function queryServer(game) {
  $("." + game).children("#server_status_state").css("display", "none");
  $("." + game).children("#server_status_extra").css("display", "none");
  $("." + game).children("#server_status_refresh").css("display", "none");
  $("." + game).children("#server_status_refreshing").css("display", "block");
  $.ajax({
    type: "POST",
    url: "/servers/status/" + game,
    data: {
      _csrf: csrfToken
    },
    success: function(data){
      if(game == "arma3") arma3Status(data);
    },
    error: function(err){
      $("." + game).children("#server_status_refresh").css("display", "block");
      $("." + game).children("#server_status_refreshing").css("display", "none");
      $("." + game).children("#server_status_state").html("Offline").css("color", "rgba(183, 28, 28, 1)").css("display", "block");
      $("." + game).children("#server_status_extra").html("The server may be down for maintenance.").css("display", "block");
    }
  });
}

function arma3Status(data) {
  $(".arma3").children("#server_status_refresh").css("display", "block");
  $(".arma3").children("#server_status_refreshing").css("display", "none");
  $(".arma3").children("#server_status_state").html("Online - " + data.players.online + " / " + data.players.max).css("color", "rgba(51, 105, 30, 1)").css("display", "block");
}
