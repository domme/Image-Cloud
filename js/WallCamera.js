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
	
	
	this.lookSpeed = 1;
	this.movementSpeed = 1;
	this.rollSpeed = 1;
	this.useTarget = false;
	
	this.useQuaternion = true;

	this.domElement = document;
	
	this.update = function() 
	{
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
		
		this.supr.update.call( this );
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
			
			dragStartTime = new Date().getTime();
		}
		
	};
	
	function onMouseMove( event )
	{
		if( dragStarted )
		{
			var moveVec = new THREE.Vector2( event.x, event.y );
			//moveVec -= dragPosStart;
			heading.x = ( moveVec.x - dragPosStart.x );
			heading.y = ( moveVec.y - dragPosStart.y );
			
			dragPosStart.x = event.x;
			dragPosStart.y = event.y;
			
		}
	};
	
	function onMouseUp( event )
	{
		if( event.button == 0 && dragStarted )
		{
			dragStarted = false;
		}
	};

	
	// this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	// 
	 this.domElement.addEventListener( 'mousemove', onMouseMove, false );
	this.domElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mouseup', onMouseUp, false );
	// this.domElement.addEventListener( 'keydown', onKeyDown, false );
	// this.domElement.addEventListener( 'keyup', onKeyUp, false );	

};

THREE.WallCamera.prototype = new THREE.Camera();
THREE.WallCamera.prototype.constructor = THREE.WallCamera;
THREE.WallCamera.prototype.supr = THREE.Camera.prototype;
