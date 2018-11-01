(function (window) {
  function generateColor(opacity) {
    const colorMax = 255, opacityMax = 1;
    const color = `${getRandom(colorMax)},${getRandom(colorMax)},${getRandom(colorMax)}`;
    return opacity ? `rgba(${color},${getRandom(opacityMax, 0.3)})`: `rgb(${color})`;
  }

  function getRandom(maxNumber, min) {
    let num = Math.random() * maxNumber;
    if(min){
      num = num < min ? min : num;
    }else{
      num = Math.floor(num);
    }
    return num;
  }
  window.generateColor = generateColor;
})(window);