function sign( value )
{
	return value > 0 ? 1 : -1;
}

CallbackWrapper = function( cloudCamera )
{
	var camera = cloudCamera;
	
	this.onMouseMove = function( event )
	{
		if( camera.dragStarted )
		{
			camera.bImageViewMode = false;
			var dragSpeedX = event.clientX - camera.dragPosStart.x;
			var dragSpeedY = event.clientY - camera.dragPosStart.y;
			
			camera.heading.x -= dragSpeedX * 20;
			camera.heading.y += dragSpeedY * 20;		
			
			var orientX = new THREE.Quaternion();
			var orientY = new THREE.Quaternion();
			var angleX = dragSpeedX / 4000;
			var angleY = dragSpeedY / 4000;
			angleX = camera.checkAngle( angleX );
			angleY = camera.checkAngle( angleY );
			
			if( camera.rotationXallowed( angleX ) )
			{
				orientX.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ),  angleX );
			}
			
			if( camera.rotationYallowed( angleY ) )
			{
				orientY.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), angleY );
			}
			
			var orient = new THREE.Quaternion();
			orient.multiply( orientY, orientX );
			camera.newOrientation.multiplySelf( orient );
			
			camera.dragPosStart.x = event.clientX;
			camera.dragPosStart.y = event.clientY;
			
			camera.checkHeading();
		}
	};

	this.onMouseDown = function( event )
	{
		if( event.button == 0 ) //left mouse button
		{
			camera.dragStarted = true;
			camera.mouseDown = true;
			camera.bAutoMove = false;
			camera.currAutoMovementTime = 0.0;

			if( !camera.lastMouseDown )
			{	
				camera.dragPosStart.x = event.clientX;
				camera.dragPosStart.y = event.clientY;

				camera.heading.x = 0;
				camera.heading.y = 0;
				camera.heading.z = 0;
			}

			camera.newOrientation.copy( camera.baseOrientation );
			camera.lastMouseDown = true;
		}
	};

	this.onMouseUp = function( event )
	{
		if( event.button == 0 )
			camera.mouseDown = false;
		
		if( event.button == 0 && camera.dragStarted )
		{
			camera.dragStarted = false;
			camera.orientT = 0;
			camera.lastMouseDown = false;
		}
	};

	this.onMouseWheel = function( event )
	{
		camera.bAutoMove = false;
		camera.bAutoMovmentTime = 0.0;
		camera.bImageViewMode = false;
		
		if( sign( -event.wheelDeltaY ) !== sign( camera.heading.z ) )
			camera.heading.z = 0;

		camera.heading.z -= event.wheelDeltaY;
		
		camera.checkHeading();
	};
}

THREE.CloudCamera = function ( parameters ) 
{
	THREE.Camera.call( this, parameters.fov, parameters.aspect, parameters.near, parameters.far );
	this.useQuaternion = true;
	
	this.domElement = parameters.domElement;
	
	this.heading =  new THREE.Vector3();
	this.posChange = new THREE.Vector3();
	this.maxHeading = 1000;
	
	this.newOrientation = new THREE.Quaternion();
	this.orientation = new THREE.Quaternion();
	this.baseOrientation = new THREE.Quaternion();
	this.baseOrientation.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), 0 );
	
	this.tLast = new Date().getTime();
	
	
	this.bInit = false;
	this.useTarget = false;
	this.callbackWrapper = new CallbackWrapper( this );
	this.currViewModeDistance = 0.0;
	
	this.dragStarted = false;
	
	this.orientT = 0.0;
	this.orientSpeed = 1.0;
	this.mouseDown = false;
	this.lastMouseDown = false;
	this.dragPosStart = new THREE.Vector2();
	this.maxAngleRad = 60.0 / 180.0 * Math.PI;
	
	this.bAllowAutoMove = false;
	this.bAutoMove = false;
	this.currAutoMovementTime = 0.0;
	this.startAutoMovementTime = 2.0;
	this.bImageViewMode = false;
	this.zAutoMoveSpeed = 100;
	
	this.update = function()
	{
		if( !this.bInit )
			return;

		var t = ( new Date().getTime() - this.tLast ) / 1000.0;
		
		var regressionX = Math.max( 0.99 - 0.9 * t, 0.1 );
		var regressionY = Math.max( 0.99 - 0.9 * t, 0.1 );
		var regressionZ = Math.max( 1.0 - 0.9 * t, 0.1 );

		
		this.position.x += ( this.heading.x + this.posChange.x ) * t;
		this.position.y += ( this.heading.y + this.posChange.y ) * t;
		this.position.z += ( this.heading.z + this.posChange.z ) * t;
		
		this.heading.x *= regressionX;
		this.heading.y *= regressionY;
		this.heading.z *= regressionZ;
		
		
		if( this.dragStarted )
		{
			this.quaternion.copy( this.baseOrientation );
			this.quaternion.multiplySelf( this.newOrientation );
		}
		
		else
		{
			this.orientT += t;
			
			if( this.orientT < this.orientSpeed )
			{
				THREE.Quaternion.slerp( this.quaternion, this.baseOrientation, this.quaternion, this.orientT / 2.0 );
			}
			
			else
				this.newOrientation.copy( this.baseOrientation );
		}
		
		if( this.heading.isZero() && this.bAutoMove && !this.bImageViewMode &&this.bAllowAutoMove )
		{
			this.position.z -= this.zAutoMoveSpeed * t;
		}
		
		else if( this.heading.isZero() && !this.bAutoMove && !this.bImageViewMode )
		{
			this.currAutoMovementTime += t;
			if( this.currAutoMovementTime > this.startAutoMovementTime )
				this.bAutoMove = true;
		}
			
		this.tLast = new Date().getTime();
		this.supr.update.call( this );
	};
	
	this.checkAngle = function( angle )
	{
		if( angle > 0 )
		{
			return Math.min( this.maxAngleRad, angle );
		}

		else
		{
			return Math.max( -this.maxAngleRad, angle );
		}
	};
	
	this.rotationXallowed = function( angle )
	{
		var right = new THREE.Vector3( 1, 0, 0 );
		var currRight = new THREE.Vector3( this.matrix.flat[ 0 ], this.matrix.flat[ 1 ], this.matrix.flat[ 2 ] );
		currRight.normalize();
		
		var currAngleRad = right.dot( currRight );
		return Math.abs( currAngleRad + angle ) < this.maxAngleRad;
	};
	
	this.rotationYallowed = function( angle )
	{
		var up = new THREE.Vector3( 0, 1, 0 );
		var currUp = new THREE.Vector3( this.matrix.flat[ 4 ], this.matrix.flat[ 5 ], this.matrix.flat[ 6 ] );
		currUp.normalize();
		
		var currAngleRad = up.dot( currUp );
		return Math.abs( currAngleRad + angle ) < this.maxAngleRad;
	};
	
	this.checkHeading = function()
	{
		if( this.heading.x > 0 )
			this.heading.x = Math.min( this.maxHeading, this.heading.x );
		else
			this.heading.x = Math.max( -this.maxHeading, this.heading.x );
			
		if( this.heading.y > 0 )
			this.heading.y = Math.min( this.maxHeading, this.heading.y );
		else
			this.heading.y = Math.max( -this.maxHeading, this.heading.y );
			
		if( this.heading.z > 0 )
			this.heading.z = Math.min( this.maxHeading, this.heading.z );
		else
			this.heading.z = Math.max( -this.maxHeading, this.heading.z );
			
		if( Math.abs( this.heading.x ) < 0.01 )
			this.heading.x = 0;
			
		if( Math.abs( this.heading.y ) < 0.01 )
			this.heading.y = 0;
			
		if( Math.abs( this.heading.z ) < 0.01 )
			this.heading.z = 0;
	};
	
	this.domElement.addEventListener( 'mousemove', this.callbackWrapper.onMouseMove, false );
	this.domElement.addEventListener( 'mousedown', this.callbackWrapper.onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', this.callbackWrapper.onMouseUp, false );
	this.domElement.addEventListener( 'mousewheel', this.callbackWrapper.onMouseWheel, false );
	
};

THREE.CloudCamera.prototype = new THREE.Camera();
THREE.CloudCamera.prototype.constructor = THREE.CloudCamera;
THREE.CloudCamera.prototype.supr = THREE.Camera.prototype;


