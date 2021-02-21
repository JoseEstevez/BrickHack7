
function setupFirebase() {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();

    return db;
}

async function getClientSecret(db) {
    /*
    Gets the client secret from firestore
    */
    var docRef = db.collection('credentials').doc('client_secret')

    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log('Error occurred getting secret. Trying again...')
        return getClientSecret()
    })

    return data.value
}

async function getRoom(db, roomCode) {
    /*
    Gets the room  from firestore
    */
    var docRef = db.collection('rooms').doc(roomCode)

    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
        console.log('Error occurred getting room. Trying again...')
        return null
    })

    return data
}

function randomCode() {
    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    var code = '';

    for (var i = 0; i < 4; i++) {
        var random = Math.floor(Math.random() * letters.length);
        code += letters[random];
    }

    return code;
}

async function makeRoom() {
    roomCode = randomCode();
    roomExists = await getRoom(db, roomCode);

    const data = {
        Audience: [],
        Queue: [],
        currently_playing: '',
        songIndex: 0,
        timestamp: 0,
        vote: []
    }

    if (roomExists == null) {
        const res = await db.collection('rooms').doc(roomCode).set(data);
        joinRoom(roomCode, db);
    } else {
        makeRoom();
    }

}

async function joinRoom(roomCode, database) {
    alert("You've Successfully joined the Room!");
    var clientSecret = await getClientSecret(database);
    var refreshToken = getRefreshToken();
    var accessToken = await getAccessToken(clientSecret, refreshToken);
    userId = await getUID(accessToken);

    await db.collection('rooms').doc(roomCode).update({
        Audience: firebase.firestore.FieldValue.arrayUnion(userId)
    });

    var docRef = await database.collection('rooms').doc(roomCode);
    var data = await docRef.get().then(function (doc) {
        if (doc.exists) {
            return doc.data()
        }
    }).catch(function (error) {
            console.log("Error calling the database");
            console.log(error);
    })

    if (data.Queue.length > 0) {
        var startTime = data.songStart;
        var currentTime = new Date();
        var currentTimeInSeconds = currentTime.getTime() / 1000;
        var diff = Math.round(Math.abs(currentTimeInSeconds - startTime.seconds));
        diff *= 1000;

        localStorage.setItem("handlingVote", false);
        localStorage.setItem("creatingVote", false);

        await playSong(accessToken, data.Queue[data.songIndex], diff);

        for (var i = data.songIndex + 1; i < data.Queue.length; i++) {
            console.log("i is " + i);
            console.log(data.Queue[i]);
            addToQueue(accessToken, data.Queue[i])
        }

    }
    
    createVote(database, roomCode);
}

async function heartbeat(accessToken, songIndex, roomCode, database) {
    var lastTimestamp = await getTimestamp(accessToken);
    var lastSongIndex = songIndex;
    var docRef = await database.collection('rooms').doc(roomCode);

    console.log("starting heartbeat");

    while (true) {
        await sleep(1000);
        var currentTimestamp = await getTimestamp(accessToken);
        var data = await docRef.get().then(function (doc) {
            if (doc.exists) {
                return doc.data()
            }
        }).catch(function (error) {
            console.log("Error calling the database");
            console.log(error);
        })
        var currentSongIndex = data.songIndex;

        if (currentTimestamp < lastTimestamp) {
            if (currentSongIndex == lastSongIndex) {
                var currentTime = new Date();

                docRef.update({
                    songIndex: currentSongIndex + 1,
                    songStart: currentTime
                })
            }
        }
    }
}

async function createVote(database, roomCode) {
        var data = await docRef.get().then(function (doc) {
            if (doc.exists) {
                return doc.data()
            }
        }).catch(function (error) {
            console.log('Error Calling the database ' + error)
        })
    var currentTime = new Date();
    var docRef = await  database.collection('rooms').doc(roomCode);
    if (data.vote.length == 0) {
        localStorage.setItem("creatingVote", true);
        await docRef.update({
            vote: {
                time: currentTime,
                yes: 0,
                no: 0,
            }
        })
    }
}
