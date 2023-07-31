// @ts-nocheck
var socket = io('https://minepixel.tk');
var sendBtn = document.getElementById("send");                       //    Send Button
var input = document.getElementById("input");                        //    Message Input
var usersDiv = document.getElementById("usersList");                 //    Users List (Left Side of page)    
const chatContainer = document.getElementById("conversation");       //    Conversation div
let currentHeight = chatContainer.scrollHeight;                      //    Page height
var userIdFromUrl = window.location.search;                          //    Get Url
var urlParams = new URLSearchParams(userIdFromUrl);                  //    Store URL Parameters
let timeout;                                                         //    Timeout for Typing indicator
let friends = [];                                                    //    Store friends
let confirmDelete = "Are you sure you want to delete this message?"  //    Deletion confirm message
let deletedMessage = "Deleted this Message"                          //    Text shown when a message deleted (Format: username + var deletedMessage)
let loadedMessagesCount = 50                                         //    Messages that will load on enter the conversation
let loadMessageBtn = document.getElementById("loadMoreBtn")          //    Load Messages Button
let firstMsgIdOfConversation                                         //    First Message id of current conversation
let notificationMaxBody = 40                                         //    This will cut and make the notification body dottet at the end

// connect code
socket.on("connect", () => {
   // if not logged in, go to login
   if (localStorage.getItem("uid") && localStorage.getItem("username") && localStorage.getItem("id")) {
      // request an update for the socketId
      socket.emit("update my socketID", localStorage.getItem("username"), localStorage.getItem("id"))
   } else {
      location.href = "./login";
   }
   // change socketId for the client
   socket.on("update client socketId", (socketID) => {
      localStorage.setItem("uid", socketID);
   })
});
// request and receive contact list
socket.emit("give me contact list", localStorage.getItem("id"));

socket.on("update contact list", (friendslist) => {
   friends = friendslist;
   usersDiv.innerHTML = "";
   if (friends.length >= 0) {
      usersDiv.innerHTML = '';
      for (var i = 0; i < friends.length; i++) {
         let friendId = friends[i].from_id == localStorage.getItem("id") ? friends[i].to_id : friends[i].from_id;
         socket.emit("get user name", friendId);
      }
   } else {
      usersDiv.innerHTML = "<center style='margin-top: 20px;color: black;' id='noFriends'>Go ahead and add some friends!</center>";
   }
});

socket.on("here is user name", (res, id) => {
   let friend = friends.find(friend => {
      let friendId = friend.from_id == localStorage.getItem("id") ? friend.to_id : friend.from_id;
      return friendId == id;
   });
   if (friend) {
      let status = res[0].Status;
      let username = res[0].Username;
      let noFriends = document.getElementById('noFriends');
      if (noFriends) noFriends.innerText = ""; //<input type="checkbox" value="' + id + '">
      usersDiv.innerHTML += '<a href="?id=' + id + '" id="list' + id + '"><div class="row sideBar-body">' +
         '<div class="col-sm-3 col-xs-3 sideBar-avatar">' +
         '<div class="avatar-icon">' +
         '<img src="https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?cs=srgb&dl=pexels-suliman-sallehi-1704488.jpg&fm=jpg">' +
         '</div>' +
         '</div>' +
         '<div class="col-sm-9 col-xs-9 sideBar-main">' +
         '<div class="row">' +
         '<div class="col-sm-8 col-xs-8 sideBar-name">' +
         '<span class="name-meta">' + username + '</span>' +
         '</div>' +
         '<div class="col-sm-4 col-xs-4 pull-right sideBar-time">' +
         '<span class="time-meta pull-right" onclick="removeFriend(' + id + ');">X</span>' + // soon
         '<span class="time-meta pull-right" style="margin-top: -10px;" id="i' + id + '">' + status + '</span>' +
         '</div>' +
         '</div>' +
         '</div>' +
         '</div></a>'
   }
});

// load msgs when joining someone's chat
if (urlParams.get("id")) {
   socket.emit("get msgs from db", urlParams.get("id"), localStorage.getItem("id"), loadedMessagesCount);
   socket.on("here msgs from db", (res1, res2, resId) => {

      if (resId != undefined){
         firstMsgIdOfConversation = resId
      }else{
         loadMessageBtn.remove();
      }
      document.getElementById("recieverName").innerText = res2[0].Username;
      document.getElementById("recieverStatus").innerText = res2[0].Status;
      res1.forEach(element => {
         if (element.from_id == localStorage.getItem("id")) {
            chatContainer.innerHTML += '<div class="row message-body">' +
               '<div class="col-sm-12 message-main-sender">' +
               '<div class="sender" id="sender'+element.ID+'">' +
               '<div class="message-text" id="msg'+element.ID+'"></div>' +
               '<span class="message-time pull-right">' + element.date + '</span>';
               if (element.deleted == false){
                  document.getElementById("sender" + element.ID).innerHTML += '<button style="float: right;" type="button" onclick="Delete('+element.ID+')" id="btn'+element.ID+'">Delete</button>'
               }
               chatContainer.innerHTML +=
               '</div>' +
               '</div>' +
               '</div>';
               if (element.deleted){
                  document.getElementById("msg" + element.ID).innerHTML = "<em>" + "You " + deletedMessage + "</em>"
               }else{
                  document.getElementById("msg" + element.ID).textContent = element.msg
               }
         } else {
            chatContainer.innerHTML += '<div class="row message-body">' +
               '<div class="col-sm-12 message-main-receiver">' +
               '<div class="receiver">' +
               '<div class="message-text" id="msg'+element.ID+'"></div>' +
               '<span class="message-time pull-right">' + element.date + '</span>' +
               '</div>' +
               '</div>' +
               '</div>';
               if (element.deleted){
                  document.getElementById("msg" + element.ID).innerHTML = "<em>" + res2[0].Username + " " + deletedMessage + "</em>"
               }else{
                  document.getElementById("msg" + element.ID).textContent = element.msg
               }
         }
         if (element.ID == resId) loadMessageBtn.remove()
      });
      chatContainer.scrollTop = chatContainer.scrollHeight
   })
}else{
   loadMessageBtn.remove()
}

//send message code
sendBtn.addEventListener("click", () => {
   var message = input.value;
   var userIdFromUrl = window.location.search;
   urlParams = new URLSearchParams(userIdFromUrl);

   // if msg isnt empty and not messaging yourself
   if (message.trim().length > 0 && urlParams.get("id") != localStorage.getItem("id") && urlParams.get("id") != null && urlParams.get("id") > 0) {
      socket.emit("sent message", message, urlParams.get("id"), localStorage.getItem("id"));
      input.value = "";
      input.focus();
      typingTimeOut()
   }
});

// receive message event 
socket.on("message receive", (msg, reciever, sender, username, date, msgsCountFromDb) => {
   userIdFromUrl = window.location.search;
   urlParams = new URLSearchParams(userIdFromUrl);
   if (sender == urlParams.get("id")) {
      displayMessage("receiver", msg, date, msgsCountFromDb)
   }else if (sender == localStorage.getItem("id")){
      displayMessage("sender", msg, date, msgsCountFromDb)
   } else {
      notification("New message from " + username, msg, sender)
      // alert(username + " has just sent you a message!")
   }
});

// prepare user options to add them as a friend 
socket.emit("prepare user search", localStorage.getItem("id"));
socket.on("user search", (res) => {
   res.forEach(element => {
      document.getElementById("dataList").innerHTML += `<option value="${element.Username}">`;
   });
})

// Change user status (offline/online/typing)
socket.on("changeUserStatus", (status, id) => {
   // i(ID)
   //recieverStatus
   var usersListStatus = document.getElementById("i" + id)
   var recieverStatus = document.getElementById("recieverStatus")
   // change status in sidebar
   usersListStatus.innerText = status;
   // if user2 got online and user1 in in thier chat, change status to online
   if (urlParams.get("id") && urlParams.get("id") == id) {
      recieverStatus.innerText = status
   }
})


// Display friend after you added him
socket.on("friend added successfully", (res) => {
   usersDiv.innerHTML += `
      <div class="col-sm-3 col-xs-3 sideBar-avatar">
         
      </div>
   `//////////////////////////////////////////////////////////
   usersDiv.innerHTML += '<a href="?id=' + res[0].ID + '" id="list' + res[0].ID + '"><div class="row sideBar-body">' +
      '<div class="col-sm-3 col-xs-3 sideBar-avatar">' +
      '<div class="avatar-icon">' +
      '<img src="https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?cs=srgb&dl=pexels-suliman-sallehi-1704488.jpg&fm=jpg">' +
      '</div>' +
      '</div>' +
      '<div class="col-sm-9 col-xs-9 sideBar-main">' +
      '<div class="row">' +
      '<div class="col-sm-8 col-xs-8 sideBar-name">' +
      '<span class="name-meta">' + res[0].Username + '</span>' +
      '</div>' +
      '<div class="col-sm-4 col-xs-4 pull-right sideBar-time">' +
      '<span class="time-meta pull-right" onclick="removeFriend(' + res[0].ID + ');"></span>' + //soon
      '<span class="time-meta pull-right" style="margin-top: -10px;" id="' + res[0].ID + '">' + res[0].Status + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div></a>';
})

// Display friend after he added you
socket.on("friend added you", (res) => {
   usersDiv.innerHTML += '<a href="?id=' + res[0].ID + '"  id="list' + res[0].ID + '"><div class="row sideBar-body">' +
      '<div class="col-sm-3 col-xs-3 sideBar-avatar">' +
      '<div class="avatar-icon">' +
      '<img src="https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?cs=srgb&dl=pexels-suliman-sallehi-1704488.jpg&fm=jpg">' +
      '</div>' +
      '</div>' +
      '<div class="col-sm-9 col-xs-9 sideBar-main">' +
      '<div class="row">' +
      '<div class="col-sm-8 col-xs-8 sideBar-name">' +
      '<span class="name-meta">' + res[0].Username + '</span>' +
      '</div>' +
      '<div class="col-sm-4 col-xs-4 pull-right sideBar-time">' +
      '<span class="time-meta pull-right" onclick="removeFriend(' + res[0].ID + ');"></span>' + // soon
      '<span class="time-meta pull-right" style="margin-top: -10px;" id="' + res[0].ID + '">' + res[0].Status + '</span>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div></a>';
})



// Remove friend from list after you deleted him from db
socket.on("removeFriend succ", (id) => {
   var friendToRemove = document.getElementById("list" + id);
   friendToRemove.remove();
   alert("Your Friend has been removed Successfully")
   location.href = "/"
})


// remove friend from list after he deleted you from db
socket.on("friend deleted you", (id, username) => {
   var removeFromList = document.getElementById("list" + id)
   removeFromList.remove()
   alert(username + " deleted you as a friend!")
   location.href = "/"
})

// Error While deleting friend
socket.on("removeFriend err", () => {
   alert("could not unfriend!")
})

socket.on("message deleted", (msgId, senderName) => {
   if(document.getElementById("msg" + msgId)){
      var deleterName = senderName == localStorage.getItem("username") ? "You" : senderName
      document.getElementById("msg" + msgId).innerHTML = "<em>"+deleterName+" Deleted this Message</em>"
   }
})

socket.on("load more messages now", (res, friendUsername) => {
   console.log(res)
   let newMessageContent
   res.forEach(element => {
      loadedMessagesCount++;
      if (element.from_id == localStorage.getItem("id")){
         displayLoadedMessages(element.ID, "sender", element.date, element.msg, element.deleted)
      }else{
         displayLoadedMessages(element.ID, "receiver", element.date, element.msg, element.deleted)     
      }
      if(element.ID == firstMsgIdOfConversation){
         loadMessageBtn.remove();
      }

   });
})

//////////////////////// FUNCTIONS ////////////////////////

// add Friend Function  
function addFriend() {
   var name = document.getElementById("searchText");
   if (name.value.trim().length > 3) {
      socket.emit("addFriend", name.value, localStorage.getItem("id"));
      name.value = ''
   }
}

// remove friend Function
function removeFriend(id) {
   if (confirm("Are you sure you want to remove your Friend? all messages will be permanently deleted!")) {
      if (id != undefined && id != localStorage.getItem("id")) {
         socket.emit("removeFriend", localStorage.getItem("id"), localStorage.getItem("username"), id)
      }
   }
}

// Display message function when sending/receiving/ chat
function displayMessage(side, msg, date, countFromDb){
   chatContainer.innerHTML += '<div class="row message-body">' +
   '<div class="col-sm-12 message-main-'+side+'">' +
   '<div class="'+side+'">' +
   '<div class="message-text"  id="msg'+countFromDb+'"></div>' +
   '<span class="message-time pull-right">' + date + '</span>';
   if (side == "sender"){
      chatContainer.innerHTML += '<button style="float: right;" type="button" onclick="Delete('+countFromDb+')">Delete</button>';
   }
   chatContainer.innerHTML +=
   '</div>' +
   '</div>' +
   '</div>';
   document.getElementById("msg" + countFromDb).textContent = msg
   scrollToBottom()
}

function displayLoadedMessages(ID, side, date, msg, deleted){
   newMessageContent = `
   <div class="row message-body">
     <div class="col-sm-12 message-main-${side}">
       <div class="${side}" id="${side+ID}">
         <div class="message-text" id="msg${ID}"></div>
         <span class="message-time pull-right">${date}</span>
       </div>
     </div>
   </div>
 ` 

 // Step 3: Insert the new message at the top of the chat container
 chatContainer.insertAdjacentHTML("afterbegin", newMessageContent);
 if(deleted){
    document.getElementById("msg" + ID).innerHTML = `<em>You ${deletedMessage}</em>`
 }else{
    document.getElementById("msg" + ID).textContent = msg
 }
}

// Auto scroll when user at the bottom of the msgs div
function scrollToBottom() {
   const scrollThreshold = 100; // adjust this value to control how close to the bottom the user must be before auto-scrolling
   const scrollDifference = Math.abs(chatContainer.scrollTop + chatContainer.clientHeight - chatContainer.scrollHeight);
   if (scrollDifference <= scrollThreshold) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
   }
   currentHeight = chatContainer.scrollHeight;
   }
   
// Delete message
function Delete(msgId){
   if (confirm(confirmDelete)){
      userIdFromUrl = window.location.search;
      urlParams = new URLSearchParams(userIdFromUrl);
      socket.emit("deleteMsg", msgId, urlParams.get("id"), localStorage.getItem("id"));
      document.getElementById("btn" + msgId).remove()
   }
}

// remove typing indicator
function typingTimeOut(){
   socket.emit("typing", localStorage.getItem("id"), urlParams.get("id"))
}

// Check if load msgs btn is clicked
function loadMoreRequest(){
   if (urlParams.get("id") <= 0 || urlParams.get("id") == undefined) return
   socket.emit("load more messages", localStorage.getItem("id"), urlParams.get("id"), loadedMessagesCount)
}

//////////////////////// EVENTS ////////////////////////

// Resize webpage when width changes
window.addEventListener('resize', () => {
   if (urlParams.get("id") != null && urlParams.get("id") > 0) {
      var x = window.matchMedia("(max-width: 767px)");
      if (x.matches) {
         document.getElementById("sideL").style.display = "none";
      } else {
         document.getElementById("sideL").style.display = "block";
      }
   }
})

// check notification permission when finishing loading
onload = (e) => {
   requestNotificationPermission()
}

// After clicking "Enter" send message
input.addEventListener("keydown", (e) => {
   if (e.key == "Enter" && !e.shiftKey){
      e.preventDefault()
      sendBtn.click()
   }
})

// Typing status event
input.addEventListener("keyup", function (e) {
   // if enter clicked, don't send typing indicator
   if(e.key == "Enter") return
   // send typing indicator
   socket.emit("typing", localStorage.getItem("id"), urlParams.get("id"), "typing..")
   clearTimeout(timeout)
   timeout = setTimeout(typingTimeOut, 2000)
});

window.addEventListener("online", () =>{
   notification("You are back online!","", "")
})

window.addEventListener("offline", ()=>{
   notification("You lost connection!", "", "")
})

function notification(title, body, tag){
   Notification.requestPermission().then(function(permission){
      if(permission == "granted"){
         if(body.length > notificationMaxBody) body = body.substring(0, notificationMaxBody) + "..."
         let notify = new Notification(title, {
            body: body,
            icon: window.location.origin + "/logo",
         })
         if(tag) notify.tag = tag
      }else{
         alert("You got a new message but we can't notify you about them because they are blocked.")
      }
   })
}

async function requestNotificationPermission(){
   try {
         const permission = await Notification.requestPermission();
         if (permission === "denied") {
            alert("Notifications are denied. Please allow notifications to receive alerts about new messages.");
         }
   } catch (error) {
      console.error("Error while requesting notification permission:", error);
   }
}

//Groups (Future Update)

// function makegroup(){
//    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
//    let selectedCheckboxes = [];
      
//    checkboxes.forEach(checkbox => {
//          if(checkbox.checked) {
//             selectedCheckboxes.push(checkbox.value);
//          }
//    });  
//    if (selectedCheckboxes != null || selectedCheckboxes != undefined){
//       var groupName = prompt("Type below the group name..")
//       if(groupName) socket.emit("create group", selectedCheckboxes, groupName, localStorage.getItem("id"), localStorage.getItem("username"))
//    }
// }
