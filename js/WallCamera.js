/**
+ @author Dominik Lazarek (http://dominikLazarek.tumblr.com)
*/

function sign( value )
{
	return value > 0 ? 1 : -1;
}

THREE.WallCamera = function ( parameters ) 
{
	THREE.Camera.call( this, parameters.fov, parameters.aspect, parameters.near, parameters.far );
	
	var dragStarted = false;
	var lastDragStarted = false;
	var dragPosStart = new THREE.Vector2( 0, 0 );
	var dragPos = new THREE.Vector2( 0, 0 );
	var heading = new THREE.Vector3( 0, 0, 0 );
	var posChange = new THREE.Vector3( 0, 0, 0 );
	var headingDecreaseRateZ = 0.995;
	var headingDecreaseRateSide = 0.99;
	var headingDecrease = true;
	var baseOrientation = new THREE.Quaternion();
	var newOrientation = new THREE.Quaternion();
	var newOrientationSet = false;
	var lastNewOrientationSet = false;
	var lastTime = new Date().getTime();
	var orientSpeed = 1000; //1 second interpolation duration for orientation changes
	var decreaseDuration = 2000; //2 seconds before heading is decreased to 0
	var orientT = 0;
	var maxHeading = 40;
	var maxAngleDeg = 60;
	var maxAngleRad = maxAngleDeg / 180 * Math.PI;
	var currMat = this.matrix;
	var orientationDirForward = true;
	var mouseDown = false;
	
	var oldViewMode = 0;
	var viewMode = 0;
	
	var startAutoMovementTime = 2000;
	var currAutoMovementTime = 0.0;
	var bAutoMove = false;
	var constantZ = 100;
	
	var lastMouseDown = false;
	var currDecreaseTime = 0.0;

	
	baseOrientation.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), 0 );
	newOrientation.copy( baseOrientation );
		
	this.bInit = false;
	this.lookSpeed = 1;
	this.movementSpeed = 1;
	this.rollSpeed = 1;
	this.useTarget = false;
	this.heading;
	this.firstPos = this.position.clone();
	
	this.useQuaternion = true;
	this.quaternion.copy( baseOrientation );

	this.domElement = document;
	
	this.update = function( boundsMin, boundsMax ) 
	{
		if( !this.bInit )
			return;
		
		var time = new Date().getTime();
		var t = time - lastTime;
		
		this.heading = heading;
		                                           
		this.position.x -= heading.x + posChange.x * t;
		this.position.y += heading.y + posChange.y * t;
		
		
		if( heading.z + posChange.z > 0 )
		{
			if( this.position.z < 2000 )
				this.position.z += heading.z + posChange.z * t;
		}
		
		else
			this.position.z += heading.z + posChange.z * t;
		                                           
		posChange.x = 0;
		posChange.y = 0;
		posChange.z = 0;
				
		if( headingDecrease )
		{
			if( Math.abs( heading.x ) > 0.01 )
				//heading.x = heading.x - sign( heading.x ) * 0.1;
				heading.x = heading.x * headingDecreaseRateSide;
			
			if( Math.abs( heading.x ) > 0.01 )
				//heading.y = heading.y - sign( heading.y ) * 0.1;
				heading.y = heading.y * headingDecreaseRateSide;
			
			if( Math.abs( heading.z ) > 0.01 )
				//heading.z = heading.z - sign( heading.z ) * headingDecreaseRate;
				heading.z = heading.z * headingDecreaseRateZ;
		}
		
		if( dragStarted )
		{
			this.quaternion.copy( baseOrientation );
			this.quaternion.multiplySelf( newOrientation );
		}
		
		else
		{
			orientT += t;
			
			if( orientT < orientSpeed )
			{
				THREE.Quaternion.slerp( this.quaternion, baseOrientation, this.quaternion, orientT / 2000 );
			}
			
			else
				newOrientation.copy( baseOrientation );
		}
		
		if( !isCameraMoving() && !mouseDown && bAutoMove )
		{
			this.position.z -= constantZ * ( t / 1000 );
		}
		
		else if( !isCameraMoving() && !mouseDown && !bAutoMove )
		{
			currAutoMovementTime += t;
			if( currAutoMovementTime > startAutoMovementTime )
				bAutoMove = true;
		}
		
		lastNewOrientationSet = newOrientationSet;
		lastTime = time;
		lastDragStarted = dragStarted;
		
		this.supr.update.call( this );
	};
	
	function restartAutoMove()
	{
		bAutoMove = false;
		currAutoMovementTime = 0.0;
	}
	
	function changeViewMode( newViewMode )
	{
		if( newViewMode == 2 && viewMode !== 2 )
		{
			viewMode == 2;
			restartAutoMove();
		}
	}
	
	function checkHeading()
	{
		if( heading.x > 0 )
			heading.x = Math.min( maxHeading, heading.x );
		else
			heading.x = Math.max( -maxHeading, heading.x );
			
		if( heading.y > 0 )
			heading.y = Math.min( maxHeading, heading.y );
		else
			heading.y = Math.max( -maxHeading, heading.y );
			
		if( heading.z > 0 )
			heading.z = Math.min( maxHeading, heading.z );
		else
			heading.z = Math.max( -maxHeading, heading.z );
			
		if( Math.abs( heading.x ) < 0.01 )
			heading.x = 0;
			
		if( Math.abs( heading.y ) < 0.01 )
			heading.y = 0;
			
		if( Math.abs( heading.z ) < 0.01 )
			heading.z = 0;
	};
	
	function isCameraMoving()
	{
		return Math.abs( heading.x ) > 0.01 && Math.abs( heading.y ) > 0.01 && Math.abs( heading.z ) > 0.01;
	}
	
	function checkAngle( angle )
	{		
		if( angle > 0 )
		{
			return Math.min( maxAngleRad, angle );
		}
		
		else
		{
			return Math.max( -maxAngleRad, angle );
		}
	};
	
	function rotationXallowed( angle )
	{
		var right = new THREE.Vector3( 1, 0, 0 );
		var currRight = new THREE.Vector3( currMat.flat[ 0 ], currMat.flat[ 1 ], currMat.flat[ 2 ] );
		currRight.normalize();
		
		var currAngleRad = right.dot( currRight );
		return Math.abs( currAngleRad + angle ) < maxAngleRad;
	};
	
	function rotationYallowed( angle )
	{
		var up = new THREE.Vector3( 0, 1, 0 );
		var currUp = new THREE.Vector3( currMat.flat[ 4 ], currMat.flat[ 5 ], currMat.flat[ 6 ] );
		currUp.normalize();
		
		var currAngleRad = up.dot( currUp );
		return Math.abs( currAngleRad + angle ) < maxAngleRad;
	};
	
	
	function onMouseDown( event )
	{
		if( event.button == 0 ) //left mouse button
		{
			dragStarted = true;
			mouseDown = true;
			bAutoMove = false;
			currAutoMovementTime = 0.0;
			
			if( !lastMouseDown )
			{	
				dragPosStart.x = event.clientX;
				dragPosStart.y = event.clientY;
				
				heading.x = 0;
				heading.y = 0;
				heading.z = 0;
			}
			
			newOrientation.copy( baseOrientation );
			
			dragStartTime = new Date().getTime();
			lastMouseDown = true;
		}
	};
	
	function onMouseMove( event )
	{	
		if( dragStarted )
		{
			var dragSpeedX = event.clientX - dragPosStart.x;
			var dragSpeedY = event.clientY - dragPosStart.y;
			
			heading.x += dragSpeedX / 20;
			heading.y += dragSpeedY / 20;		
			
			var orientX = new THREE.Quaternion();
			var orientY = new THREE.Quaternion();
			var angleX = dragSpeedX / 4000;
			var angleY = dragSpeedY / 4000;
			angleX = checkAngle( angleX );
			angleY = checkAngle( angleY );
			
			if( rotationXallowed( angleX ) )
			{
				orientX.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ),  angleX );
			}
			
			if( rotationYallowed( angleY ) )
			{
				orientY.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), angleY );
			}
			
			newOrientationSet = true;
			var orient = new THREE.Quaternion();
			orient.multiply( orientY, orientX );
			newOrientation.multiplySelf( orient );
			
			dragPosStart.x = event.clientX;
			dragPosStart.y = event.clientY;
			
			checkHeading();
		}
	};
	
	function onMouseUp( event )
	{
		if( event.button == 0 )
			mouseDown = false;
		
		if( event.button == 0 && dragStarted )
		{
			dragStarted = false;
			orientT = 0;
			lastMouseDown = false;
		}
	};
	
	function onMouseWheel( event )
	{
		bAutoMove = false;
		currAutoMovementTime = 0.0;
		
		if( sign( event.wheelDeltaY ) != sign( heading.z ) )
			heading.z = 0;
			
		heading.z -= event.wheelDeltaY / 10;
		checkHeading();
	};

	
	this.domElement.addEventListener( 'mousemove', onMouseMove, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', onMouseUp, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
};

THREE.WallCamera.prototype = new THREE.Camera();
THREE.WallCamera.prototype.constructor = THREE.WallCamera;
THREE.WallCamera.prototype.supr = THREE.Camera.prototype;
