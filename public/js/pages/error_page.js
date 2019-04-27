$(document).ready(function () {
	// ---

	// --- Initial setup
	toggleHeader(false);
  scrollEvents(false);

	$("#back_img").click(function() {
		$(this).velocity({
			rotateZ: 360
		}, {
			duration: 400,
			easing: "easeOutQuart",
			queue: false,
		});
		setTimeout(function() {
			window.history.back();
		}, 400);
	});
});
