$(document).ready(function () {
  // ---

  // --- Initial setup
  checkScroll();
  scrollEvents(true);
  navEvents();
  tooltipEvents();
  buttonEvents();
  $("body").toggle(true);
});
// Check scroll
function checkScroll() {
  if(typeof scrollAllowed == "undefined") {
    var scrollPos = $(this).scrollTop();
    if(scrollPos < 10) {
      toggleHeader(true);
    } else {
      toggleHeader(false);
    }
  }
}
// Scroll toggler
function scrollEvents(state) {
  $(document).off("scroll");
  if(state) {
    $(document).on("scroll", function() {
      checkScroll();
    });
  }
}
// Toggle header
function toggleHeader(state) {
  $("#nav_title").toggle(!state);
  if(state) {
    $("#top_container").velocity({
      top: 0
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
    setTimeout(function() {
      $("#nav_bar").animate({
        right: "10%",
        left: "10%"
      }, {
        duration: 200,
        easing: "easeOutQuart",
        queue: false,
      });
    }, 200);
    $("#nav_title").toggle(!state);
  } else {
    $("#top_container").velocity({
      top: -160
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
    setTimeout(function() {
      $("#nav_bar").animate({
        right: 10,
        left: 10
      }, {
        duration: 200,
        easing: "easeOutQuart",
        queue: false,
      });
    }, 200);
  }
}
// Nav event handler
function navHover(element, state) {
  var index = $("[id=nav_item], [id=nav_dropdown_container]").index(element);
  index = Math.floor(index/2);
  navHoverStyle($("[id=nav_item]").eq(index), state);
  if($(element)[0].id == "nav_item") {
    $(element).parent().next("#nav_dropdown_container").toggle(state);
  } else {
    $(element).toggle(state);
  }
}
// Nav styling event
function navHoverStyle(element, state) {
  if(state) {
    $(element).velocity({
      backgroundColor: "rgba(63,68,97,1)"
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
  } else {
    $(element).velocity({
      backgroundColor: "rgba(73,78,107,1)"
    }, {
      duration: 200,
      easing: "easeOutQuart",
      queue: false,
    });
  }
}
// Nav hover events
function navEvents() {
  $("[id=nav_item], [id=nav_dropdown_container]").off("mouseover").on("mouseover", function() {
    navHover(this, true);
  });
  $("[id=nav_item], [id=nav_dropdown_container]").off("mouseleave").on("mouseleave", function() {
    navHover(this, false);
  });
}
// Tooltip hover events
function tooltipEvents() {
  $(".tooltip_trigger").off("mouseover").on("mouseover", function () {
    $(this).next().fadeIn(200, "swing");
  });
  $(".tooltip_trigger").off("mouseleave").on("mouseleave", function () {
    $(this).next().fadeOut(200, "swing");
  });
}
// Button hover event
function buttonEvents() {
  $(".standard_button").off("mouseover").on("mouseover", function () {
    buttonHoverStyle(this, true);
  });
  $(".standard_button").off("mouseleave").on("mouseleave", function () {
    buttonHoverStyle(this, false);
  });
}
// Button styling event
function buttonHoverStyle(element, state) {
  if(state) {
    $(element).velocity({
      backgroundColor: "rgba(200,200,200,1)",
      color: "rgba(33,33,33,1)",
      borderRadius: 10
  	}, {
  		duration: 200,
  		easing: "easeOutQuart",
  		queue: false,
  	});
  } else {
    $(element).velocity({
      backgroundColor: "rgba(25,34,49,1)",
      color: "rgba(255,255,255,1)",
      borderRadius: 2
  	}, {
  		duration: 200,
  		easing: "easeOutQuart",
  		queue: false,
  	});
  }
}
// Options dropdown event
function optionsDropdownEvents() {
  $(".options_dropdown_button").off("click").click(function(event) {
    event.preventDefault();
    $(this).next().toggle(200, "swing");
  });

  $(document).off("click").click(function(data) {
    if(data.originalEvent.target.className == "options_dropdown_button") {
      return;
    }
    $(".options_dropdown_box").toggle(false);
  });
}
// Nav hover leave event
function toggleNotification(state, type, text, timeout) {
  if(typeof notificationTimeout != "undefined") clearInterval(notificationTimeout);
  $("#notification_alert_img").toggle(false);
  $("#notification_loader").toggle(false);
  if(type == "alert") {
    $("#notification_alert_img").toggle(true);
  } else if(type == "loader") {
    $("#notification_loader").toggle(true);
  }
  $("#notification_text").html(text);
  $("#notification_container").toggle(state);
  if(timeout) {
    notificationTimeout = setTimeout(function() {
      toggleNotification(false, "", "")
    }, timeout);
  }
}
