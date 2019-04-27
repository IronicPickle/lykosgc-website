$(document).ready(function() {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  var _forum = $("#_scriptVars").attr("_forum");
  // ---

  // --- Initial setup
  $("#options_dropdown_add_post").click(function() {
    toggleAddContainer(true);
  });
  $("#add_button_cancel, #page_cover").click(function() {
    toggleAddContainer(false);
  });
  $("#add_button_submit").click(function() {
    modifyPost("POST", null, "add", _forum, _csrf);
  });
  currentPage = 0;
  getThreads(currentPage, _forum, _csrf);
  $("#delete_no, #page_cover").click(function() {
    toggleDeleteContainer(false);
  });
});
// Queries server for reply data
function getThreads(page, _forum, _csrf) {
  $.ajax({
    type: "GET",
    url: "/forum/info",
    data: {
      forum: _forum,
      page: page,
      _csrf: _csrf
    },
    success: function(data) {
      constructThreads(data, _forum,_csrf);
    },
    error: function(err) {}
  });
}
// Constructs html elements using reply data
function constructThreads(data, _forum, _csrf) {
  var threads = data.threads;
  max = data.max;
  _forum = data.forum;
  $("[id=feed_title_container]").remove();
  $("[id=feed_notification_container]").remove();
  for(var i in threads) {
    $("#left_wrapper").append("<div id='feed_title_container'></div>");
    $("[id=feed_title_container]").eq(i)
      .append(
        `<img src='/images/title/title.png' id='feed_element_img'>
        <div id='feed_element_spacer'></div>
        <a href='/forum/` + threads[i]._id + `'><p id='feed_element_title'>` + threads[i].title + `</p></a>
        <div id='feed_element_author_container'></div>
        <div id='feed_element_user_img_frame'></div>
        <div id='feed_element_status_container'></div>
        <div id='feed_element_options_container'></div>
        <div id='feed_element_other_container'></div>
        <p id='feed_element_id' hidden>` + threads[i]._id + `</p>`
      );
    var date = new Date(threads[i].date);
    var since = getTimeElapsed(date);
    var time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
    date = date.toLocaleDateString();
    $("[id=feed_element_author_container]").eq(i)
      .append("<p id='feed_element_date'>" + date + " at " + time + "</p>");
    getUserInfo(threads[i].author, i, _csrf);
    if(threads[i].pinned) {
      $("[id=feed_element_status_container]").eq(i)
        .append(
          `<img src='/images/post_tooltip/pinned.png' alt='' id='feed_element_pinned_img' class='tooltip_trigger'>
          <p id='feed_element_status_tooltip'>Pinned</p>`
        );
      $("[id=feed_title_container]").eq(i)
        .css("background-color", "background-color: rgba(15,24,39,1)")
        .css("border-color", "border-color: rgba(5,14,29,1);");
    }
    if(threads[i].locked) {
      $("[id=feed_element_status_container]").eq(i)
        .append(
          `<img src='/images/post_tooltip/locked.png' alt='' id='feed_element_locked_img' class='tooltip_trigger'>
          <p id='feed_element_status_tooltip'>Locked</p>`
        );
    }
    if(threads[i].permission.isLoggedIn) {
      $("[id=feed_element_options_container]").eq(i)
        .append(
          `<img class='options_dropdown_button' src='/images/title/options.png' style='margin: 4px 0 0 0;'>
          <ul id='options_dropdown_box' class='options_dropdown_box'></ul>`
        );
      if(threads[i].permission.isAdmin) {
        $("[id=options_dropdown_box]").eq(i)
          .append(
            `<li id='feed_element_delete' class='options_dropdown_item'>Delete</li>
            <li id='feed_element_pin' class='options_dropdown_item'>Pin</li>
            <li id='feed_element_lock' class='options_dropdown_item'>Lock</li>`
          );
      } else {
        $("[id=options_dropdown_box]").eq(i)
          .append("<li id='feed_element_delete' class='options_dropdown_item'>Delete</li>");
      }
    }
    $("[id=feed_element_other_container]").eq(i)
      .append(
        `<p id='feed_element_views'>Views: ` + threads[i].viewInfo.length + `</p>
        <p id='feed_element_replies'>Replies: ` + threads[i].replyCount + `</p>`
      );
  }
  if(threads.length == 0) {
    $("#left_wrapper")
      .append("<div id='feed_notification_container'></div>")
      .children("#feed_notification_container")
      .append("<p id='feed_notification'>There's nothing here yet.</p>");
  }
  optionsDropdownEvents();
  optionaClickEvent(_forum, _csrf);
  navClickEvents(max, _forum, _csrf);
}
// Applies click events to option buttons
function optionaClickEvent(_forum, _csrf) {
  $("[id=feed_element_delete]").off("click").click(function() {
    var index = $("[id=feed_element_delete]").index(this);
    var text = $("[id=feed_element_title]").eq(index).text();
    toggleDeleteContainer(true, text, _csrf);
    $("#delete_yes").off("click").click(function() {
      modifyPost("DELETE", index, "delete", _forum, _csrf);
    });
  });
  $("[id=feed_element_pin]").off("click").click(function() {
    var index = $("[id=feed_element_pin]").index(this);
    modifyPostStatus("POST", index, "pin", _forum, _csrf);
  });
  $("[id=feed_element_lock]").off("click").click(function() {
    var index = $("[id=feed_element_lock]").index(this);
    modifyPostStatus("POST", index, "lock", _forum, _csrf);
  });
  $(".tooltip_trigger").off("mouseover").mouseover(function() {
    $(this).next().fadeIn(200, "swing");
  });
  $(".tooltip_trigger").off("mouseleave").mouseleave(function() {
    $(this).next().fadeOut(200, "swing");
  });
}
// Applies click events to page navigation buttons
function navClickEvents(max, _forum, _csrf) {
  maxPage = Math.ceil(max / 20) - 1;
  if (maxPage == -1) maxPage = 0;
  if (currentPage != 0) {
    $("[id=first]")
      .off("click")
      .click(function() {
        currentPage = 0;
        getThreads(0, _forum, _csrf);
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
        getThreads(currentPage, _forum, _csrf);
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
        getThreads(currentPage, _forum, _csrf);
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
        getThreads(maxPage, _forum, _csrf);
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
      getThreads(currentPage, _forum, _csrf);
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
      constructUserInfo(data, index, _csrf);
    },
    error: function(err) {}
  });
}
// Constructs html elements regarding threads
function constructUserInfo(data, index, _csrf) {
  var userData = data.userInfo;
  var groups = data.groups;
  var userGroups = data.userInfo.groups;

  $("[id=feed_element_author_container]").eq(index)
    .append("<a href='/users/" + userData.username + "'><p id='feed_element_author'>" + userData.username + "</p></a>");
  $("[id=feed_element_user_img_frame]").eq(index)
    .append("<img src='/images/avatars/" + userData._id + "' alt='' id='feed_element_user_img' onerror='$(this).attr(`src`, `/images/avatars/default_user.png`);'>");
}
// Deleted or adds a thread
function modifyPost(type, index, method, _forum, _csrf) {
  var title = "1";
  var bodyHtml = "1";
  var bodyText = "1";
  if (method == "add") {
    toggleNotification(true, "loader", "Submitting thread...");
    title = $("#add_title_input").val();
    bodyHtml = $(".cke iframe").contents().find("body").html();
    bodyText = $(".cke iframe").contents().find("body").text();
  } else {
    toggleNotification(true, "loader", "Removing thread...");
  }
  var activeForum = $("#add_forum_select").val();
  var activeID;
  if (method == "add") {
    activeID = "?forum=" + activeForum;
    currentPage = 0;
  } else if (method == "delete") {
    activeID = "/" + $("[id=feed_element_id]").eq(index).text();
    if ((max - 1) % 10 == 0 && currentPage != 0) {
      currentPage = currentPage - 1;
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
      if(method == "add") {
        toggleNotification(true, "loader", "Thread submitted!", 1500);
        toggleAddContainer(false);
      } else {
        toggleNotification(true, "loader", "Thread removed!", 1500);
        toggleDeleteContainer(false);
      }
      getThreads(currentPage, _forum, _csrf);
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
  if(text) $("#delete_text").text(text);
  if(state) {
    $("#delete_sub_container").slideDown(200, "swing");
    $("#page_cover").fadeIn();
    $("#delete_yes").focus();
  } else {
    $("#delete_sub_container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  }
}
// Edits a thread
function modifyPostStatus(type, index, method, _forum, _csrf) {
  if (method == "delete") {
    toggleNotification(true, "loader", "Removing post...");
  } else {
    toggleNotification(true, "loader", "Updating post...");
  }

  var postID = $("[id=feed_element_id]").eq(index).text();
  $.ajax({
    type: type,
    url: "/forum/" + method + "/" + postID,
    data: {
      _csrf: _csrf
    },
    success: function(data) {
      getThreads(currentPage, _forum, _csrf);
      if (method == "delete") {
        toggleNotification(true, "loader", "Post removed!", 1500);
        toggleDeleteContainer(false);
      } else {
        toggleNotification(true, "loader", "Post updated!", 1500);
      }
    },
    error: function(err) {
      if (method == "delete") {
        toggleNotification(true, "alert", "Post remove failed!", 5000);
        toggleDeleteContainer(false);
      } else {
        toggleNotification(true, "alert", "Post update failed!", 5000);
      }
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
