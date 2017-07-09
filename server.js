/**
 * Created by d-yin on 7/5/2017.
 */
//require('express');
//require('socket.io');
/*
 var http = require('http'),
 server = http.createServer(function (req, res) {
 res.writeHead(200,{
 'Content-Type':'text/plain'
 });
 res.write('<h1>hello world</h1>');
 res.end();
 });
 server.listen(80);
 */

const express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    users=[];
app.use('/', express.static(__dirname + '/www'));
server.listen(80);



io.on('connection',function (socket) {
    // login event
    socket.on('login', function (nickname) {
        if(users.indexOf(nickname)>-1){
            socket.emit('existedNickname');
        }else{
            socket.userIndex = users.length;
            socket.nickname = nickname;
            users.push(nickname);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nickname, users.length, 'login'); // to notify current users new user joined in
        };
    });
    // leave event
    socket.on('disconnect', function () {
        // remove user from users[]
        users.splice(socket.userIndex, 1);
        //
        socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
    });

    // receiving message
    socket.on('postMsg', function (msg, color) {
        socket.broadcast.emit('newMsg', socket.nickname, msg, color);
    });
    // sending imgs
    socket.on('img', function (imgData) {
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });

});

//console.log('server start');