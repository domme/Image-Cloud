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
	var dragPosStart = new THREE.Vector2( 0, 0 );
	var dragPos = new THREE.Vector2( 0, 0 );
	var dragStartTime = new Date().getTime();
	var heading = new THREE.Vector3( 0, 0, 0 );
	var headingDecreaseRate = 0.1;
	var headingDecrease = true;
	var baseOrientation = new THREE.Quaternion();
	var newOrientation = new THREE.Quaternion();
	var newOrientationSet = false;
	var lastNewOrientationSet = false;
	var newOrientationStartTime = new Date().getTime();
	var lastTime = new Date().getTime();
	var orientSpeed = 1000; //1 second interpolation duration for orientation changes
	var orientT = 0;
	var maxHeading = 20;
	var maxAngleDeg = 45;
	var maxAngleRad = maxAngleDeg / 180 * Math.PI;
	var currMat = this.matrix;
	
	var sineHalfMaxAngle = Math.sin( maxAngleRad / 2 );
	
	baseOrientation.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), 0 );
	newOrientation.copy( baseOrientation );
		
	
	this.lookSpeed = 1;
	this.movementSpeed = 1;
	this.rollSpeed = 1;
	this.useTarget = false;
	
	this.useQuaternion = true;
	this.quaternion.copy( baseOrientation );

	this.domElement = document;
	
	this.update = function() 
	{
		var time = new Date().getTime();
		var t = time - lastTime;
		
		
		this.position.x -= heading.x;
		this.position.y += heading.y;
		this.position.z += heading.z;
		
		if( headingDecrease )
		{
			if( Math.abs( heading.x ) > 0.1 )
				heading.x = heading.x - sign( heading.x ) * headingDecreaseRate;
			
			if( Math.abs( heading.x ) > 0.1 )
				heading.y = heading.y - sign( heading.y ) * headingDecreaseRate;
			
			if( Math.abs( heading.z ) > 0.1 )
				heading.z = heading.z - sign( heading.y ) * headingDecreaseRate;
		}
		
		if( newOrientationSet && !lastNewOrientationSet )
		{
			orientT = 0;
		}
		
		if( newOrientationSet )
		{
			orientT += t;
			
			if( orientT < orientSpeed )
				THREE.Quaternion.slerp( this.quaternion, newOrientation, this.quaternion, orientT / orientSpeed );	

			else
				newOrientationSet = false;
		}
		
		lastNewOrientationSet = newOrientationSet;
		lastTime = time;
		//currMat = this.matrix;
		
		this.supr.update.call( this );
	};
	
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
	};
	
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
			dragPosStart.x = event.x;
			dragPosStart.y = event.y;
			
			heading.x = 0;
			heading.y = 0;
			heading.z = 0;
			
			dragStartTime = new Date().getTime();
		}
	};
	
	function onMouseMove( event )
	{
		if( dragStarted )
		{
			var dragSpeedX = event.x - dragPosStart.x;
			var dragSpeedY = event.y - dragPosStart.y;
			
			heading.x = dragSpeedX;
			heading.y = dragSpeedY;		
			
			var orientX = new THREE.Quaternion();
			var orientY = new THREE.Quaternion();
			var angleX = dragSpeedX / 1000;
			var angleY = dragSpeedY / 1000;
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
			newOrientation.multiply( orientX, orientY );
			
			dragPosStart.x = event.x;
			dragPosStart.y = event.y;
			
			checkHeading();
		}
	};
	
	function onMouseUp( event )
	{
		if( event.button == 0 && dragStarted )
		{
			dragStarted = false;
		}
	};
	
	function onMouseWheel( event )
	{
		heading.z = -event.wheelDeltaY / 100;
		
		checkHeading();
	};

	
	// this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	// 
	 this.domElement.addEventListener( 'mousemove', onMouseMove, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', onMouseUp, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	// this.domElement.addEventListener( 'keydown', onKeyDown, false );
	// this.domElement.addEventListener( 'keyup', onKeyUp, false );	

};

THREE.WallCamera.prototype = new THREE.Camera();
THREE.WallCamera.prototype.constructor = THREE.WallCamera;
THREE.WallCamera.prototype.supr = THREE.Camera.prototype;
