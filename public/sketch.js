var keys = [], blocks = [], blockData=[], items=[], players=[], blocksInRender=[],phantomBlocks=[],clouds=[];
var runner, socket, name, lowestPoint;
var HoldFactor=1,
timeToPlace=0,
deathTimer = 0,
antiHealth=0,
hunger=100,
damageRot=0,
time=[0,1];
var lackOfBlock=true,
isAttacked=false,
itemReceived=false,
blocksReceived=false;
var inventory=[
    ["grass",1],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
];
var cam = {
    x: 0,
    y: 0
}, selectedSlot = {
    x: undefined,
    y: undefined,
}, settings = {
    renderDistance: 12,
}, itemInUse={
    slot:0,
    type:undefined,
    count:undefined,
};
function keyPressed() {
    keys[keyCode] = true;
    if(keyCode>=49&&keyCode<=57){
        itemInUse.slot=keyCode-49;
    }
}
function keyReleased() {
    keys[keyCode] = false;
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
}
function setup() {
    createCanvas(windowWidth,windowHeight);
    socket=io.connect("https://hunt-server-ig.onrender.com");
    runner = new Runner(200, 200);
    if(localStorage.getItem("name")!==null){
        name=localStorage.getItem("name");
    }else{
        name=prompt("Name ur player");
        localStorage.setItem("name",name);
    }

    if(localStorage.getItem("inventory")!==null){
        inventory=JSON.parse(localStorage.getItem('inventory'));
    }
    runner.name=name;
    var data={
        x: runner.x,
        y:runner.y,
        h:runner.h,
        name:runner.name
    };
    socket.emit('start',data);
    //makeBase();
    for (var i = 0; i < blocks.length; i++) {
        blocks[i].update(blocks);
    }
    //addStone();
    //addOres();
    //checkOverlap();
    for(var i=0;i<50;i++){
        clouds.push(
            {
                x:Math.random()*400*50,
                y:-50*50,
                w:Math.random()*500+300,
                zLayer:Math.round(Math.random()*10)
            }
        )
    }
    socket.on(
        'blocks',
        function(data){
            //blocks=data;
            for(var i=0;i<data.blocks.length;i++){
                blocks.push(
                    new Block(
                        data.blocks[i].x,
                        data.blocks[i].y,
                        data.blocks[i].type
                    )
                )
            }
            worldMap=data.map;
            lowestPoint=data.lp;
        }
    )
    socket.on(
        'items',
        function (data){
            Erase(items)
            for(var i=0;i<data.length;i++){
                items.push(
                    new Item(
                        data[i].x,
                        data[i].y,
                        data[i].type
                    )    
                );
            }
        }
    )
    socket.on('heartbeat', function(data) {
        //console.log(data);
        players = data;
    });
}

function draw() {
    background("#87CEEB");
    runner.update(blocks);
    var data = {
        x: runner.x,
        y: runner.y,
        h: runner.h,
    };
    socket.emit('update', data);
    //Shows the player and blocks
    push();
    {
        translate(cam.x, cam.y);
        rotate((deathTimer / 1000)+ damageRot);
        cam.x = lerp(cam.x, width / 2 - runner.x, 0.5);
        cam.y = lerp(cam.y, height / 2 - runner.y, 0.5);
        runner.show();
        Erase(blocksInRender);
        for(var i=0;i<items.length;i++){
            items[i].update(blocks,runner);
            items[i].show();
            if(items[i].collidedWithPlayer){
                let itemFound=false;
                for(var j=0;j<inventory.length;j++){
                    if(inventory[j][0]===items[i].type){
                        inventory[j][1]++;
                        itemFound=true;
                        break;
                    }
                }
                if(!itemFound){
                    for(var j=0;j<inventory.length;j++){
                        if(inventory[j].length===0){
                            console.log("found a new slot at:"+j);
                            inventory[j][0]=items[i].type;
                            inventory[j][1]=1;
                            break;
                        }
                    }
                }
                items.splice(i,1);
                socket.emit("itemPicked",i)
            }
        }
        for (var i = 0; i < blocks.length; i++) {
            if (dist(runner.x, runner.y, blocks[i].x, blocks[i].y) < 8 * 50) {
                blocks[i].inRenderDistance=true;
                blocks[i].show();
            }else{
                blocks[i].inRenderDistance=false;
            }
            if(blocks[i].inRenderDistance){
                blocksInRender.push(blocks[i])
                //console.log(blocksInRender);
            }
        }
        for (var i = 0; i < 400; i++) {
            for (var j = -100; j < 100; j++) {
                if (mouseX > i * 50 + cam.x && mouseX < (i + 1) * 50 + cam.x && mouseY > j * 50 + cam.y && mouseY < (j + 1) * 50 + cam.y) {
                    selectedSlot.x = i;
                    selectedSlot.y = j;
                    noFill();
                    stroke(0);
                    strokeWeight(2);
                    rect(i * 50, j * 50, 50, 50);
                    //console.log(selectedSlot.x,selectedSlot.y);
                }
            }
        }
        if(mouseIsPressed){
            if (mouseButton === LEFT) {
                for (var i = 0; i < blocks.length; i++) {
                    if (blocks[i].x === selectedSlot.x * 50 && blocks[i].y === selectedSlot.y*50&&blocks[i].type!=="air") {
                        blocks[i].break.timeDone++;
                        noStroke();
                        fill(0,0,0,100);
                        rect((selectedSlot.x*2-(blocks[i].break.timeDone/(blocks[i].break.timeToDo*HoldFactor))+1)*25,
                            (selectedSlot.y*2-(blocks[i].break.timeDone/(blocks[i].break.timeToDo*HoldFactor))+1)*25,
                            blocks[i].break.timeDone/(blocks[i].break.timeToDo*HoldFactor)*50,
                            blocks[i].break.timeDone/(blocks[i].break.timeToDo*HoldFactor)*50
                        )
                        lackOfBlock=false;
                        //console.log(blocks[i].break.timeDone/blocks[i].break.timeToDo);
                    }else{
                        lackOfBlock=true;
                    }
                    if(blocks[i].break.timeDone>blocks[i].break.timeToDo*HoldFactor){
                        blocks[i].break.timeDone=0;
                        let itemData={
                            x:blocks[i].x,
                            y:blocks[i].y,
                            type:blocks[i].type,
                        }
                        blocks.splice(i,1);
                        items.push(
                            new Item(
                                itemData.x,
                                itemData.y,
                                itemData.type
                            )
                        )
                        items[items.length-1].yvel=-4;
                            
                        socket.emit(
                            'blockRemoved',
                            {
                                index:i,
                                x:itemData.x,
                                y:itemData.y
                            }
                        )
                        socket.emit(
                            'itemAdded',
                            {
                                x:itemData.x,
                                y:itemData.y,
                                type:itemData.type
                            }
                        )
                    }
                }
            }else{
                for(var i=0;i<blocks.length;i++){
                    blocks[i].break.timeDone=0;
                }
            }
            if (mouseButton == RIGHT) {
                if(timeToPlace<1){
                    timeToPlace=7;
                    if(inventory[itemInUse.slot][1]!==undefined){
                        inventory[itemInUse.slot][1]--;
                        blocks.push(new Block(selectedSlot.x * 50, selectedSlot.y * 50, itemInUse.type));
                    }
                    if(inventory[itemInUse.slot][1]===0){
                        inventory[itemInUse.slot].length=0;
                    }
                    //checkOverlap();
                    let blockD={
                        x:blocks[blocks.length-1].x,
                        y:blocks[blocks.length-1].y,
                        type:blocks[blocks.length-1].type,
                    }
                socket.emit('blockPlaced', blockD)
                }else{
                    timeToPlace--;
                }
                //console.log("you have LEFT clicked");
            }
        }

        for (var i = players.length - 1; i >= 0; i--) {
            var id = players[i].id;
            if (id.substring(2, id.length) !== socket.id) {
                fill(0, 0, 255);
                rect(players[i].x, players[i].y, 20, players[i].h);
                if(players[i].h>11){
                    fill(0);
                    noStroke();
                    textSize(20);
                    textAlign(CENTER);
                    text(players[i].name, players[i].x, players[i].y - 30);
                }
            }
        }
        for (var i = 0; i < clouds.length; i++) {
            noStroke();
            fill(255, 255, 255, 50);
            rect(clouds[i].x,
                clouds[i].y-clouds[i].zLayer*75,
                clouds[i].w*clouds[i].zLayer/5,
                50*clouds[i].zLayer/5);
            rect(clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25,
                clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25,
                (clouds[i].w*clouds[i].zLayer/5)*0.5,25*clouds[i].zLayer/5);
            //Leftmost cloud piece
            quad(clouds[i].x,clouds[i].y-clouds[i].zLayer*75,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25+25*clouds[i].zLayer/5,
                clouds[i].x,clouds[i].y-clouds[i].zLayer*75+50*clouds[i].zLayer/5);
            //Topmost
            quad(
                clouds[i].x, clouds[i].y-clouds[i].zLayer*75,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25+(clouds[i].w*clouds[i].zLayer/5)*0.5, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25,
                clouds[i].x+clouds[i].w*clouds[i].zLayer/5,clouds[i].y-clouds[i].zLayer*75
            );
            //Leftmost
            quad(
                clouds[i].x+clouds[i].w*clouds[i].zLayer/5,clouds[i].y-clouds[i].zLayer*75,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25+(clouds[i].w*clouds[i].zLayer/5)*0.5, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25+(clouds[i].w*clouds[i].zLayer/5)*0.5, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25+25*clouds[i].zLayer/5,
                clouds[i].x+clouds[i].w*clouds[i].zLayer/5,clouds[i].y-clouds[i].zLayer*75+50*clouds[i].zLayer/5
            );
            //Bottommost
            quad(
                clouds[i].x, clouds[i].y-clouds[i].zLayer*75+50*clouds[i].zLayer/5,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25+25*clouds[i].zLayer/5,
                clouds[i].x-(runner.x-clouds[i].x)*0.2+clouds[i].w*0.25+(clouds[i].w*clouds[i].zLayer/5)*0.5, clouds[i].y-clouds[i].zLayer*75-(clouds[i].y-runner.y)*0.2+50*0.25+25*clouds[i].zLayer/5,
                clouds[i].x+clouds[i].w*clouds[i].zLayer/5,clouds[i].y-clouds[i].zLayer*75+50*clouds[i].zLayer/5
            );
            clouds[i].x += (10-clouds[i].zLayer) / 10 * 5;
            if (clouds[i].x > 400 * 50) {
                clouds[i].x = 0;
            }
        }
    }
    pop();
    //UI
    {
        //Health and hunger
        {
            isAttacked=false;
            itemReceived=false;
            blocksReceived=false;
            //console.log(runner.health)
            antiHealth=lerp(antiHealth,runner.health,0.05);
            antiHealth=constrain(antiHealth,0,100);
            hunger-=0.01;
            if(hunger>60&&!runner.dead){
                runner.health+=0.05;
            }
            if(hunger<1){
                runner.health-=0.05;
            }
            noStroke();
            //Health
            fill(150,0,0);
            rect(20,20,200,20);
            fill(255,0,0);
            rect(20,20,antiHealth*2, 20);
            //Hunger
            fill(0,150,0);
            rect(20,50,200,20);
            fill(0,255,0);
            rect(20,50,hunger*2, 20);
            if(runner.y>lowestPoint){
                runner.health-=5;
            }
            damageRot=lerp(damageRot,0,0.1)
        }
        //Inventory
        {
            for(var i=0;i<9;i++){
                if(i===itemInUse.slot){
                    stroke(255);
                }else{
                    stroke(0);
                }
                fill(0,0,0,100)
                strokeWeight(5);
                rect(i*50+width/2-50*9/2,10,50,50);
                PhantomItem(i*50+width/2-50*9/2+5, 15, inventory[i][0],40);
                textAlign(RIGHT,BOTTOM);
                noStroke();
                textSize(20)
                fill(255);
                if(inventory[i][1]!==NaN){
                    text(inventory[i][1],i*50+width/2-50*9/2+50,60)
                }
            }
        }
    }
    //Socket events
    {
        socket.on(
            'lackOfBlock',
            function(data){
                // Find the index of the block to remove
                var index = blocks.findIndex(
                    function(block){
                        return block.x === data.x && block.y === data.y;
                    }
                );
                console.log(index);
                // Remove the block if found
                if (index !== -1) {
                    blocks.splice(index, 1);
                }
            }
        );
        socket.on(
            'newBlock',
            function(data){
                if(!blocksReceived){
                    blocks.push(
                        new Block(
                            data.x,
                            data.y,
                            data.type
                        )
                    )
                    blocksReceived=true;
                }
            }
        )
        socket.on(
            'newItem',
            function(data){
                if(!itemReceived){
                    items.push(
                        new Item(
                            data.x,
                            data.y,
                            data.type
                        )
                    )
                    console.log("new stuff ig")
                    itemReceived=true;
                }
            }
        )
        socket.on(
            'itemLacked',
            function(data){
                //console.log(data);
                items.splice(data,1);
            }
        )
        socket.on(
            'ATTACK',
            function(data){
                //console.log(data.x,data.y);
                if(!isAttacked){
                    if(
                        runner.x+runner.w>data.x&&
                        runner.x<data.x+50&&
                        runner.y+runner.h>data.y&&
                        runner.y<data.y+50
                    ){
                        //console.log("We have taken some damage");
                        runner.health-=10;
                        runner.yvel=-10;
                        damageRot=PI/90;
                    }
                    isAttacked=true;
                }
            }
        )
    }
    localStorage.setItem(
        'inventory',
        JSON.stringify(
            inventory
        )
    )
    //console.log(runner.yvel);
    itemInUse.type=inventory[itemInUse.slot][0];
    itemInUse.count=inventory[itemInUse.slot][1];
}

document.addEventListener(
    'contextmenu', 
    function(event) {
        event.preventDefault();
    }
);
function mouseWheel(e){
    //console.log(e.delta);
    if(e.delta<0) {
        itemInUse.slot--;
        if(itemInUse.slot<0){
            itemInUse.slot=8;
        }
    }
    if(e.delta>0) {
        itemInUse.slot++;
        if(itemInUse.slot>8){
            itemInUse.slot=0;
        }
    }
}
function mouseClicked(){
    if(mouseButton===LEFT&&lackOfBlock){
        socket.emit(
            'ATTACK',
            {
                x:selectedSlot.x*50,
                y:selectedSlot.y*50
            }
        )
    }
}
