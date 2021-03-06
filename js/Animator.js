/**
 * @author Dominik Lazarek / http:dominikLazarek.tumblr.com
 * 
 * animationInfo = {
 *  interpolation: <string> { "linear" | "smoothstep" | "sine" | "weighted average" }
 *	scaling : <float>	
 *	dataType : <sting> { "Vector3" | "Vector2" | "Quaternion" | "float" }
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
	return  ( t * t * ( 3.0 - 2.0 * t ) );
};

function smoothstep2( t )
{
	return smoothstep( smoothstep( t ) );
};

function smoothstep3( t )
{
	return smoothstep( smoothstep( smoothstep( t ) ) );
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
	this.bInit = false;
	this.currAnimID = 0;
	this.bAcceptFocus = true;
	
	this.animations = [];
	
	this.AddAnimation = function( animationInfo )
	{
		var anim = {};
		
		anim.interpolationType 	= animationInfo.interpolation	!= undefined ? animationInfo.interoplation : "linear";
		anim.animator = this;
		
		if( animationInfo.customInterpolator )
			anim.interpolate = animationInfo.customInterpolator;
		
		else if( animationInfo.interpolationType === "linear" )
			anim.interpolate = linear;
			
		else if( animationInfo.interpolationType === "smoothstep" )
			anim.interpolate = smoothstep;
			
		else if( animationInfo.interpolationType === "smoothstep2" )
			anim.interpolate = smoothstep2;
			
		else if( animationInfo.interpolationType === "smoothstep3" )
			anim.interpolate = smoothstep3;
			
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
		
		if( anim.dataType != "float" )
		{
			anim.startValue.copy( animationInfo.startValue );
			anim.endValue.copy( animationInfo.endValue );
		}
		
		else
		{
			anim.startValue = animationInfo.startValue;
			anim.endValue = animationInfo.endValue;
		}
		
		anim.onFinish = animationInfo.onFinish;
		
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
		if( !this.bInit )
			return;
		
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
			
			if( t > 1.0 )
			{
				if( anim.repetition == "oneShot" )
				{
					if( anim.onFinish ) 
						anim.onFinish();
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
						if( anim.onFinish ) 
							anim.onFinish();
						
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
		    	THREE.Quaternion.slerp( anim.startValue, anim.endValue, anim.animValue, step );
		    }	
		
			else if( anim.dataType == "float" )
			{
				if( anim.animValue.value )
					anim.animValue.value = anim.startValue * ( 1 - step ) + anim.endValue * step;
			}
		}
		
		//delete trash
		for( var i = 0; i < trash.length; ++i )
		{
			var anim = trash[ i ];
			
			if( anim.dataType == "Vector3" )
		    {
		    	anim.animValue.x = anim.endValue.x;
		    	anim.animValue.y = anim.endValue.y;
		    	anim.animValue.z = anim.endValue.z;
	    	}
            
		    else if( anim.dataType == "Vector2" )
		    {
		    	anim.animValue.x = anim.endValue.x;
				anim.animValue.y = anim.endValue.y;
		    }
            
		    else if( anim.dataType == "Quaternion" )
		    {
				//anim.animValue.copy( anim.endValue );
		    }	
		
			else if( anim.dataType == "float" )
			{
				anim.animValue.value = anim.endValue;
			}
			
			var idx = this.animations.indexOf( trash[ i ] );
			this.animations.splice( idx, idx );
		}
		
		this.lastTime = time;
	};
}

