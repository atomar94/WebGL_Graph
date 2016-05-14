
var LIBS={
  degToRad: function(angle){
    return(angle*Math.PI/180);
  },

  get_projection: function(angle, a, zMin, zMax) {
    var tan=Math.tan(LIBS.degToRad(0.5*angle)),
        A=-(zMax+zMin)/(zMax-zMin),
          B=(-2*zMax*zMin)/(zMax-zMin);

    return [
      0.5/tan, 0 ,   0, 0,
      0, 0.5*a/tan,  0, 0,
      0, 0,         A, -1,
      0, 0,         B, 0
    ];
  }

};