'use strict';
import socket_io from 'socket.io' ;

const port = process.env.PORT || 5000;

const io = socket_io.listen(port);

// room number & how many users in there
const state = {
    users : {
        0 : {id : 0, isIn : false}
    },
    rooms : {
        0 : {count : 0}
    }
};

function accessStateCount(state, roomNo, type) {
    const roomInfo = state.rooms[roomNo];
    if (!roomInfo){
        state.rooms[roomNo] = {
            count : 0
        };
    }
    else{
        const result = roomInfo["count"];
        if (!result){
            roomInfo["count"] = 0;
        }
    }
    if(type === "GET"){
        return state.rooms[roomNo]["count"];
    }
    else if(type === "ADD"){
        state.rooms[roomNo].count += 1;
    }
    else if(type === "SUBTRACT"){
        state.rooms[roomNo].count -= 1;
    }
}

function accessStateUser(state, userID, type){
    const userInfo = state.users[userID];
    if(!userInfo){
        state.users[userID] = {
            id : userID,
            isIn : false
        };
    }
    if(type === 'CHECK'){
        return state.users[userID].isIn ;
    }
    else if(type === 'LOGIN'){
        state.users[userID].isIn = true;
    }
    else if(type === 'LOGOUT'){
        state.users[userID].isIn = false;
    }
}

io.sockets.on('connection', socket => {

    socket.emit('approval', {
        type : 'approve'
    });

    socket.on('room-connect', data => {
        // Room 과의 interaction

        if(data.type === 'join') {
            /* 접속시도
            * data = {
            *   type :
            *   name :
            *   id :
            *   room :
            * }
             */
            socket.join(data.room);

            accessStateCount(state, data.room, 'ADD');
            accessStateUser(state, data.id, 'LOGIN');

            // depracated
            // socket.set('room', data.room);
            socket.room = data.room;

            socket.emit('system', {
                message : '대기실에 입장하였습니다. 상대방과 대화를 나눌 수 있습니다.'
            });

            socket.broadcast.to(data.room).emit('system', {
                message : `${data.name}이 대기실에 입장하셨습니다.`
            });

            //socket.to(data.room).emit('system', {message: `현재 접속 인원 수 : ${accessStateCount(state, data.room, 'GET')}`});
        }

        socket.on('disconnect', function(){
            accessStateCount(state, socket.room, 'SUBTRACT');
            accessStateUser(state, data.id, 'LOGOUT');

            socket.broadcast.to(data.room).emit('system', {
                message: `${data.name}이 대기실에서 퇴장하셨습니다.`
            });
            console.log('user disconnected');

            // socket.to(data.room).emit('system', { message : `현재 접속 인원 수 : ${accessStateCount(state, data.room, 'GET')}` } );
        });

    });

    socket.on('knock', data=> {
        /*
        * data = {
        *   id
        * }
        *
        * 상대 user 가 접속중인지 확인
         */
        let isIn = accessStateUser(state, data.id , 'CHECK');
        socket.emit('reKnock', { id:data.id , isIn });
    });

    socket.on('user', data => {
        const room = socket.room;
        if(room) {
            socket.broadcast.to(room).emit('message', data);
        }
    });


});
