/**
 * Created by d-yin on 7/5/2017.
 */
window.onload = function(){
    var chat = new MyChat();
    chat.init();
};

var MyChat = function () {
    this.socket=null;
};

//main constructor
MyChat.prototype = {
    init: function () {
        var that = this;
        this.socket = io.connect();

        // login notification
        this.socket.on('connect', function () {
            document.getElementById('info').textContent = 'set nickname';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();

        });

        // socket.emit('existedNickname')
        this.socket.on('existedNickname', function () {
            document.getElementById('info').textContent = 'nickname is taken, please pick another';
        });

        // socket.emit('loginSuccess');
        this.socket.on('loginSuccess', function () {
            document.title = 'MyChat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display='none'; // hide dive
            document.getElementById('messageInput').focus();
        });

        // new user join notifications
        // socket.emit('system');
        this.socket.on('system', function (nickName, userCount, type) {
            var msg = nickName + (type == 'login' ? ' has joined' : ' has left');
            /*
            var p = document.createElement('p');
            p.textContent = msg;
            document.getElementById('historyMsg').appendChild(p);
            */
            //console.log(msg);
            that._displayMessage('system: ', msg, 'red');
            document.getElementById('status').textContent = userCount + (userCount >1 ? ' users ' : ' user ') + 'online';
        });

        // receive new msg from server
        this.socket.on('newMsg', function (user, msg, color) {
            that._displayMessage(user, msg, color);
        });

        // receive img from server
        this.socket.on('newImg', function (user, img, color) {
            that._displayImage(user, img, color);
        });
        // login
        document.getElementById('loginBtn').addEventListener('click',function () {
            var nickName = document.getElementById('nicknameInput').value;
            if( nickName.trim().length!=0){
                that.socket.emit('login', nickName);
            }else{
                document.getElementById('nicknameInput').focus();
            };
        }, false);

        // send message
        document.getElementById('sendBtn').addEventListener('click', function () {

            var messageInput = document.getElementById('messageInput'),
                messageToSend = messageInput.value,
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if(messageToSend.trim().length!=0){
                if (messageToSend.substr(0,4)=='http' ){
                    messageToSend = '<a href="'+messageToSend+'" target="_blank">'+messageToSend+'</a>';
                    that.socket.emit('postMsg', messageToSend, color);
                    that._displayMessage('me', messageToSend, color);
                }else{
                    that.socket.emit('postMsg', messageToSend, color);
                    that._displayMessage('me', messageToSend, color);
                }
            }
        }, false);

        // send img
        document.getElementById('sendImage').addEventListener('change', function () {
            if(this.files.length!=0){
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value;
                if(!reader){
                    that._displayMessage('system', '! your browser doesn\'t support this feature', 'red');
                    this.vaule ='';
                    return;
                };
                reader.onload = function (e) {
                    this.value='';
                    that.socket.emit('img', e.target.value, color);
                    that._displayImage('me', e.target.value, color);
                };
                reader.readAsDataURL(file);
                console.log(reader);
            };
        }, false);

        // section short cut
        // message shortcut
        document.getElementById('messageInput').addEventListener('keyup', function (e) {
            var messageInput = document.getElementById('messageInput'),
                messageToSend = messageInput.value,
                color = document.getElementById('colorStyle').value;

            if(e.keyCode==13 && messageToSend.trim().length!=0){
                if (messageToSend.substr(0,4)=='http' ){
                    messageToSend = '<a href="'+messageToSend+'" target="_blank">'+messageToSend+'</a>';
                    that.socket.emit('postMsg', messageToSend, color);
                    that._displayMessage('me', messageToSend, color);
                    messageInput.value = '';
                }else {
                    that.socket.emit('postMsg', messageToSend, color);
                    that._displayMessage('me', messageToSend, color);
                    messageInput.value = '';
                }
            }
        }, false);
        // enter nickname shortcut
        document.getElementById('nicknameInput').addEventListener('keyup', function (e) {
            if(e.keyCode==13){
                var nickName = document.getElementById('nicknameInput').value;
                if(nickName.trim().length!=0){
                    that.socket.emit('login', nickName);
                }
            }
        }, false);

        // section emoji
        // initial emoji
        this._initialEmoji();
        // when clicking on the emoji button
        document.getElementById('emoji').addEventListener('click', function (e) {
            var emojiWrapper = document.getElementById('emojiWrapper');
            emojiWrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        // cancel when clicking on other area
        document.body.addEventListener('click', function (e) {
            var emojiWrapper = document.getElementById('emojiWrapper');
            if(e.target != emojiWrapper){
                emojiWrapper.style.display = 'none';
            }
        });
        // sending emoji
        document.getElementById('emojiWrapper').addEventListener('click', function (e) {
            var _target = e.target;
            if( _target.nodeName.toLowerCase() == 'img'){
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + _target.title + ']';
            }
        }, false);
        // clear screen
        document.getElementById('clearBtn').addEventListener('click', function () {
            document.getElementById('historyMsg').innerHTML='';
        }, false);

    },

    // loading emojis
    _initialEmoji: function () {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for(var i =69; i>0 ; i--){
            var emojiItem = document.createElement('img');
            emojiItem.src = '../emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },

    // text display
    _displayMessage: function (user, msg, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0,8),
            // translate emoji
            msg = this._showEmoji(msg);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + ')</span> ' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    // send images
    _displayImage: function (user, imgData, color) {
        console.log(imgData);
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0,8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML =  user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },

    // translate [emoji:x]
    _showEmoji: function (msg) {
        var match,
            result =msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while(match = reg.exec(msg)){
            emojiIndex = match[0].slice(7,-1);
            if(emojiIndex>totalEmojiNum){
                // if emoji code is wrong
                var result = result.replace(match[0], '[X]');
            }else{
                var result = result.replace(match[0], '<img class="emoji" src="../emoji/'+emojiIndex+'.gif" />');
            };
        };
        return result;
    }

};

