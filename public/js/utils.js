function getTimeElapsed(date) {
  var since = new Date() - date;
  var secondsSince = since/1000;
  var minutesSince = secondsSince/60;
  var hoursSince = minutesSince/60;
  var daysSince = hoursSince/24;
  var weeksSince = daysSince/7;
  var monthsSince = daysSince/30;
  var yearsSince = daysSince/365.25;

  if(yearsSince > 1) {
    sinceTime = Math.floor(yearsSince);
    since = Math.floor(yearsSince) + " year"
  } else if(monthsSince > 1) {
    sinceTime = Math.floor(monthsSince);
    since = Math.floor(monthsSince) + " month"
  } else if(weeksSince > 1) {
    sinceTime = Math.floor(weeksSince);
    since = Math.floor(weeksSince) + " week"
  } else if(daysSince > 1) {
    sinceTime = Math.floor(daysSince);
    since = Math.floor(daysSince) + " day"
  } else if(hoursSince > 1) {
    sinceTime = Math.floor(hoursSince);
    since = Math.floor(hoursSince) + " hour"
  } else if(minutesSince > 1) {
    sinceTime = Math.floor(minutesSince);
    since = Math.floor(minutesSince) + " minute"
  } else {
    sinceTime = Math.floor(secondsSince);
    since = Math.floor(secondsSince) + " second"
  };

  if(sinceTime > 1) {
    since = since + "s ago";
  } else {
    since = since + " ago"
  };

  return since;
}
