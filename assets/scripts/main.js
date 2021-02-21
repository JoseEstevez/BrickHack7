function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

$(document).ready(function () {
    var database = setupFirebase();
    login(database);
    var roomCode;
    
    $("#joinGroup").click(async function() {
        $("#makeGroup").hide();
        $("#joinGroup").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();

        roomCode = await joinRoom($("#groupID").val(), database);
    });

    $("#makeGroup").click(async function() {
        $("#makeGroup").hide();
        $("#joinGroup").hide();
        $("#voteYes").show();
        $("#voteNo").show();
        $("#addSong").show();
        $("#skip").show();
        roomCode = await makeRoom();

    });

    $("#skip").click(function() {
        console.log(roomCode);
        var result = await createVote(database, roomCode)
    })
});