$(document).ready(function () {
  // Varaible setup
  var _csrf = $("#_scriptVars").attr("_csrf");
  var confirmID =  $("#_scriptVars").attr("_confirmID");
  // ---

  // --- Initial setup
  toggleHeader(false);
  scrollEvents(false);
  var sent = false;
  $("#submit_button").click(function() {
    if(sent) {

    } else {
      sent = true;
      reSend(confirmID, _csrf, sent);
    }
  });
});

function reSend(confirmID, _csrf) {
  toggleNotification(true, "loader", "Re-sending confirmation email...");
  $("#submit_button").text("Sending...").css("cursor", "default");
  $.ajax({
    type: "POST",
    url: "/email_confirm/send",
    data: {
      confirmID: confirmID,
      _csrf: _csrf
    },
    success: function(res){
      toggleNotification(true, "alert", "Confirmation email re-sent...", 5000);
      $("#main_container").toggle(false).fadeIn(200, "swing");
      $("[id=email_text]").eq(0).html("We have re-sent the confirmation email, use the link in the email to activate your account.");
      $("[id=email_text]").eq(1).html("If you still don't see the email in your inbox, either try again or contact us.");
      $("#submit_button").text("Contact Us").css("cursor", "pointer");
    },
    error: function(err){
      toggleNotification(true, "alert", "Error sending confirmation email, please re-try.", 5000);
      $("body").html(err.responseText)
    }
  });
}
