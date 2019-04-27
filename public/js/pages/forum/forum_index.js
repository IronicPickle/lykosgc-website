$(document).ready(function () {
  // Varaible setup
  var _csrf = $("#_csrf").attr("_csrf");
  // ---

  // --- Initial setup
  openModifyContainerEvents(_csrf, true);
  optionsDropdownEvents();
  $("#page_cover, #modify_cancel").click(function() {
    $("#modify_container").slideUp(200, "swing");
    $("#modify_sub-container").slideUp(200, "swing");
    $("#page_cover").fadeOut();
  });
});

function modifyContainerEvents(_csrf, state, data) {
  if(state) {
    $("#modify_confirm").on("click", function() {
      confirmModifcation(_csrf, data);
    });
  } else {
    $("#modify_confirm").off("click");
  }
}

function openModifyContainerEvents(_csrf, state) {
  if(state) {
    $(".options_dropdown_item").on("click", function() {
      var data = {
        type: $(this).attr("_type"),
        action: $(this).attr("_action"),
        data: $(this).attr("_data"),
        category: $(this).attr("_category")
      }
      if(typeof data.data != "undefined") data.data = JSON.parse(data.data);
      modifyContainerEvents(_csrf, false)
      modifyContainerEvents(_csrf, true, data);
      openModifyContainer(data);
    });
  } else {
    $(".options_dropdown_item").off("click");
  }
}
// Modify container - Click - Events
function openModifyContainer(data) {
  event.preventDefault();

  if(data.type == "forum") {
    $("#modify_form_perm").css("display", "block");
    $("#modify_container").css("height", 270);
    $("#modify_sub-container").css("height", 250);
  } else {
    $("#modify_form_perm").css("display", "none");
    $("#modify_container").css("height", 230);
    $("#modify_sub-container").css("height", 210);
  }

  $("#modify_form_title, #modify_form_order").css("border-style", "none");

  $("#modify_form_title, #modify_form_order, #modify_form_perm").val("");
  $("#modify_container, #modify_sub-container").slideDown(200, "swing");
  $("#page_cover").fadeIn();

  var title;
  if(data.action != "add") {
    if(data.type == "category") {
      title = data.data.categoryString;
    } else if(data.type == "forum") {
      title = data.data.locationString;
    }
  }

  if(data.action == "add") {
    $("#modify_title").html("Create a " + data.type);

    $("#modify_form_title").attr("readonly", false);
    $("#modify_form_order").attr("readonly", false);
    $("#modify_form_title, #modify_form_order, #modify_form_perm").css("background-color", "rgba(255, 255, 255, 1);");
  } else if(data.action == "edit") {
    $("#modify_title").html("Editing " + data.type + ": '"+ title + "'");

    $("#modify_form_title").val(title);
    $("#modify_form_order").val(data.data.order);
    $("#modify_form_perm").val(data.data.perm);

    $("#modify_form_title").attr("readonly", false);
    $("#modify_form_order").attr("readonly", false);
    $("#modify_form_title, #modify_form_order, #modify_form_perm").css("background-color", "rgba(255, 255, 255, 1);");
  } else if(data.action == "archive") {
    $("#modify_title").html("Archiving " + data.type + ": '"+ title + "'");

    $("#modify_form_title").val(title);
    $("#modify_form_order").val(data.data.order);
    $("#modify_form_perm").val(data.data.perm);

    $("#modify_form_title").attr("readonly", true);
    $("#modify_form_order").attr("readonly", true);
    $("#modify_form_title, #modify_form_order, #modify_form_perm").css("background-color", "rgba(200, 200, 200, 1);");
  }

}

// Confirm modification - Click - Events
function confirmModifcation(_csrf, data) {
  data.title = $("#modify_form_title").val();
  data.order = parseInt($("#modify_form_order").val());
  data.perm = parseInt($("#modify_form_perm").val());

  modificationRequest(_csrf, data);
}

// Pin post 'POST' request
function modificationRequest(_csrf, data) {
  $.ajax({
    type: "POST",
    url: "/forum_backend/"+data.type,
    data: {
      data: JSON.stringify(data),
      _csrf: _csrf
    },
    success: function(res){
      if(res.message == "success") {
        $("#modify_container").slideUp(200, "swing");
        $("#modify_sub-container").slideUp(200, "swing");
        $("#page_cover").fadeOut();
        location.reload();
      }
    },
    error: function(err){
      err = err.responseJSON;
      if(err.message == "errors") {
        $("#modify_form_title, #modify_form_order").css("border-color", "rgba(183, 28, 28, 1)").css("border-style", "solid");
        toggleNotification(true, "alert", err.errors[0].message);
      }
    }
  });
}
