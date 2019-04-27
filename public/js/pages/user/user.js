$(document).ready(function () {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  var _userID = $("#_scriptVars").attr("_userID");
  // ---

  // --- Initial setup
  toggleHeader(false);
  scrollEvents(false);
  optionsDropdownEvents();
  userInfoClickEvents(_csrf, _userID);
  avatarClickEvents(_csrf, _userID);
  buildDate();
  var currentIndex = 0;
  limit = 10;
  skip = 0;
  activityClickEvents(currentIndex, _userID);
  $("#dobMonth, #dobYear").change(function() {
    buildDate();
  });
});
// Activity selection click events
function activityClickEvents(currentIndex, _userID) {
  loadActivity(currentIndex, _userID);
  $("[id=activity_select_button]").click(function() {
    limit = 10;
    skip = 0;
    currentIndex = $(this).index();
    $("#activity_sub_container").children().slice(0).remove();
    loadActivity(currentIndex, _userID);
  });
  $("#activity_button").click(function() {
    limit += 5;
    loadActivity(currentIndex, _userID);
  });
}
// Avatar changer click events
function avatarClickEvents(_csrf, _userID) {
  $("#avatar_upload_submit").click(function() {
    uploadAvatar(_csrf, _userID);
  });
  $("#page_cover").click(function() {
    toggleAvatarChanger(false);
  });
  $("#avatar_upload_input").change(function() {
    readURL(this);
  });
}
// User info edit click events
function userInfoClickEvents(_csrf, _userID) {
  $("#user_info_edit").click(function() {
    // User object compile
    var userData = {
      name: $("#user_info_name").text(),
      dobDay: $("#user_info_dobDay").text(),
      dobMonth: $("#user_info_dobMonth").text(),
      dobYear: $("#user_info_dobYear").text(),
      gender: $("#user_info_gender").text(),
      city: $("#user_info_city").text(),
      country: $("#user_info_country").text(),
      tagLine: $("#user_info_tagLine").text()
    }
    for(var i in userData) {
      $("#" + i).val(userData[i]);
    }
    toggleUserInfo(true, _csrf, _userID);
  });
  $("#user_info_cancel").click(function() {
    toggleUserInfo(false, _csrf, _userID);
  });
  $("#user_info_save").click(function() {
    toggleNotification(true, "loader", "Saving details...");
    // User object compile
    var userData = {
      name: $("#name").val(),
      dobDay: $("#dobDay").val(),
      dobMonth: $("#dobMonth").val(),
      dobYear: $("#dobYear").val(),
      gender: $("#gender").val(),
      city: $("#city").val(),
      country: $("#country").val(),
      tagLine: $("#tagLine").val()
    }
    // Update user info
    updateUserInfo(userData, _csrf, _userID);
    toggleNotification(true, "loader", "Saving profile...");
  });
}
// Toggle user info edit
function toggleUserInfo(state, _csrf, _userID) {
  $(".user_info_output").toggle(!state);
  $(".user_info_input").toggle(state);
  $(".options_dropdown_box").children().remove();
  if(state) {
    $(".options_dropdown_box")
      .append(
        `<li class='options_dropdown_item' id='user_info_save'>Save</li>
        <li class='options_dropdown_item' id='user_info_cancel'>Cancel</li>`
      );
  } else {
    $(".options_dropdown_box")
      .append(
        `<li class='options_dropdown_item' id='user_info_edit'>Edit</li>
        <li class="options_dropdown_spacer"></li>
        <a href="/password/change"><li class="options_dropdown_item" id="user_info_password_change">Change Password</li></a>`
      );
  }
  optionsDropdownEvents();

  userInfoClickEvents(_csrf, _userID);
}
// Read avatar img url
function readURL(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();
    reader.onload = function(e) {
      $("#avatar_upload_preview").css("background-image", "url("+e.target.result +")");
      $("#avatar_upload_preview").hide().html("")
        .append("<img id='avatar_upload_preview_hidden' src='" + e.target.result + "'>")
      setTimeout(function() {
        var x = Math.floor(($("#avatar_upload_preview").width()/2) - 180),
            y = Math.floor(($("#avatar_upload_preview").height()/2) - 180);
        $("#avatar_upload_mask").attr("x", x);
        $("#avatar_upload_mask").attr("y", y);
      }, 10);
      $("#avatar_upload_preview")
        .append(
          "<div id='avatar_upload_cover'></div>"+
          "<svg id='avatar_upload_crop' width='2000' height='2000'>"+
            "<defs>"+
              "<mask id='hole'>"+
                "<rect width='100%' height='100%' style='fill:rgba(255,255,255,1);'/>"+
                "<rect id='avatar_upload_mask' x='0' y='0' rx='10' ry='10' width='360' height='360' style='fill:rgba(0,0,0,1);'/>"+
              "</mask>"+
            "</defs>"+
            "<rect width='2000' height='2000' style='fill:rgba(0,0,0,0.5);' mask='url(#hole)'/>"+
          "</svg>"+
          "<p id='avatar_upload_crop_text'>Drag to crop</p>"
        )
      var attrX = 0,
          attrY = 0;
      $("#avatar_upload_cover")
        .draggable()
        .on("mousedown", function(event, ui){
          attrX = parseInt($("#avatar_upload_mask").attr("x"));
          attrY = parseInt($("#avatar_upload_mask").attr("y"));
          $("#avatar_upload_crop_text").fadeOut(200, "swing");
        })
        .on("drag", function(event, ui){
          var changeX = (ui.position.left + attrX) - ui.originalPosition.left,
              changeY = (ui.position.top + attrY) - ui.originalPosition.top,
              imgWidth = $("#avatar_upload_preview_hidden").width(),
              imgHeight = $("#avatar_upload_preview_hidden").height()
          $("#avatar_upload_mask")
            .attr("x", changeX)
            .attr("y", changeY)
          if(changeX <= 0) {
            $("#avatar_upload_mask")
              .attr("x", 0)
          } if(changeY <= 0) {
            $("#avatar_upload_mask")
              .attr("y", 0)
          }
          if(changeX >= (imgWidth - 360)) {
            $("#avatar_upload_mask")
              .attr("x", (imgWidth - 360))
          } if(changeY >= (imgHeight - 360)) {
            $("#avatar_upload_mask")
              .attr("y", (imgHeight - 360))
          }
        })
      $(document).on("mouseup", function() {
          $("#avatar_upload_cover")
            .css("top", 0)
            .css("left", 0)
        });
      $("#avatar_upload_preview").fadeIn(650);
      $("#avatar_upload_submit").show();
    }
    reader.readAsDataURL(input.files[0]);
  }
}
// Toggle avatar changer
function toggleAvatarChanger(state) {
  if(state) {
    $("#avatar_upload_container").slideDown(200, "swing");
    $("#avatar_upload_sub_container").slideDown(200, "swing");
    $("#page_cover").fadeIn();
    $("#avatar_upload_submit").hide();
    $("#avatar_upload_preview").children().remove();
    $("#avatar_upload_preview").css("backgroundImage", "url('/images/avatars/upload.png')");
    $("#avatar_upload_input").val("");
  } else {
    $("#avatar_upload_container").slideUp(200, "swing");
    $("#avatar_upload_sub_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  }
};
// Upload avatar
function uploadAvatar(_csrf, _userID) {
  var data = new FormData();
  file = $("#avatar_upload_input")[0].files[0];
  if(!file) {
    return;
  }
  $("#avatar_upload_submit").hide();
  toggleNotification(true, "loader", "Uploading image...")
  data.append("file-1", file);
  var attrX = $("#avatar_upload_mask").attr("x"),
      attrY = $("#avatar_upload_mask").attr("y");
  $.ajax({
    url: "/users/avatar/upload/?_csrf=" + _csrf + "&userID=" + _userID + "&posX=" + attrX + "&posY=" + attrY,
    data: data,
    cache: false,
    contentType: false,
    processData: false,
    method: "POST",
    success: function(data) {
      $("#user_img_img").attr("src", "/images/avatars/" + _userID + "?timestamp=" + new Date().getTime());
      toggleNotification(true, "loader", "Image Uploaded", 1500);
      toggleAvatarChanger(false);
    },
    error: function(err) {
      toggleNotification(true, "alert", "Unexpected error: File encoding issue", 5000);
      toggleAvatarChanger(false);
    }
  });
}
// Update user info
function updateUserInfo(userData, _csrf, _userID) {
  $.ajax({
    type: "POST",
    url: "/users/edit/" + _userID,
    data: {
      _csrf: _csrf,
      userData: JSON.stringify(userData)
    },
    success: function(data){
      if(data.message == "success") {
        toggleNotification(true, "loader", "Profile saved", 1500);
        toggleUserInfo(false, _csrf, _userID)
        for(var i in userData) {
          $("#user_info_" + i).text(userData[i]);
        }
        $("#title_name").text(userData.name);
        $("#title_tagLine").text(userData.tagLine);
      }
    },
    error: function(err) {
      var res = err.responseJSON;
      if(res.message == "invalidDetails") {
        toggleNotification(true, "alert", res.errors[0].message);
      }
    }
  });
}
// Check user info
function errorChecker(values) {
  var months = [
    {month: 1, name: "January", days: 31},
    {month: 2, name: "Febuary", days: 28},
    {month: 3, name: "March", days: 31},
    {month: 4, name: "April", days: 30},
    {month: 5, name: "May", days: 31},
    {month: 6, name: "June", days: 30},
    {month: 7, name: "July", days: 31},
    {month: 8, name: "August", days: 31},
    {month: 9, name: "September", days: 30},
    {month: 10, name: "October", days: 31},
    {month: 11, name: "November", days: 30},
    {month: 12, name: "December", days: 31}
  ];
  var errors = [];
  var dobDay = values[1].value;
  var dobMonth = values[2].value;
  var dobYear = values[3].value;
  // Presence checks
  if(dobDay.length == 0) {
    errors.push({error: "dobDayEmpty", container: values[1].id, message: "'Day' in Date of Birth is missing."});
  } else if(dobMonth.length == 0) {
    errors.push({error: "dobMonthEmpty", container: values[2].id, message: "'Month' in Date of Birth is missing."});
  } else if(dobYear.length == 0) {
    errors.push({error: "dobYearEmpty", container: values[3].id, message: "'Year' in Date of Birth is missing."});
  }
  // Integer checks
  else if(!parseInt(dobDay)) {
    errors.push({error: "dobDayNotInt", container: values[1].id, message: "'Day' in Date of Birth is not valid."});
  } else if(!parseInt(dobMonth)) {
    errors.push({error: "dobMonthNotInt", container: values[2].id, message: "'Day' in Date of Birth is not valid."});
  } else if(!parseInt(dobYear)) {
    errors.push({error: "dobYearNotInt", container: values[3].id, message: "'Year' in Date of Birth is not valid."});
  }
  // Extra checks
  else if(dobDay < 1 || dobDay > months[(dobMonth - 1)].days) {
    errors.push({error: "dobDayInvalid", container: values[1].id, message: "'Day' in Date of Birth is not valid."});
  } else if(dobMonth < 1 || dobMonth > 12) {
    errors.push({error: "dobMonthInvalid", container: values[2].id, message: "'Month' in Date of Birth is not valid."});
  } else if(new Date(dobYear, (dobMonth - 1), dobDay) > new Date() || dobYear < 1900) {
    errors.push({error: "dobYearInvalid", container: values[3].id, message: "'Year' in Date of Birth is not valid."});
  }
  return errors;
}
// Get user info
function getUserInfo(username, elementId, index) {
  $.ajax({
    type: "GET",
    url: "/users/info/" + username,
    success: function(data){
      var element = $("[id=" + elementId + "]").eq(index);
      element.children("#feed_element_meta_tagline").html(data.userInfo.tagLine);
      if(data.userInfo.imgRoute.length == 0) {
        element.children("#feed_element_meta_img_frame").children("#feed_element_meta_img").attr("src", "/images/default_user.png");
      } else {
        element.children("#feed_element_meta_img_frame").children("#feed_element_meta_img").attr("src", data.userInfo.imgRoute);
      };
      var userGroups = data.userInfo.groups;
      var groups = data.groups;
      for(i in userGroups) {
        for(ii in groups) {
          if(userGroups[i] == groups[ii].name) {
            element.children("#feed_element_meta_rank_container").append("<p id='feed_element_meta_rank' style='background-color:" + groups[ii].color + ";'>" + groups[ii].fullName + "</p>");
          };
        };
      };
    },
    error: function(err){
    }
  });
}
// Post date formatter
function postDateHandler(date, elementId, index) {
  var element = $("[id=" + elementId + "]").eq(index);
  date = new Date(date);
  var since = getTimeElapsed(date);
  var time = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  date = date.toLocaleDateString();
  element.children("#info_date").html("Posted on: " + date + " at " + time);
  element.children("#info_datesince").html(since);
};
// Load activity
function loadActivity(currentIndex, _userID) {
  $(".user_info_container").toggle(false);
  if(currentIndex == 0) {
    activityPost(limit, skip, _userID);
  } else if(currentIndex == 1) {
    activityReplies(limit, skip, _userID);
  } else if(currentIndex == 2) {
    activityInfo();
  };
};
// Get post info
function activityPost(limit, skip, _userID) {
  $("#activity_loading").fadeIn(200, "swing");
  $.get("/users/activity/posts",
    {
      user_id: _userID,
      limit: limit,
      skip: skip
    },
  function(data, status){
    $("#activity_button").remove();
    if(data.length == 0 && skip == 0) {
      $("#activity_sub_container")
      .append(
        "<div id='activity_title_container'>" +
          "<img src='/images/title/title.png' alt='' id='activity_title_img'>" +
          "<div id='activity_title_spacer'></div>" +
          "<p id='activity_title'>" +
            "This user has not started any threads yet." +
          "</p>" +
        "</div>"
      );
      $("#activity_loading").fadeOut(200, "swing");
      return;
    }

    for(i in data) {
      var date = new Date(data[i].date);
      $("#activity_sub_container")
      .append(
        "<div id='activity_title_container'>" +
          "<img src='/images/title/title.png' alt='' id='activity_title_img'>" +
          "<div id='activity_title_spacer'></div>" +
          "<p id='activity_title'>" +
            "Started thread: " +
            "<a href='/forum/"+data[i]._id+"'>" +
              "<u>"+
                data[i].title +
              "</u>" +
            "</a>" +
            " in " +
            "<a href='/forum/sub/"+data[i].location+"'>" +
              "<u>"+
                data[i].locationString +
              "</u>" +
            "</a>" +
          "</p>" +
        "</div>" +
        "<div id='activity_body_container'>" +
          "<p id='activity_body'>" +
            data[i].body +
          "</p>" +
          "<div id='activity_body_footer'>" +
            "<p id='info_date'>" +
            "</p>" +
            "<p id='info_datesince'>" +
            "</p>" +
          "</div>" +
        "</div>"
      );
      postDateHandler(data[i].date, "activity_body_footer", i)
    };

    if(data[i]) {
      $("#activity_sub_container")
      .append("<div onclick='limit += 5; skip += 5; activityPost(limit, skip, `" + _userID + "`)' id='activity_button'>Show more</div>");
    } else {
      $("#activity_sub_container")
      .append("<div style='cursor: auto;' id='activity_button'>No more activity found</div>");
    }
    $("#activity_loading").fadeOut(200, "swing");
  });
};
// Get reply info
function activityReplies(limit, skip, _userID) {
  $("#activity_loading").fadeIn(200, "swing");
  $.get("/users/activity/replies",
    {
      user_id: _userID,
      limit: limit,
      skip: skip
    },
  function(data, status) {
    $("#activity_button").remove();
    if(data.length == 0 && skip == 0) {
      $("#activity_sub_container")
      .append(
        "<div id='activity_title_container'>" +
          "<img src='/images/title/title.png' alt='' id='activity_title_img'>" +
          "<div id='activity_title_spacer'></div>" +
          "<p id='activity_title'>" +
            "This user has not replied to any threads yet." +
          "</p>" +
        "</div>"
      );
      $("#activity_loading").fadeOut(200, "swing");
      return;
    }

    for(var i in data) {
      var date = new Date(data[i].date);
      $("#activity_sub_container")
      .append(
        "<div id='activity_title_container'>" +
          "<img src='/images/title/title.png' alt='' id='activity_title_img'>" +
          "<div id='activity_title_spacer'></div>" +
          "<p id='activity_title'>" +
            "Replied to: " +
            "<a href='/forum/"+data[i].parentID+"'>" +
              "<u>"+
                data[i].parentTitle +
              "</u>" +
            "</a>" +
          "</p>" +
        "</div>" +
        "<div id='activity_body_container'>" +
          "<p id='activity_body'>" +
            data[i].body +
          "</p>" +
          "<div id='activity_body_footer'>" +
            "<p id='info_date'>" +
            "</p>" +
            "<p id='info_datesince'>" +
            "</p>" +
          "</div>" +
        "</div>"
      );
      postDateHandler(data[i].date, "activity_body_footer", parseInt(i)+skip);
    };

    if(data[i]) {
      $("#activity_sub_container")
      .append("<div onclick='limit += 10; skip += 10; activityReplies(limit, skip, `" + _userID + "`)' id='activity_button'>Show more</div>");
    } else {
      $("#activity_sub_container")
      .append("<div style='cursor: auto;' id='activity_button'>No more activity found</div>");
    }
    $("#activity_loading").fadeOut(200, "swing");
  });
};
// Get user info
function activityInfo() {
  $(".user_info_container").toggle(true);
  $("#activity_button").remove();
};
// Date builder
function buildDate() {
  var months = {January: 31, Febuary: 28, March: 31, April: 30, May: 31, June: 30, July: 31, August: 31, September: 30, October: 31, November: 30, December: 31}
  var day = $("#dobDay").val();
  var month = $("#dobMonth").val();
  var year = $("#dobYear").val();
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
    $("#dobDay").append("<option id=day>" + i + "</option>")
  }
  $("#dobDay").val(day);
  if(day > days) {
    $("#dobDay").val(days);
  } else if(!day) {
    $("#dobDay").val(1);
  }
}
