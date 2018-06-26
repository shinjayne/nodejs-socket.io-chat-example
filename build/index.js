'use strict';

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const port = process.env.PORT || 5000;

const io = _socket2.default.listen(port);

// room number & how many users in there
const state = {
    0: {
        count: 2
    }
};

function accessStateCount(state, room, type) {
    const roomInfo = state[room];
    if (!roomInfo) {
        state[room] = {
            count: 0
        };
    } else {
        const result = roomInfo["count"];
        if (!result) {
            roomInfo["count"] = 0;
        }
    }
    if (type === "GET") {
        return state[room]["count"];
    } else if (type === "ADD") {
        state[room].count += 1;
    } else if (type === "SUBTRACT") {
        state[room].count -= 1;
    }
}

io.sockets.on('connection', socket => {

    socket.emit('approval', {
        type: 'approve'
    });

    socket.on('room-connect', data => {
        // Room 과의 interaction

        if (data.type === 'join') {
            // 접속 시도

            socket.join(data.room);

            accessStateCount(state, data.room, 'ADD');

            // depracated
            // socket.set('room', data.room);
            socket.room = data.room;

            socket.emit('system', {
                message: 'welcome to chat room'
            });

            socket.broadcast.to(data.room).emit('system', {
                message: `${data.name} is connected`
            });

            socket.to(data.room).emit('reKnock', accessStateCount(state, data.room, 'GET'));
        }

        socket.on('disconnect', function () {
            accessStateCount(state, socket.room, 'SUBTRACT');

            socket.broadcast.to(data.room).emit('system', {
                message: `${data.name} is disconnected`
            });
            console.log('user disconnected');

            socket.to(data.room).emit('reKnock', accessStateCount(state, data.room, 'GET'));
        });
    });

    socket.on('knock', data => {
        // 방에 몇명 있는지 확인한다
        let count = accessStateCount(state, socket.room, 'GET');
        //count = Object.keys( io.in("room_name") ).length;

        socket.emit('reKnock', count);
    });

    socket.on('user', data => {
        const room = socket.room;

        if (room) {
            socket.broadcast.to(room).emit('message', data);
        }
    });
});