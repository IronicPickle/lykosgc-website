$(document).ready(function () {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  // ---

	// --- Initial setup
  toggleHeader(false);
  scrollEvents(false);
  buildDate();
  $("#submit_button").click(function() {
    registerErrorChecker(_csrf);
  });
  $("#dob_month, #dob_year").change(function() {
    buildDate();
  });
});

// Date builder
function buildDate() {
  var months = {January: 31, Febuary: 28, March: 31, April: 30, May: 31, June: 30, July: 31, August: 31, September: 30, October: 31, November: 30, December: 31}
  var day = $("#dob_day").val();
  var month = $("#dob_month").val();
  var year = $("#dob_year").val();
  if(year % 4 != 0) {
    // Common Year
  } else if(year % 100 != 0) {
    // Leap Year
    months.Febuary = 29
  } else if(year % 400 != 0) {
    // Common Year
  } else {
    // Leap Year
    months.Febuary = 29
  }
  var days = months[month];
  $("[id=day]").remove()
  for(var i = 1; i <= days; i++) {
    $("#dob_day").append("<option id=day>" + i + "</option>")
  }
  $("#dob_day").val(day);
  if(day > days) {
    $("#dob_day").val(days);
  } else if(!day) {
    $("#dob_day").val(1);
  }
}
// Register error checker
function registerErrorChecker(_csrf) {
  toggleNotification(true, "loader", "Checking details...");
  // Bind fields
  var userData = {
    username: $("#username").val(),
    email: $("#email").val(),
    password: $("#password").val(),
    password_confirm: $("#password_confirm").val(),
    dob_day: $("#dob_day").val(),
    dob_month: $("#dob_month").val(),
    dob_year: $("#dob_year").val(),
    tnd: $("#tnd:checked").val()
  }

  // Register Check
  $.ajax({
    type: "POST",
    url: "/register",
    data: {
      userData: JSON.stringify(userData),
      _csrf: _csrf
    },
    success: function(res) {
      if(res.message == "success") {
        toggleNotification(true, "loader", "Success!");
        setTimeout(function() {
          window.location.replace("/email_confirm/confirm/" + res.hash)
        }, 100);
      }
    },
    error: function(err) {
      var res = err.responseJSON;
      if(res.message == "invalidDetails") {
        toggleNotification(true, "alert", "Some details are invalid!", 5000);
        renderErrors(res.errors)
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
      if(error.fields[ii].includes("dob")) {
        $("#dob_error").text(error.message)
      } else if(error.fields[ii].includes("tnd")) {
        $("#tnd_error").text(error.message)
        $("#tnd").css("box-shadow", "0 0 5px rgba(184,38,1,1)");
      } else {
        $("#" + error.fields[ii]).next(".error_text").text(error.message)
      }
    }
  }
}
