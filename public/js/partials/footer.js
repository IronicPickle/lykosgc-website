$(window).on("load", function () {
  // ---

  // --- Initial setup
});

// Hide footer
function toggleFooter(state) {
  if(state) {
    $("#bottom_container").fadeIn(200, "swing");
  } else {
    $("#bottom_container").fadeOut(200, "swing");
  }
}
