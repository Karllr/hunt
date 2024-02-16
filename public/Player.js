function Runner(x,y){
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 20;
    this.speed = 5;
    this.accel = 0;
    this.yvel = 0;
    this.gravity = 0.8;
    this.falling = true;
    this.jumpHeight = 9.7;
    this.health=100;
    this.respawn={
        x:this.x,
        y:this.y,
    }
    this.dead=false;
    this.update=function(blocks){
        if(!this.dead){
            if(!(keys[DOWN_ARROW]||keys[83])&&this.h<20){
                this.y-=10;
                this.yvel=-20;
            }
            this.h = (keys[DOWN_ARROW]||keys[83]) ? 10 : 20;
            this.speed = (keys[DOWN_ARROW]||keys[83]) ? 1.5 : 5;
            if(keys[16]||keys[81]){
                this.speed=7.5;
            }
            if (keys[LEFT_ARROW]||keys[65]) {
                this.accel = -this.speed;
            } else if (keys[RIGHT_ARROW]||keys[68]) {
                this.accel = this.speed;
            } else {
                this.accel = 0;
            }
    
            if ((keys[UP_ARROW]||keys[87]) && !this.falling) {
                this.yvel = -this.jumpHeight;
            }
        }
        if(this.health<0){
            this.respawnn();
        }
        this.x+=this.accel;
        this.collideWith(this.accel,0,blocks);
        this.falling=true;
        this.y+=this.yvel+=this.gravity;
        this.collideWith(0,this.yvel,blocks);
        //console.log(this.health);
    };
    this.respawnn=function(){
        if(deathTimer<120){
            deathTimer++;
            if(deathTimer<2){   
                socket.emit('death',name)
            }
            this.dead=true;
        }else{
            this.health=100;
            deathTimer=0;
            this.dead=false;
            this.x=this.respawn.x;
            this.y=this.respawn.y;
        }
        
    };
    this.collideWith=function(xv,yv,blocks){
        for(var i=0;i<blocks.length;i++){
            var b=blocks[i];
            if(this.y+this.h > b.y &&
            this.y        < b.y+b.Sz &&
            this.x+this.w > b.x &&
            this.x        < b.x+b.Sz){
                switch(b.type){
                    default:
                        if (yv > 0) {
                            this.yvel = 0;
                            this.falling = false;
                            this.y = b.y - this.h;
                            if(yv>10) this.health-=2.5*(yv-10);
                        }
                        // TOP
                        if (yv < 0) {
                            this.yvel = 0;
                            this.falling = true;
                            this.y = b.y + b.Sz;
                        }
                        // RIGHT
                        if (xv > 0) {
                            this.accel = 0;
                            this.x = b.x - this.w;
                        }
                        // LEFT
                        if (xv < 0) {
                            this.accel = 0;
                            this.x = b.x + b.Sz;
                        }
                    break;
                    case "air":
                    break;
                }
            }
        }
    }
    this.show=function(){
        stroke(255);
        strokeWeight(2);
        fill(255,0,0)
        rect(this.x,this.y,this.w,this.h);
    };
}
