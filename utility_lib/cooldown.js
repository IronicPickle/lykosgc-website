// Random Generator
module.exports = {
  generate: function(s) {
    var ms = s * 1000,
        currentDate = new Date(),
        endDate = new Date(currentDate.getTime() + ms);
    return endDate;
  },
  check: function(endDate, shorten) {
    var currentDate = new Date(),
        endDate = new Date(endDate),
        diff = endDate.getTime() - currentDate.getTime(),
        h = Math.floor(diff/(1000 * 60 * 60)),
        m = Math.floor(diff/(1000 * 60) - (h * 60)),
        s = Math.floor(diff/(1000) - ((h * 60 * 60) + (m * 60))),
        message = (shorten) ? h + "h " + m + "m " + s + "s" : h + " hours " + m + " minutes " + s + " seconds remaining.";
    return {diff: diff, message: message};
  }
};
