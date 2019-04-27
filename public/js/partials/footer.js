$(window).on("load", function () {
  // ---

  // --- Initial setup
});

// Hide footer
function toggleFooter(state) {
  if(state) {
    $("#bottom_container").show();
  } else {
    $("#bottom_container").hide();
  }
}
