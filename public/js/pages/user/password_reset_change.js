$(document).ready(function () {
	// Varaible setup
	var _csrf = $("#_csrf").attr("_csrf"),
			_userID = $("#_scriptVars").attr("_userID"),
			_hash = $("#_scriptVars").attr("_hash");
	// ---

	// --- Initial setup
	toggleHeader(false);
  scrollEvents(false);
  $("#submit_button").click(function() {
    resetErrorChecker(_csrf, _userID, _hash);
  });
});

// Register error checker
function resetErrorChecker(_csrf, _userID, _hash) {
  var errors = [];
  // Bind fields
  var password = $("#password").val(),
			password_confirm = $("#password_confirm").val()

  // Existence check
  $.ajax({
    type: "POST",
    url: "/password/reset/change",
    data: {
      password: password,
			password_confirm: password_confirm,
			_userID: _userID,
			_hash: _hash,
      _csrf: _csrf
    },
		success: function(res) {
			if(res.message == "success") {
				renderErrors([]);
				window.location.replace("/login");
			}
    },
    error: function(err) {
			var res = err.responseJSON;
			if(res.message == "invalidDetails") {
				renderErrors(res.errors);
			}
    }
  });
};
// Error Handler
function renderErrors(errors) {
  $(".input").each(function(i, value) {
    $(value).css("border-color", "rgba(38,184,1,1)");
    $(value).next(".error_text").text("✓")
    if($(value).attr("id") == "tnd_container") {
      $("#tnd").css("box-shadow", "0 0 5px rgba(38,184,1,1)");
    }
  });
  for(var i in errors) {
    var error = errors[i];
    for(var ii in error.fields) {
      var field = error.fields[ii]
      $("#" + field).css("border-color", "rgba(184,38,1,1)");
      $("#" + error.fields[ii]).next(".error_text").text(error.message)
    }
  }
}
