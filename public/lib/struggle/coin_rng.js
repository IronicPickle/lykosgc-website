// RNG Calculator
function clickRNG(modifier, multi) {
  // Generate num between 0 - 1
  var coinRNG = Math.random(),
      vals;
  // Most rare - Least rare
  if(coinRNG < (0.001*modifier)) { // Very rare ~ 0.1%
    vals =  rngValues(multi, 500);
  } else if(coinRNG < (0.01*modifier)) { // Rare ~ 0.9%
    vals =  rngValues(multi, 100);
  } else if(coinRNG < (0.1*modifier)) { // Uncommon ~ 9.1%
    vals =  rngValues(multi, 5);
  } else if(coinRNG < (1*modifier)) { // Common ~ 90.9%
    vals =  rngValues(multi, 1);
  } else {
    vals =  rngValues(multi, 0);
  }
  return vals;
}

function rngValues(multi, rngMulti) {
  var rps = (spinCount/360) * 100,
      rpm = Math.floor(rps * 60) / 100,
      rpmMulti = Math.floor(((rpm / 100) + 1) * 100) / 100;
  if(rpmMulti >= 2.5) rpmMulti = 2.5;
  var amount = multi * rngMulti * rpmMulti,
      coinAmount = {
        gold: Math.floor(amount/10000),
        silver: Math.floor((amount%10000)/100),
        bronze: Math.floor(amount%100)
      }
  return {
    addedMoney: amount,
    factor: 10,
    coins: [
      {
        coinType: "gold",
        coinAmount: coinAmount.gold,
        coinSize: 100,
        textColor: "#ffe477"
      },{
        coinType: "silver",
        coinAmount: coinAmount.silver,
        coinSize: 50,
        textColor: "#bec7c7"
      },{
        coinType: "bronze",
        coinAmount: coinAmount.bronze,
        coinSize: 30,
        textColor: "#8F4522"
      }
    ]
  }
}
