/*
	@author: Vikesh Khanna
	@date : 22nd December 2011
*/

var player;
var main_div;
var base_bar;
var div_pointers;
var new_poiner;
var disable_extension;
var bar_height = 5;
var pointer_arrow_gap = 13;
var overlay_bar;
var death_mode = false;
var extension_disabled = false;

var callout = "url('" + chrome.extension.getURL("images/callout.png") + "')";
var callout_death = "url('" + chrome.extension.getURL("images/callout_death.png") + "')";
var callout_loop = "url('" + chrome.extension.getURL("images/callout_loop.png") + "')";

/* loop variables */
var loop_t1 = null;
var loop_t2 = null;

function Pointer()
{
	this.seekTime = 0;
	this.element = document.createElement('div');
	this.element.className = "pointer";
	this.element.style.backgroundImage = callout;
	var span = document.createElement('span');
	span.innerHTML = getReadableTime(this.seekTime);
	this.element.appendChild(span);
};

function getReadableTime(seekTime)
{
	if(seekTime < 0)
		return "Ouch";
	else if(seekTime > player.getDuration())
		return "SOS!";
		
	var min = Math.floor(Number(seekTime)/60);
	var sec = Math.floor(Number(seekTime)%60); 
	
	if(sec < 9)
		sec = "0" + sec;
		
	return  min + ":" + sec;
}

function getSeekTime(readableTime)
{

}

$(document).ready(function(){

		console.log("<pointers> document is ready");
		
		try
		{
			if(window.localStorage['extension_disabled'] == "1")
					extension_disabled = true;
		}
		catch(err)
		{
			console.log(err);
		}
	
		$(document).keydown(function(event){ 
						if(event.keyCode == '16')  //shift key for moving
						{
							$(".pointer").draggable("enable");
						}
						else if(event.keyCode=='17') //ctrl key for deletion
						{
							death_mode = true;
							$(".pointer").css('backgroundImage', callout_death);
						}
						else if(event.keyCode == '18') //alt key for loop
						{
							loop_mode = true;
						}	
					});
					
				$(document).keyup(function(){ 
						$(".pointer").draggable("disable");
						$(".pointer").css('backgroundImage', callout);
						
						$("#loop_pointer_1").css("backgroundImage", callout_loop);
						$("#loop_pointer_2").css("backgroundImage", callout_loop);
						
						loop_mode = false;
						death_mode = false;
					});
					
		if(!extension_disabled) 
			enable_extension();
		else 
			disable_extension();
});

function generateNewPointer()
{
	console.log("<pointers> Generating new pointer");
	var pointer = new Pointer();
	div_pointers.appendChild(pointer.element);
	setReadableTime(pointer.element);
	
	//div_pointers.insertBefore(pointer.element, div_pointers.firstChild);
	
	$(function() {
		$(pointer.element).draggable( {axis: "x", drag: handleDrag, disabled : true, addClasses: false});
		$(pointer.element).mouseover(function(){ this.style.cursor = "pointer"; } );	
		
		$(pointer.element).click( function(){
						/* seek code goes here */
						
						//alert("You Clicked");
						if(death_mode)
						{
							console.log("<pointers> deleting a node");
							this.parentNode.removeChild(this);
							
							//handle loopers carefully
							if(this.id == 'loop_pointer_1' )
								loop_t1 = null;
							else if(this.id == 'loop_pointer_2')
								loop_t2 = null;
							
							//pointers may be misplaced after deletion
							var pointers = document.getElementsByClassName('pointer');
							
							for(var i = 0; i < pointers.length; i++)
								setReadableTime(pointers[i]);
						}
						else if(loop_mode)
						{
							var seekTime = getSeekTimeFromObject(this);
							
							if(loop_t1 == null && loop_t2 == null) //none of them is set
							{
								console.log("<pointers> setting loop - no pointer set");
								loop_t1 = seekTime;
								
								$(this).css('backgroundImage', callout_loop);
								this.id = 'loop_pointer_1';
							}
							else
							{
								//toggle case
								if(this.id == 'loop_pointer_1' || this.id == 'loop_pointer_2')
								{
									console.log("<pointers> setting loop - toggle");
									
									if(this.id == 'loop_pointer_1')
										loop_t1 = null;
									else if(this.id == 'loop_pointer_2')
										loop_t2 = null;
									
									$(this).css('backgroundImage', callout);
									this.id = " ";
								}
								else if(loop_t1 == null || loop_t2 == null) //only one of them is set
								{
									console.log("<pointers> setting loop - only one pointer set");
									
									if(loop_t1 == null)
									{
										loop_t1 = seekTime;
										this.id = 'loop_pointer_1';
									}
									else if(loop_t2 == null)
									{
										loop_t2 = seekTime;
										this.id = 'loop_pointer_2';
									}
									
									$(this).css('backgroundImage', callout_loop);
								}
							}
							
							console.log("<pointers> New Loop Timers set : (" + loop_t1 + "," + loop_t2 + ")");
							//alert(loop_t1 + " " + loop_t2);
						}
						else
						{
							player.seekTo(getSeekTimeFromObject(this));
						}
					});				
	});
}
		
function init_ui()
{
	console.log('<pointers> init ui calld');
	
	//main_div may already exist or be null
	try {
		main_div.parentNode.removeChild(main_div);
	}
	catch(err)
	{
		console.log(err);
	}
	
	main_div = document.createElement('div');
	main_div.id = "main_div";
	
	div_pointers = document.createElement('pointers');
	
	base_bar = document.createElement('div');
	base_bar.style.height = bar_height + "px";
	base_bar.style.backgroundColor = "#a8a8a8";
	base_bar.id = "base_bar";
	
	overlay_bar = document.createElement('div');
	overlay_bar.style.height = bar_height + "px";
	overlay_bar.style.position = "relative";
	overlay_bar.style.top = String(-1 * bar_height) + "px"; 
	overlay_bar.style.zIndex = "2";
	overlay_bar.style.backgroundColor = "#cc1111";
	overlay_bar.id = "overlay_bar";
	
	new_pointer = document.createElement('button');
	new_pointer.type= "button";
	new_pointer.className = "start yt-uix-tooltip-reverse yt-uix-button yt-uix-button yt-uix-tooltip";
	new_pointer.role = "button";
	new_pointer.title = "Gimme new pointer";
	new_pointer.style.margin = "10px 0px 10px 0px";
	new_pointer.innerHTML = "New Pointer";
	new_pointer.onclick = function(){ generateNewPointer(); }
	
	btn_disable_extension = document.createElement('button');
	btn_disable_extension.type= "button";
	btn_disable_extension.className = "start yt-uix-tooltip-reverse yt-uix-button yt-uix-button yt-uix-tooltip";
	btn_disable_extension.role = "button";
	btn_disable_extension.title = "Disable Extension";
	btn_disable_extension.style.margin = "10px 0px 10px 0px";
	btn_disable_extension.innerHTML = "Disable Extension";
	btn_disable_extension.onclick = function(){ disable_extension(); }
	btn_disable_extension.style.marginLeft = "10px";
	
	var div_info = document.createElement('div');
	div_info.style.margins = "5px 0px 0px 4px";
	div_info.style.paddingBottom = "5px";
	
	div_info.innerHTML = "Hold <b>Shift</b> to drag pointers. <b>Ctrl</b> + Click to delete pointers. <b>Alt</b> + Click to set / reset loopers.";
	
	main_div.appendChild(div_pointers);
	main_div.appendChild(base_bar);
	main_div.appendChild(overlay_bar);
	main_div.appendChild(new_pointer);
	main_div.appendChild(btn_disable_extension);
	main_div.appendChild(div_info);
	
	var watch_panel = document.getElementById('watch-panel');
	watch_panel.insertBefore(main_div, watch_panel.firstChild);
}

function init()
{
	console.log("<pointers> init called");

	try
	{
		console.log("<pointers> player ready");
		player = document.getElementById('movie_player');
		player.getVideoBytesLoaded()/player.getVideoBytesTotal();
		set_deferred_ui();
	}
	catch(err)
	{
		console.log("<pointers> error loading player : " + err);
		setTimeout(init, 1000); //retry for player
		return;
	}

	console.log("<pointers> init successful");
}

function set_deferred_ui()
{
	try
	{
		document.getElementById('base_bar').style.width = player.width ;
		mainTimer();
	}
	catch(err)
	{
		console.log(err);
	}
}

function enable_extension()
{
	console.log("<pointers> enabling extension");
	init_ui();
	init();
	window.localStorage['extension_disabled'] = "0";
	extension_disabled = false;
}

function disable_extension()
{
	console.log("<pointers> disabling extension");
	
	//main_div may be null
	try {
		main_div.parentNode.removeChild(main_div);
	}
	catch(err)
	{
		console.log(err);
	}
	
	var watch_panel = document.getElementById('watch-panel');
	
	main_div = document.createElement('div');
	main_div.id = "main_div";
	
	var enable_link = document.createElement('a');
	enable_link.innerHTML = "You have disabled Pointers! Sacrilege! Enable it again!" 
	enable_link.onclick = function() { enable_extension(); } 
	main_div.appendChild(enable_link);
	
	watch_panel.insertBefore(main_div, watch_panel.firstChild);
	
	window.localStorage['extension_disabled'] = "1";
	extension_disabled = true;
}

function getSeekTimeFromObject(obj)
{
	return ($(obj).position().left + pointer_arrow_gap - $("#base_bar").position().left )/player.width * player.getDuration()
}

function handleDrag(event, ui)
{	
	setReadableTime(this);
	var seekTime = getSeekTimeFromObject(this) ;
	
	if(this.id == 'loop_pointer_1')
		loop_t1 = seekTime;
	else if(this.id == 'loop_pointer_2')
		loop_t2 = seekTime;
	
	if(seekTime > player.getDuration() || seekTime < 0)
	{
		this.style.backgroundImage = callout_death;
	}
	else
	{
		this.style.backgroundImage = callout;
	}
}

function setReadableTime(pointer)
{
	pointer.firstChild.innerHTML = getReadableTime(getSeekTimeFromObject(pointer));
}

function mainTimer()
{
	var currentTime = player.getCurrentTime();
	
	//overlaybar
	overlay_bar.style.width = Math.ceil(player.width * currentTime/player.getDuration()) + "px";
	
	//handleLoop
	var delta = 1; //in seconds
	
	if(loop_t1 != null && loop_t2 != null)
	{
		var loop_large = (loop_t1 > loop_t2 ? loop_t1 : loop_t2);
		var loop_small = (loop_t1 < loop_t2 ? loop_t1 : loop_t2);
		
		if(currentTime >= loop_large && currentTime <= loop_large + delta)
			player.seekTo(loop_small);
	}	
	
	if(!extension_disabled)
		setTimeout(mainTimer, 500);
	
}

