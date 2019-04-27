$(document).ready(function() {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  var _postID = $("#_scriptVars").attr("_postID");
  // ---

  // --- Initial setup
  $("#add_feed_submit_button").click(function() {
    var index = $(".cke iframe").length;
    modifyReply("POST", index - 1, "add", _postID, _csrf);
  });
  currentPage = 0;
  var hashPage = window.location.hash.substr(1);
  if(hashPage) {
    currentPage = hashPage - 1;
  }
  getReplies(currentPage, _postID, _csrf);
  $("#delete_no, #page_cover").click(function() {
    toggleDeleteContainer(false);
  });
});
// Queries server for reply data
function getReplies(page, _postID, _csrf) {
  $.ajax({
    type: "GET",
    url: "/forum/replies/info/" + _postID,
    data: {
      page: page,
      _csrf: _csrf
    },
    success: function(data) {
      constructReplies(data, _postID, _csrf);
      window.location = window.location.origin + window.location.pathname + "#" + (page + 1);
    },
    error: function(err) {}
  });
}
// Constructs html elements using reply data
function constructReplies(data, _postID, _csrf) {
  var replies = data.replies;
  max = data.max;
  $("#feed_title_container").remove();
  $("[id=feed_element]").remove();
  $("#feed_notification_container").remove();
  for (var i in replies) {
    if (i == 0) {
      $("#main_title").children("u").text(replies[i].title);
      $("#main_title_container").after("<div id='feed_title_container'></div>");
      $("#feed_title_container")
        .append(
          `<img src='/images/title/title.png' id='feed_element_img'>
          <div id='feed_element_spacer'></div>
          <a href='/forum/` + replies[i]._id + `'><p id='feed_element_title'>` + replies[i].title + `</p></a>
          <input id='feed_element_title_input' value='` + replies[i].title + `'></input>
          <div id='feed_element_status_container'></div>`
        );
      if (replies[i].pinned == true) {
        $("[id=feed_element_status_container]").eq(i)
          .append(
            `<img src='/images/post_tooltip/pinned.png' alt='' id='feed_element_pinned_img' class='tooltip_trigger'>
            <p id='feed_element_status_tooltip'>Pinned</p>`
          );
      }
      if (replies[i].locked == true) {
        $("[id=feed_element_status_container]").eq(i)
          .append(
            `<img src='/images/post_tooltip/locked.png' alt='' id='feed_element_locked_img' class='tooltip_trigger'>
            <p id='feed_element_status_tooltip'>Pinned</p>`
          );
      }
      $("#feed_title_container").after("<div id='feed_element'></div>");
    } else {
      $("#left_wrapper").append("<div id='feed_element'></div>");
    }
    $("[id=feed_element]").eq(i)
      .append(
        `<div id='feed_element_meta_container'></div>
        <div id='feed_element_body'>` + replies[i].body + `</div>`
      );
    getUserInfo(replies[i].author, i, _csrf);
    if (replies[i].editInfo.length > 0) {
      $("[id=feed_element]").eq(i).append("<p id='feed_element_edited'>(edited)</p>");
    }
    if (replies[i].permission.isAdmin || replies[i].permission.isAuthor) {
      $("[id=feed_element]").eq(i)
        .append(
          `<div id='feed_element_id' hidden>` + replies[i]._id + `</div>
          <form id='edit_feed_form' class='feed_form' action='/forum/replies/edit/` + replies[i]._id + `' method='POST'></form>`
        )
        .children("#edit_feed_form")
        .append(
          `<textarea id='edit_feed_form_body_` + i + `' name='body' placeholder='Start typing something here...'>` + replies[i].body + `</textarea>
          <input name='replyNo' value='` + i + `' style='display:none;'>
          <input type='hidden' name='_csrf' value='` + _csrf + `'>`
        );
      var height = $("[id=feed_element]").eq(i).height() - 180;
      CKEDITOR.replace("edit_feed_form_body_" + i, {
        height: height,
        removeButtons: "Scayt,Anchor,Table,About,Indent,Outdent,Styles,Source,Maximize"
      });
    }
    var date = new Date(replies[i].date);
    var since = getTimeElapsed(date);
    var time = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    date = date.toLocaleDateString();
    $("[id=feed_element]").eq(i)
      .append("<div id='feed_element_info_container'></div>")
      .children("#feed_element_info_container")
      .append(
        `<p id='feed_element_info_date'>` + `Posted on: ` + date + ` at ` + time + `</p>
        <p id='feed_element_info_datesince'>` + since + `</p>`
      );

    if (replies[i].permission.isLoggedIn) {
      $("[id=feed_element_info_container]").eq(i)
        .append("<div id='feed_element_info_options_container'></div>")
        .children("#feed_element_info_options_container")
        .append(
          `<img class='options_dropdown_button' src='/images/title/options.png'>
          <ul id='options_dropdown_box' class='options_dropdown_box'></ul>`
        );
    }
    if (replies[i].permission.isAdmin || replies[i].permission.isAuthor) {
      if (replies[i].permission.isAdmin && i == 0) {
        $("[id=options_dropdown_box]").eq(i)
          .append(
            `<li id='feed_element_edit' class='options_dropdown_item'>Edit</li>
            <li id='feed_element_delete' class='options_dropdown_item'>Delete</li>
            <li id='feed_element_save' class='options_dropdown_item' style='display:none;'>Save</li>
            <li id='feed_element_cancel' class='options_dropdown_item' style='display:none;'>Cancel</li>
            <li id='feed_element_pin' class='options_dropdown_item'>Pin</li>
            <li id='feed_element_lock' class='options_dropdown_item'>Lock</li>`
          );
      } else {
        $("[id=options_dropdown_box]").eq(i)
          .append(
            `<li id='feed_element_edit' class='options_dropdown_item'>Edit</li>
            <li id='feed_element_delete' class='options_dropdown_item'>Delete</li>
            <li id='feed_element_save' class='options_dropdown_item' style='display:none;'>Save</li>
            <li id='feed_element_cancel' class='options_dropdown_item' style='display:none;'>Cancel</li>`
          );
      }
    }
  }
  if (replies.length == 1) {
    $("#left_wrapper")
      .append("<div id='feed_notification_container'></div>")
      .children("#feed_notification_container")
      .append("<p id='feed_notification'>There's nothing here yet.</p>");
  }
  optionsDropdownEvents();
  optionaClickEvent(_postID, _csrf);
  navClickEvents(max, _postID, _csrf);
}
// Applies click events to option buttons
function optionaClickEvent(_postID, _csrf) {
  $("[id=feed_element_edit]").off("click").click(function() {
    toggleReplyEdit(true, this);
  });
  $("[id=feed_element_cancel]").off("click").click(function() {
    toggleReplyEdit(false, this);
  });
  $("[id=feed_element_save]").off("click").click(function() {
    var index = $("[id=feed_element_save]").index(this);
    if (index == 0) {
      modifyPost("POST", "edit", _postID, _csrf);
    } else {
      modifyReply("POST", index, "edit", _postID, _csrf);
    }
  });
  $("[id=feed_element_delete]").off("click").click(function() {
    var index = $("[id=feed_element_delete]").index(this);
    var text;
    if (index == 0) {
      text = $("#feed_element_title_input").val();
    } else {
      text = $(".cke iframe").eq(index).contents().find("body").text();
    }
    toggleDeleteContainer(true, text);
    $("#delete_yes").off("click").click(function() {
      if (index == 0) {
        modifyPost("DELETE", "delete", _postID, _csrf);
      } else {
        modifyReply("DELETE", index, "delete", _postID, _csrf);
      }
    });
  });
  $("#feed_element_pin").off("click").click(function() {
    modifyPostStatus("pin", _postID, _csrf);
  });
  $("#feed_element_lock").off("click").click(function() {
    modifyPostStatus("lock", _postID, _csrf);
  });
}
// Applies click events to page navigation buttons
function navClickEvents(max, _postID, _csrf) {
  maxPage = Math.ceil(max / 10) - 1;
  if (maxPage == -1) maxPage = 0;
  if (currentPage != 0) {
    $("[id=first]")
      .off("click")
      .click(function() {
        currentPage = 0;
        getReplies(0, _postID, _csrf);
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
        getReplies(currentPage, _postID, _csrf);
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
        getReplies(currentPage, _postID, _csrf);
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
        getReplies(maxPage, _postID, _csrf);
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
      getReplies(currentPage, _postID, _csrf);
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
function modifyPost(type, method, _postID, _csrf) {
  if (method == "edit") {
    toggleNotification(true, "loader", "Submitting post...");
  } else {
    toggleNotification(true, "loader", "Removing post...");
  }
  var bodyHtml = $(".cke iframe").eq(0).contents().find("body").html();
  var bodyText = $(".cke iframe").eq(0).contents().find("body").text();
  var title = $("#feed_element_title_input").val();
  $.ajax({
    type: type,
    url: "/forum/" + method + "/" + _postID,
    data: {
      title: title,
      body: bodyHtml,
      _csrf: _csrf
    },
    success: function(data) {
      if(method == "edit") {
        getReplies(currentPage, _postID, _csrf);
        toggleNotification(true, "loader", "Post submitted!", 1500);
      } else {
        window.location.replace("/forum/sub/" + data);
      }
    },
    error: function(err) {
      err = err.responseJSON;
      if(err.message == "errors") {
        toggleNotification(true, "alert", err.errors[0].message);
      }
    }
  });
}
// Adds or edits a reply
function modifyReply(type, index, method, _postID, _csrf) {
  if (method == "add" || method == "edit") {
    toggleNotification(true, "loader", "Submitting reply...");
  } else {
    toggleNotification(true, "loader", "Removing reply...");
  }
  var bodyHtml = $(".cke iframe").eq(index).contents().find("body").html();
  var bodyText = $(".cke iframe").eq(index).contents().find("body").text();
  var activeID;
  if (method == "edit") {
    activeID = $("[id=feed_element_id]").eq(index).text();
  } else if (method == "delete") {
    activeID = $("[id=feed_element_id]").eq(index).text();
    if ((max - 1) % 10 == 0 && currentPage != 0) {
      currentPage = currentPage - 1;
    }
  } else {
    activeID = _postID;
    currentPage = maxPage;
    if (max % 10 == 0 && max != 0) {
      currentPage = currentPage + 1;
    }
  }
  $.ajax({
    type: type,
    url: "/forum/replies/" + method + "/" + activeID,
    data: {
      body: bodyHtml,
      _csrf: _csrf
    },
    success: function(data) {
      if (method == "add" || method == "edit") {
        $(".cke iframe").last().contents().find("body").html("");
        toggleNotification(true, "loader", "Reply submitted!", 1500);
      } else {
        toggleNotification(true, "loader", "Reply removed!", 1500);
        toggleDeleteContainer(false);
      }
      getReplies(currentPage, _postID, _csrf);
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
function modifyPostStatus(method, _postID, _csrf) {
  toggleNotification(true, "loader", "Updating post!");
  $.ajax({
    type: "POST",
    url: "/forum/" + method + "/" + _postID,
    data: {
      _csrf: _csrf
    },
    success: function(data) {
      toggleNotification(true, "loader", "Post updated!", 1500);
      getReplies(currentPage, _postID, _csrf);
    },
    error: function(err) {
      toggleNotification(true, "alert", "Post updated failed!", 5000);
    }
  });
}
