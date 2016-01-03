jQuery(function(){

	// This demo depends on the canvas element
	if(!('getContext' in document.createElement('canvas'))){
		alert('Sorry, it looks like your browser does not support canvas!');
		return false;
	}     	
	
	// The URL of your web server (the port is set in app.js)
	//var url = 'http://localhost:3000';
    var url = window.location.hostname;
	var stanza = '';
	if (location.href.indexOf('#')!= -1){
stanza  = location.href.substring(location.href.indexOf('#')+1);
 }
	
	var positionx ='23';
	var positiony='0';
	
	var doc = jQuery(document),
		canvas = jQuery('#paper'),
		canvas1 = jQuery('#paper1'),
	instructions = jQuery('#instructions');
var color = '#000000';
	// A flag for drawing activity
	var drawing = false;
	var clients = {};
	var cursors = {};
	
	//  funzione richiesta di nick name   
	
	var username = '';
				

if(!username)
{
	username = prompt("Hey there, insert your nick name, please", "");
}

username = username.substr(0,20);	
var socket = io.connect(url); 

var ctx = canvas[0].getContext('2d');	
var ctx1 = canvas1[0].getContext('2d');	
var spessore = jQuery('#spessore').value;
var colorem;
    // Force canvas to dynamically change its size to the same width/height
    // as the browser window.
    canvas[0].width = document.body.clientWidth;
    canvas[0].height = document.body.clientHeight;

    // ctx setup
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth =  2;
 ctx.font = "20px Tahoma";

	// Generate an unique ID
	var id = Math.round(jQuery.now()*Math.random());
if (username =='')  {username = id }
//url.substring(url.indexOf('#')+1);

if (stanza.length > 2) {
socket.emit('setuproom',{
				'room': stanza,				
				'id': id,
				'usernamerem' : username
			});
} else {
socket.emit('setuproom',{
				'room': 'public',				
				'id': id,
				'usernamerem' : username
			});      
}

socket.on('setuproomserKO', function (data) {
stanza = data.room;	
document.getElementById('audiocall').disabled = false;
document.getElementById('videocall').disabled = false;
alert	(data.inforoom); 	
});
 
  socket.on('setuproomser', function (data) {
stanza = data.room;	
 jQuery('<div class="testochatser"><span>FROM SERVER:</span> '+ data.inforoom + data.listautenti +'</div>').appendTo('#testichat');
 document.getElementById('frecce').style.backgroundColor ='#ffff00';
 document.getElementById('audiocall').disabled = false;
 document.getElementById('videocall').disabled = false;
	});


jQuery('#scrivi').keypress(function(e){
var code = e.keyCode;
if (code == '13') {
  if (document.getElementById('scrivi').value.length > 0 ) {	
 
 socket.emit('chat',{
				'testochat': document.getElementById('scrivi').value,				
				'id': id,
				'usernamerem' : username,
				'room' : stanza
			});
 jQuery('<div class="testochat"><span>ME:</span> ' + document.getElementById('scrivi').value +'</div>').appendTo('#testichat');
  document.getElementById('scrivi').value ='';

var objDiv = document.getElementById("testichat");
objDiv.scrollTop = objDiv.scrollHeight;

}}
});

$('#file-input').change(function(e) {
        var file = e.target.files[0],
            imageType = /image.*/;
    if (!file.type.match(imageType))
            return;

        var reader = new FileReader();
        reader.onload = fileOnload;
    reader.readAsDataURL(file);  
		     
    });	

/*
jQuery('#salvasulserver').click(function (){
var dataserver = canvas[0].toDataURL();

socket.emit('salvasulserver',{
				'id': id,
				'dataserver': dataserver,
				'orario':  jQuery.now()
			});										  
});

*/

jQuery('#vedomonitor').click(function (){
if(document.getElementById('monitorcam').style.display == 'none')   { 
document.getElementById("monitorcam").style.display = 'block';
document.getElementById('vedomonitor').innerHTML = ' Hide webcam monitor ';
} else  {
document.getElementById('monitorcam').style.display = 'none';	
document.getElementById('vedomonitor').innerHTML = ' Show webcam monitor ';
}										  
});

jQuery('#paper').dblclick(function (e){
positionx = e.pageX;
positiony= e.pageY;
if (document.getElementById('scrivi').value.length > 1 ) {
ctx.fillStyle = $('#minicolore').minicolors('rgbaString');
ctx.font =  document.getElementById('fontsize').value +"px Tahoma";
ctx.fillText(document.getElementById('scrivi').value, e.pageX, e.pageY); 

socket.emit('doppioclick',{
				'x': e.pageX,
				'y': e.pageY,
				'scrivi': document.getElementById('scrivi').value,				
				'color': $('#minicolore').minicolors('rgbaString'),
				'id': id,
				'spessremo' : document.getElementById('spessore').value,
				'fontsizerem': document.getElementById('fontsize').value,
				'room' : stanza
			});

document.getElementById('scrivi').value ='';
}	
									
});	
jQuery('#salvafoto').click(function (){
var dataURL = canvas[0].toDataURL();
document.getElementById("canvasimg").src = dataURL;  
window.open(document.getElementById("canvasimg").src, "toDataURL() image", "width=1000, height=1000");									
										  
});

 jQuery('#cancellalavagna').click(function (){
ctx.clearRect(0, 0, canvas[0].width, canvas[0].height);													  
});
 
  
jQuery('#audiocall').click(function (){
window.open('http://www.nuovoweb.eu/webrtc/soloaudio.html#' + stanza, 'WEBRTC VOICE CALL','width=700,height=400');									  
});

jQuery('#videocall').click(function (){
window.open('http://www.nuovoweb.eu/webrtc/#' + stanza, 'WEBRTC VIDEO/AUDIO CALL','width=800,height=400');								  
});

  
  jQuery('#suonacamp').click(function (){

socket.emit('suonacamp',{
				'id': id,
				'room' : stanza
			});

});  
 
 jQuery('#inforoom').click(function (){
alert('TO CREATE YOUR OWN PRIVATE ROOM, TYPE AT THE END OF THE INTERNET ADDRESS, A SEQUENCE OF CHARACTERS OR NUMBERS PRECEDED BY THE CHARACTER # FOR EXAMPLE:\n\r http:\/\/vrobbi-nodedrawing.herokuapp.com\/#myroom123  WHERE \'myroom123\' WILL BE YOUR PRIVATE ROOM\n\r REMEMBER TO WRITE ONLY CHARACTERS OF TYPE LETTERS AND/OR NUMBERS THEN SEND THIS ADDRESS TO YOUR FRIENDS THAT YOU LIKE TO SHARE PRIVATELY WITH THE USE OF THIS BOARD');						  
}); 
 
  socket.on('camperaltriser', function (data) {
var camdaclient = new Image();
camdaclient.src = data.camperaltridati;
camdaclient.onload = function() {
//	imgdaclient.src = data.fileperaltri;
ctx.drawImage(camdaclient,data.positionx,data.positiony,320,240);
}
});	
 
 
 socket.on('fileperaltriser', function (data) {
 
var imgdaclient = new Image();
imgdaclient.src = data.fileperaltri;
imgdaclient.onload = function() {
//	imgdaclient.src = data.fileperaltri;
ctx.drawImage(imgdaclient, data.positionx, data.positiony);
}
});	
	
 socket.on('doppioclickser', function (data) {
 ctx.fillStyle = data.color;
 ctx.font = data.fontsizerem + "px Tahoma";
	ctx.fillText(data.scrivi, data.x, data.y); 
          
	});	
 
  socket.on('chatser', function (data) {
 
	//alert (data.testochat);
jQuery('<div class="testochat"><span>' + data.usernamerem +':</span> '+ data.testochat +'</div>').appendTo('#testichat');         
document.getElementById('frecce').style.backgroundColor ='#ffff00';
var objDiv1 = document.getElementById("testichat");
objDiv1.scrollTop = objDiv1.scrollHeight;
	});
  
  socket.on('suonacampser', function (data) {
 if (document.getElementById('faisuonare').checked) {
  //    var thissound=document.getElementById("audio1");
document.getElementById("audio1").play();												  
			 }	
		});
  
  socket.on('listautentiser', function (data) {
jQuery('<div class="testochatser"><span>FROM SERVER:</span> '+ data.listautenti +'</div>').appendTo('#testichat');
document.getElementById('frecce').style.backgroundColor ='#ffff00'; 
		});
 	
	socket.on('moving', function (data) {
		
		if(! (data.id in clients)){
			// a new user has come online. create a cursor for them
			cursors[data.id] = jQuery('<div class="cursor"><div class="identif">'+ data.usernamerem +'</div>').appendTo('#cursors');
		}
	// Move the mouse pointer
		cursors[data.id].css({
			'left' : data.x,
			'top' : data.y
		});
			
		// Is the user drawing?
		if(data.drawing && clients[data.id]){
			
			// Draw a line on the canvas. clients[data.id] holds
			// the previous position of this user's mouse pointer

            ctx.strokeStyle = data.color;
			drawLinerem(clients[data.id].x, clients[data.id].y, data.x, data.y,data.spessremo,data.color);
		}
		
		// Saving the current client state
		clients[data.id] = data;
		clients[data.id].updated = jQuery.now();
	});

	var prev = {};

 // canvas.addEventListener('touchstart', sketchpad_touchStart, false);
//            canvas.addEventListener('touchend', sketchpad_touchEnd, false);
     //       canvas.addEventListener('touchmove', sketchpad_touchMove, false);
		  
   document.addEventListener("change", cambiaspessore, true);
  function cambiaspessore () {
	   ctx.lineWidth = document.getElementById('spessore').value;	   
}  
      
	canvas.on('mousedown', function(e){
		e.preventDefault();
		drawing = true;
		prev.x = e.pageX;
		prev.y = e.pageY;
		
		// Hide the instructions
		instructions.fadeOut();
	});
	
	doc.bind('mouseup mouseleave', function(){
 
		drawing = false;
	});

	var lastEmit = jQuery.now();

	doc.on('mousemove', function(e){
								 
		if(jQuery.now() - lastEmit > 30){
			
//	document.getElementById('risultato').innerHTML = $('#minicolore').minicolors('rgbaString');
			
			socket.emit('mousemove',{
				'x': e.pageX,
				'y': e.pageY,
				'drawing': drawing,
                'color': $('#minicolore').minicolors('rgbaString'),
				'id': id,
				'usernamerem' : username,
				'spessremo' : document.getElementById('spessore').value,
				'room' : stanza
			});
			lastEmit = jQuery.now();
		}
		// Draw a line for the current user's movement, as it is
		// not received in the socket.on('moving') event above
		
		if(drawing){

       //     ctx.strokeStyle = document.getElementById('minicolore').value;
			drawLine(prev.x, prev.y, e.pageX, e.pageY);
			prev.x = e.pageX;
			prev.y = e.pageY;
		}
	});
	
	// Remove inactive clients after 10 seconds of inactivity
    setInterval(function(){
        var totalOnline = 0;
        for(var ident in clients){
            if(jQuery.now() - clients[ident].updated > 16000){

                // Last update was more than 10 seconds ago.
                // This user has probably closed the page

                cursors[ident].remove();
                delete clients[ident];
                delete cursors[ident];
            }
            else {
			 totalOnline++;			
        }}
        jQuery('#onlineCounter').html('Users connected: '+totalOnline);
    },16000);
//// end setinterval function ****************************
	function drawLine(fromx, fromy, tox, toy){
		ctx.strokeStyle = $('#minicolore').minicolors('rgbaString');
		ctx.lineWidth = document.getElementById('spessore').value;	
        ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}
	
	function drawLinerem(fromx, fromy, tox, toy,spessore,colorem){
		ctx.strokeStyle = colorem;
       ctx.lineWidth = spessore;	
        ctx.beginPath();
		ctx.moveTo(fromx, fromy);
		ctx.lineTo(tox, toy);
		ctx.stroke();
	}

function fileOnload(e) {
        var img = $('<img>', { src: e.target.result });
		// alert(img.src.value);
   //     var canvas1 = $('#paper')[0];
      //     var context1 = canvas1.getContext('2d');
        img.load(function() {
            ctx.drawImage(this, positionx, positiony);
			socket.emit('fileperaltri',{
				'id': id,
				'positionx': positionx,
				'positiony': positiony,
				'fileperaltri':  this.src,
				'room': stanza
				});	
        });
    }
	
(function() {
var idtempo;
  var streaming = false,
      video        = document.getElementById('video'),
  	paper1  = document.getElementById('paper1'),
      startbutton  = document.getElementById('catturacam'),
      width = 320,
      height = 240;

  navigator.getMedia = ( navigator.getUserMedia || 
                         navigator.webkitGetUserMedia ||
                         navigator.mozGetUserMedia ||
                         navigator.msGetUserMedia);

  navigator.getMedia(
    { 
      video: true, 
      audio: false 
    },
    function(stream) {
      if (navigator.mozGetUserMedia) { 
        video.mozSrcObject = stream;
      } else {
        var vendorURL = window.URL || window.webkitURL;
        video.src = vendorURL ? vendorURL.createObjectURL(stream) : stream;
      }
      video.play();
    },
    function(err) {
      console.log("An error occured! " + err);
    }
  );

  video.addEventListener('canplay', function(ev){
    if (!streaming) {
      height = video.videoHeight / (video.videoWidth/width);
      video.setAttribute('width', 320);
      video.setAttribute('height', 240);
//	  video.setAttribute('maxFrameRate',5);
 //     canvas.setAttribute('width', width);
   //   canvas.setAttribute('height', height);
      streaming = true;
    }
		  
  }, false);

  function takepicture(e) {
 ctx.drawImage(video, positionx, positiony,320,240);
ctx1.drawImage(video,0,0,320,240);
var datacam = paper1.toDataURL('image/png');
// paper1 e ctx1 servono per prelevare solo i dati della webcam e inviarli al server per gli altri	
socket.emit('camperaltri',{
				'id': id,
				'positionx': positionx,
				'positiony': positiony,
				'camperaltridati':  datacam,
				'room' : stanza
				});			 
  }

  startbutton.addEventListener('click', function(ev){
     takepicture();
    ev.preventDefault();
  }, false);
  
  
document.getElementById('autocamabi').addEventListener('change', function(ev){
																		  
if (document.getElementById('autocamabi').checked) {	
document.getElementById('tempocam').disabled = true;
idtempo = setInterval(function() {
takepicture();	
},document.getElementById('tempocam').value);
}else{
clearInterval(idtempo);
document.getElementById('tempocam').disabled = false;
}   
  }, false);

})();

});

	