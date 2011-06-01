/**
 * @author Dominik Lazarek / http:dominikLazarek.tumblr.com
 * 
 * animationInfo = {
 *  interpolation: <string> { "linear" | "smoothstep" | "sine" | "weighted average" }
 *	scaling : <float>	
 *	dataType : <sting> { "Vector3" | "Vector2" | "Quaternion" }
 *  startValue : <Object> //either of the objects listed in data types
 *  endValue : <Object> //either of the objects listed in data types
 *  animValue : <object>  //either of the objects listed in data types
 *	duration : <float>
 *  customInterpolator : <function> //if set, uses this function as interpolator instead of one of the "interpolation" types
 *  repetition : <string> { "oneShot" | "loop" | "fourthAndBack" }
 *	callback : <function> //is called when animation is finished ( for "oneShot" and "fourthAndBack" only! )
 * }
 */

function linear( t )
{
	return t;
};

function smoothstep( t )
{
	return ( t * t * ( 3 - 2 * t ) );
};

function sine( t )
{
	return Math.sin( t * ( Math.PI / 2 ) );
};

function weightedAverage( t )
{
	var scale = 10;
	return ( ( t * ( scale - 1 ) ) + 1 ) / scale;
};

function Animator()
{
	this.firstUpdate = true;
	this.lastTime = new Date().getTime();
	
	this.currAnimID = 0;
	
	this.animations = [];
	
	this.AddAnimation = function( animationInfo )
	{
		var anim = {};
		
		anim.interpolationType 	= animationInfo.interpolation	!= undefined ? animationInfo.interoplation : "linear";
		
		if( animationInfo.customInterpolator )
			anim.interpolate = animationInfo.customInterpolator;
		
		else if( animationInfo.interpolationType === "linear" )
			anim.interpolate = linear;
			
		else if( animationInfo.interpolationType === "smoothstep" )
			anim.interpolate = smoothstep;
			
		else if( animationInfo.interpolationType === "sine" )
			anim.interpolate = sine;
			
		else if( animationInfo.interpolationType === "weighted average" )
			anim.interpolate = weightedAverage;
		
		anim.scaling 		= animationInfo.scaling 	  	!= undefined ? animationInfo.scaling : 1;
		anim.dataType		= animationInfo.dataType		!= undefined ? animationInfo.dataType : "Vector3";
		
		if( anim.dataType == "Vector3" )
		{
			anim.startValue = new THREE.Vector3();
			anim.endValue = new THREE.Vector3();
		}
		
		else if( anim.dataType == "Vector2" )
		{
			anim.startValue = new THREE.Vector2();
			anim.endValue = new THREE.Vector2();
		}
		
		else if( anim.dataType == "Quaternion" )
		{
			anim.startValue = new THREE.Quaternion();
			anim.endValue = new THREE.Quaternion();
		}
		
		anim.startValue.copy( animationInfo.startValue );
		anim.endValue.copy( animationInfo.endValue );
		anim.callback = animationInfo.callback;
		
		anim.animValue 		= animationInfo.animValue;
		anim.duration 		= animationInfo.duration		!= undefined ? animationInfo.duration : 1000;
		anim.ID				= this.currAnimID;
		anim.currT			= 0;
		
		anim.repetition		= animationInfo.repetition		!= undefined ? animationInfo.repetition : "oneShot";
		
		this.animations.push( anim );
		return this.currAnimID++;
	};
	
	this.RemoveAnimation = function( id )
	{
		var index = -1;
		
		for( var i = 0; i < this.animations.length; ++i )
		{
			if( this.animations[ i ].ID == id )
			{
				index = i;
				break;
			}
		}
		
		if( index > 0 )
		{
			this.animations.splice( index, index );
			return true;
		}
		
		return false;
	};
	
	this.animate = function()
	{
		if( this.firstUpdate )
		{
			this.lastTime = new Date().getTime();
			this.firstUpdate = false;
		}
			
		var time = new Date().getTime();
		var t_delta = time - this.lastTime;
		var trash = [];
		
		for( var i = 0; i < this.animations.length; ++i )
		{
			var anim = this.animations[ i ];
			anim.currT += t_delta;
			var t = anim.currT / anim.duration;
			
			if( t > 1 )
			{
				if( anim.repetition == "oneShot" )
				{
					if( anim.callback ) anim.callback();
					trash.push( anim );
					continue;
				}
				
				else if( anim.repetition == "loop" )
				{
					anim.currT = 0;
				}
									
				else if( anim.repetition == "fourthAndBackLoop" )
				{
					t = 2 - t;
					if( t < 0 )
						anim.currT = 0;
				}
				
				else if( anim.repetition == "fourthAndBack" )
				{
					t = 2 - t;
					if( t < 0 )
					{
						if( anim.callback )
							anim.callback();
						trash.push( anim );
						continue;
					}
						
				}
			}
			
			var step = anim.interpolate( t );
			
		    if( anim.dataType == "Vector3" )
		    {
		    	anim.animValue.x = anim.startValue.x * ( 1 - step ) + anim.endValue.x * step;
		    	anim.animValue.y = anim.startValue.y * ( 1 - step ) + anim.endValue.y * step;
		    	anim.animValue.z = anim.startValue.z * ( 1 - step ) + anim.endValue.z * step;
	    	}
            
		    else if( anim.dataType == "Vector2" )
		    {
		    	anim.animValue.x = anim.startValue.x * ( 1 - step ) + anim.endValue.x * step;
				anim.animValue.y = anim.startValue.y * ( 1 - step ) + anim.endValue.y * step;
		    }
            
		    else if( anim.dataType == "Quaternion" )
		    {
				var newQuad = new THREE.Quaternion();
		    	THREE.Quaternion.slerp( anim.startValue, anim.endValue, newQuad, step );
		
				anim.animValue.copy( newQuad );
		    }	
		}
		
		//delete trash
		for( var i = 0; i < trash.length; ++i )
		{
			var idx = this.animations.indexOf( trash[ i ] );
			this.animations.splice( idx, idx );
		}
		
		this.lastTime = time;
	};
}

