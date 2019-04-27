$(document).ready(function () {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  // ---

	// --- Initial setup
  $("#options_dropdown_add_post").click(function() {
    toggleAddContainer(true);
  });
  $("#add_button_cancel, #page_cover").click(function() {
    toggleAddContainer(false);
  });
  $("#add_button_submit").click(function() {
    modifyPost("POST", null, "add", _csrf);
  });
  currentPage = 0;
  getThreads(currentPage, _csrf);
  $("#delete_no, #page_cover").click(function() {
    toggleDeleteContainer(false);
  });
});
// Queries server for reply data
function getThreads(page, _csrf) {
  $.ajax({
    type: "GET",
    url: "/forum/info?forum=news_and_annoucements",
    data: {
      page: page,
      _csrf: _csrf
    },
    success: function(data) {
      constructThreads(data, _csrf);
    },
    error: function(err) {}
  });
}
// Constructs html elements using reply data
function constructThreads(data, _csrf) {
  var threads = data.threads;
  max = data.max;
  $("[id=feed_title_container]").remove();
  $("[id=feed_element]").remove();
  $("#feed_notification_container").remove();
  for (var i in threads) {
    $("#main_title").children("u").text(threads[i].title);
    $("#left_wrapper").append("<div id='feed_title_container'></div>");
    $("[id=feed_title_container]").eq(i)
      .append("<img src='/images/title/title.png' id='feed_element_img'>")
      .append("<div id='feed_element_spacer'></div>")
      .append("<a href='/forum/" + threads[i]._id + "'><p id='feed_element_title'>" + threads[i].title + "</p></a>")
      .append("<input id='feed_element_title_input' value='" + threads[i].title + "'></input>")
      .append("<div id='feed_element_status_container'></div>");
    if (threads[i].pinned == true) {
      $("[id=feed_element_status_container]").eq(i)
        .append("<img src='/images/post_tooltip/pinned.png' alt='' id='feed_element_pinned_img' class='tooltip_trigger'>")
        .append("<p id='feed_element_status_tooltip'>Pinned</p>");
    }
    if (threads[i].locked == true) {
      $("[id=feed_element_status_container]").eq(i)
        .append("<img src='/images/post_tooltip/locked.png' alt='' id='feed_element_locked_img' class='tooltip_trigger'>")
        .append("<p id='feed_element_status_tooltip'>Pinned</p>");
    }
    $("#left_wrapper").append("<div id='feed_element'></div>");
    $("[id=feed_element]").eq(i)
      .append("<div id='feed_element_meta_container'></div>")
      .append("<div id='feed_element_body'>" + threads[i].body + "</div>");
    getUserInfo(threads[i].author, i, _csrf);
    if (threads[i].editInfo.length > 0) {
      $("[id=feed_element]").eq(i).append("<p id='feed_element_edited'>(edited)</p>");
    }
    if (threads[i].permission.isAdmin || threads[i].permission.isAuthor) {
      $("[id=feed_element]").eq(i)
        .append("<div id='feed_element_id' hidden>" + threads[i]._id + "</div>")
        .append("<form id='edit_feed_form'></form>")
        .children("#edit_feed_form")
        .append("<textarea id='edit_feed_form_body_" + i + "' name='body' placeholder='Start typing something here...'>" + threads[i].body + "</textarea>")
        .append("<input name='replyNo' value='" + i + "' style='display:none;'>")
        .append("<input type='hidden' name='_csrf' value='" + _csrf + "'>");
      var height = $("[id=feed_element]").eq(i).height() - 180;
      CKEDITOR.replace("edit_feed_form_body_" + i, {
        height: height,
        removeButtons: "Scayt,Anchor,Table,About,Indent,Outdent,Styles,Source,Maximize"
      });
    }
    var date = new Date(threads[i].date);
    var since = getTimeElapsed(date);
    var time = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    date = date.toLocaleDateString();
    $("[id=feed_element]").eq(i)
      .append("<div id='feed_element_info_container'></div>")
      .children("#feed_element_info_container")
      .append("<p id='feed_element_info_date'>" + "Posted on: " + date + " at " + time + "</p>")
      .append("<p id='feed_element_info_datesince'>" + since + "</p>");

    if (threads[i].permission.isLoggedIn) {
      $("[id=feed_element_info_container]").eq(i)
        .append("<div id='feed_element_info_options_container'></div>")
        .children("#feed_element_info_options_container")
        .append("<img class='options_dropdown_button' src='/images/title/options.png'>")
        .append("<ul id='options_dropdown_box' class='options_dropdown_box'></ul>");
    }
    if (threads[i].permission.isAdmin || threads[i].permission.isAuthor) {
      if (threads[i].permission.isAdmin) {
        $("[id=options_dropdown_box]").eq(i)
          .append("<li id='feed_element_edit' class='options_dropdown_item'>Edit</li>")
          .append("<li id='feed_element_delete' class='options_dropdown_item'>Delete</li>")
          .append("<li id='feed_element_save' class='options_dropdown_item' style='display:none;'>Save</li>")
          .append("<li id='feed_element_cancel' class='options_dropdown_item' style='display:none;'>Cancel</li>")
          .append("<li id='feed_element_pin' class='options_dropdown_item'>Pin</li>")
          .append("<li id='feed_element_lock' class='options_dropdown_item'>Lock</li>");
      } else {
        $("[id=options_dropdown_box]").eq(i)
          .append("<li id='feed_element_edit' class='options_dropdown_item'>Edit</li>")
          .append("<li id='feed_element_delete' class='options_dropdown_item'>Delete</li>")
          .append("<li id='feed_element_save' class='options_dropdown_item' style='display:none;'>Save</li>")
          .append("<li id='feed_element_cancel' class='options_dropdown_item' style='display:none;'>Cancel</li>");
      }
    }
  }
  if (threads.length == 0) {
    $("#left_wrapper")
      .append("<div id='feed_notification_container'></div>")
      .children("#feed_notification_container")
      .append("<p id='feed_notification'>There's nothing here yet.</p>");

  }
  optionsDropdownEvents();
  optionaClickEvent(_csrf);
  navClickEvents(max, _csrf);
}
// Applies click events to option buttons
function optionaClickEvent(_csrf) {
  $("[id=feed_element_edit]").off("click").click(function() {
    toggleReplyEdit(true, this);
  });
  $("[id=feed_element_cancel]").off("click").click(function() {
    toggleReplyEdit(false, this);
  });
  $("[id=feed_element_save]").off("click").click(function() {
    var index = $("[id=feed_element_save]").index(this);
    modifyPost("POST", index, "edit", _csrf);
  });
  $("[id=feed_element_delete]").off("click").click(function() {
    var index = $("[id=feed_element_delete]").index(this);
    var text = $(".cke iframe").eq(index).contents().find("body").text();
    toggleDeleteContainer(true, text);
    $("#delete_yes").off("click").click(function() {
      modifyPost("DELETE", index, "delete", _csrf);
    });
  });
  $("[id=feed_element_pin]").off("click").click(function() {
    var index = $("[id=feed_element_pin]").index(this);
    modifyPostStatus("pin", index, _csrf);
  });
  $("[id=feed_element_lock]").off("click").click(function() {
    var index = $("[id=feed_element_lock]").index(this);
    modifyPostStatus("lock", index, _csrf);
  });
}
// Applies click events to page navigation buttons
function navClickEvents(max, _csrf) {
  maxPage = Math.ceil(max / 10) - 1;
  if (maxPage == -1) maxPage = 0;
  if (currentPage != 0) {
    $("[id=first]")
      .off("click")
      .click(function() {
        currentPage = 0;
        getThreads(0, _csrf);
      })
      .css("cursor", "pointer")
      .attr("src", "/images/page_navigation/first.png");
  } else {
    $("[id=first]")
      .off("click")
      .css("cursor", "default")
      .attr("src", "/images/page_navigation/first_blocked.png");
  }
  if (currentPage != 0) {
    $("[id=prev]")
      .off("click")
      .click(function() {
        currentPage = currentPage - 1;
        getThreads(currentPage, _csrf);
      })
      .css("cursor", "pointer")
      .attr("src", "/images/page_navigation/previous.png");
  } else {
    $("[id=prev]")
      .off("click")
      .css("cursor", "default")
      .attr("src", "/images/page_navigation/previous_blocked.png");
  }
  if (currentPage < maxPage) {
    $("[id=next]")
      .off("click")
      .click(function() {
        currentPage = currentPage + 1;
        getThreads(currentPage, _csrf);
      })
      .css("cursor", "pointer")
      .attr("src", "/images/page_navigation/next.png");
  } else {
    $("[id=next]")
      .off("click")
      .css("cursor", "default")
      .attr("src", "/images/page_navigation/next_blocked.png");
  }
  if (currentPage < maxPage) {
    $("[id=final]")
      .off("click")
      .click(function() {
        currentPage = maxPage;
        getThreads(maxPage, _csrf);
      })
      .css("cursor", "pointer")
      .attr("src", "/images/page_navigation/last.png");
  } else {
    $("[id=final]")
      .off("click")
      .css("cursor", "default")
      .attr("src", "/images/page_navigation/last_blocked.png");
  }
  $("[id=page_nav_number]").off("change").change(function() {
    currentPage = $(this).val() - 1;
    if (currentPage >= 0 && currentPage <= maxPage) {
      getThreads(currentPage, _csrf);
    }
  });
  $("[id=page_nav_number]").val(parseInt(currentPage) + 1);
}
// Queries server for author info
function getUserInfo(userId, index, _csrf) {
  $.ajax({
    type: "GET",
    url: "/users/info/" + userId,
    data: {
      _csrf: _csrf
    },
    success: function(data) {
      constructUserInfo(data, index);
    },
    error: function(err) {}
  });
}
// Constructs html elements regarding reply and post authors
function constructUserInfo(data, index) {
  var userData = data.userInfo;
  var groups = data.groups;
  var userGroups = data.userInfo.groups;

  $("[id=feed_element_meta_container]").eq(index)
    .append("<a href='/users/" + userData.username + "'><p id='feed_element_meta_username'>" + userData.username + "</p></a>")
    .append("<div id='feed_element_meta_img_frame'><img src='/images/avatars/" + userData._id + "' alt='' id='feed_element_meta_img' onerror='$(this).attr(`src`, `/images/avatars/default_user.png`);'></div>")
    .append("<p id='feed_element_meta_tagline'>" + userData.tagLine + "</p>")
    .append("<div id='feed_element_meta_rank_container'></div>");
  for (var i in userGroups) {
    for (var ii in groups) {
      if (userGroups[i] == groups[ii].name) {
        $("[id=feed_element_meta_container]").eq(index).children("#feed_element_meta_rank_container").append("<p id='feed_element_meta_rank' style='background-color:" + groups[ii].color + ";'>" + groups[ii].fullName + "</p>");
      }
    }
  }
}
// Opens window to edit reply
function toggleReplyEdit(state, element) {
  $(element).parent().children("#feed_element_edit").toggle(!state);
  $(element).parent().children("#feed_element_delete").toggle(!state);
  $(element).parent().parent().parent().parent().children("#feed_element_body").toggle(!state);

  $(element).parent().children("#feed_element_save").toggle(state);
  $(element).parent().children("#feed_element_cancel").toggle(state);
  $(element).parent().parent().parent().parent().children("form").children(".cke").toggle(state);

  var index = $("[id=options_dropdown_box]").index($(element).parent());
  if (index == 0) {
    $("#feed_element_title").toggle(!state);
    $("#feed_element_title_input").toggle(state);
  }
}
// Edits the main post
function modifyPost(type, index, method, _csrf) {
  var title = "1";
  var bodyHtml = "1";
  var bodyText = "1";
  if (method == "add") {
    toggleNotification(true, "loader", "Submitting post...");
    title = $("#add_title_input").val();
    bodyHtml = $(".cke iframe").last().contents().find("body").html();
    bodyText = $(".cke iframe").last().contents().find("body").text();
  } else if(method == "edit") {
    bodyHtml = $(".cke iframe").eq(0).contents().find("body").html();
    bodyText = $(".cke iframe").eq(0).contents().find("body").text();
    title = $("#feed_element_title_input").val();
    toggleNotification(true, "loader", "Submitting post...");
  } else {
    toggleNotification(true, "loader", "Removing post...");
  }
  var activeForum = $("#add_forum_select").val();
  var activeID;
  if (method == "edit") {
    activeID = "/" + $("[id=feed_element_id]").eq(index).text();
  } else if (method == "delete") {
    activeID = "/" + $("[id=feed_element_id]").eq(index).text();
    if ((max - 1) % 10 == 0 && currentPage != 0) {
      currentPage = currentPage - 1;
    }
  } else {
    activeID = "?forum=" + activeForum;
    if (max % 10 == 0 && max != 0) {
      currentPage = currentPage + 1;
    }
  }
  $.ajax({
    type: type,
    url: "/forum/" + method + activeID,
    data: {
      title: title,
      body: bodyHtml,
      _csrf: _csrf
    },
    success: function(data) {
      if(method == "edit" || method == "add") {
        toggleNotification(true, "loader", "Post submitted!", 1500);
        toggleAddContainer(false);
      } else {
        toggleDeleteContainer(false);
        toggleNotification(true, "loader", "Post removed!", 1500);
      }
      getThreads(currentPage, _csrf);
    },
    error: function(err) {
      err = err.responseJSON;
      if(err.message == "errors") {
        toggleNotification(true, "alert", err.errors[0].message);
      }
    }
  });
}
// Confirms a delete
function toggleDeleteContainer(state, text) {
  if (text) $("#delete_text").text(text);
  if (state) {
    $("#delete_sub_container").slideDown(200, "swing");
    $("#page_cover").fadeIn();
    $("#delete_yes").focus();
  } else {
    $("#delete_sub_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  }
}
// Handles Pin and Lock events
function modifyPostStatus(method, index, _csrf) {
  toggleNotification(true, "loader", "Updating post!");
  var postID = $("[id=feed_element_id]").eq(index).text();
  $.ajax({
    type: "POST",
    url: "/forum/" + method + "/" + postID,
    data: {
      _csrf: _csrf
    },
    success: function(data) {
      toggleNotification(true, "loader", "Post updated!", 1500);
      getThreads(currentPage, _csrf);
    },
    error: function(err) {
      toggleNotification(true, "alert", "Post updated failed!", 5000);
    }
  });
}
// Drops add container
function toggleAddContainer(state, text) {
  if(state) {
    $("#add_sub_container").slideDown(200, "swing");
    $("#page_cover").fadeIn();
    $("#add_button_submit").focus();
  } else {
    $("#add_sub_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  }
}
