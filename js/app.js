	var camera;
	var scene;
	var renderer;
	var stats;
	var animator;
	
	var urls = [
	 	"http://img.ly/system/uploads/000/775/293/large_image.jpg",
		"http://img.ly/system/uploads/000/772/892/large_upload.jpg",
		"http://img.ly/system/uploads/000/772/863/large_IMAG0167.jpg?1300612045",
		"http://img.ly/system/uploads/000/772/830/large_image.jpg?1300610453",
		"http://img.ly/system/uploads/000/742/408/large_image.jpg?1298974065",
		"http://img.ly/system/uploads/000/736/579/large_image.jpg?1298642956",
		"http://img.ly/system/uploads/000/734/654/large_image.jpg?1298547525",
		"http://img.ly/system/uploads/000/734/640/large_Gravity.jpg?1298546846",
		"http://img.ly/system/uploads/000/734/594/large_hotot.png?1298544998",
		"http://img.ly/system/uploads/000/772/876/large_upload.jpg?1300612562",
		"http://img.ly/system/uploads/000/734/670/large_5470806090_8e50d245fc.jpg?1298547964",
		"http://img.ly/system/uploads/000/734/593/large_%E5%86%99%E7%9C%9F_210.jpg?1298544958",
		"http://img.ly/system/uploads/000/732/987/large_image.jpg?1298462098",
		"http://img.ly/system/uploads/000/734/644/large_DSCN4410.JPG?1298547057",
		"http://img.ly/system/uploads/000/732/840/large_i-love-people.jpg?1298455948",
		"http://img.ly/system/uploads/000/952/440/large_upload.jpg?1305116085",
		"http://img.ly/system/uploads/000/019/868/large_who.jpg?1254314677",
		"http://img.ly/system/uploads/000/922/188/large_upload.jpg?1304722069",
		"http://img.ly/system/uploads/000/977/906/large_upload.jpg?1305425357",
		"http://img.ly/system/uploads/000/071/706/large_fT4b4.jpg?1261670828",
		"http://img.ly/system/uploads/000/058/461/large_mediafile.?1259852464",
		"http://img.ly/system/uploads/000/778/368/large_image.jpg?1300897449",
		"http://img.ly/system/uploads/000/146/481/large_U86P4T366D4995F11507DT20100304094124.jpg?1268028117",
		"http://img.ly/system/uploads/000/072/837/large__.?1261791400",
		"http://img.ly/system/uploads/000/922/561/large_upload.jpg?1304727022",
		"http://img.ly/system/uploads/000/911/754/large_upload.jpg?1304589807",
		"http://img.ly/system/uploads/000/676/999/large_upload.jpg?1295567091",
		"http://img.ly/system/uploads/000/086/292/large_%E8%B0%B7%E6%AD%8C%E7%8C%AE%E8%8A%B12.jpg?1263362475",
		"http://img.ly/system/uploads/000/246/347/large_image.jpg?1272577490",
		"http://img.ly/system/uploads/000/876/806/large_upload.jpg?1304103678",
		"http://img.ly/system/uploads/000/879/123/large_upload.jpg?1304134691",
		"http://img.ly/system/uploads/000/584/749/large_upload.jpg?1290032669",
		"http://img.ly/system/uploads/000/128/500/large_image.jpg?1266842066",
		"http://img.ly/system/uploads/000/868/257/large_upload.jpg?1303991131",
	];
	
	var imageMeshes = [];
	var imageOffset = 25;
	var imageRowCount = 10;
	var cameraGridBaseOffset = 2000;
	var loadingTexture;
	var imageMat;
	var imageBoundsMin = new THREE.Vector3();
	var imageBoundsMax = new THREE.Vector3();
	var imagePositionMode = 1;
	
	var mouseScenePos = new THREE.Vector3();
	var mouseRay = new THREE.Ray();
	
	var lastPickedMesh = null;
	var pickedMesh = null;
	var viewedMesh = null;
	var pickScaleIncrease = 1.1;
	var lastClickTime = new Date().getTime();
	
	var imgMode = false;
	
	var button_togglePositions;
	
	function init()
	{
		container = document.createElement('div');
		document.body.appendChild(container);
		
		renderer	= new THREE.WebGLRenderer( { stencil: true, antialias: false, clearColor: 0xB5B5B5 } );
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild( renderer.domElement );
		
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		container.appendChild( stats.domElement );
	
		animator = new Animator();
	
		scene 		= new THREE.Scene();
		var cube = new THREE.Mesh( new THREE.Cube( 20, 20, 20 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
		scene.addObject( cube );
		
		camera = new THREE.WallCamera( { fov:60, aspect: window.innerWidth / window.innerHeight, near: 1, far: 10000, domElement: renderer.domElement } );
		camera.position.z = 2000;
		camera.position.y = 10; 
		
		camera.farHeight = 2 * ( Math.tan( camera.fov / 2 ) * camera.far );
		camera.farWidth = camera.aspect * camera.farHeight;
		camera.fovHorizontal = 2 *( Math.atan( ( camera.farWidth / 2 ) / camera.far ) );
	
		loadingTexture = THREE.ImageUtils.loadTexture( "textures/loading.jpg", new THREE.UVMapping(), onInitWithLoadingTexture );
		
		for( var i = 0; i < urls.length; ++i )
		{
			loadTexture( urls[ i ], new THREE.UVMapping(), applyNewImage, i );
		}		
		
		container.onmousemove = onMouseMove;
		container.onmousedown = onMouseUp;
		container.onmouseup = onMouseUp;
		container.ondblclick = onDoubleClick;
		document.body.onkeyup = onKeyUp;
	}
	
	function onInitWithLoadingTexture( img )
	{
		var imageSpacingX = img.width + imageOffset;
		var imageSpacingY = img.height + imageOffset;
		var imageStartPosX = -imageRowCount / 2.0 * imageSpacingX;
		var imageStartPosY = ( urls.length / imageRowCount ) / 2;
	
		for( var i = 0; i < urls.length; ++i )
		{
			var mesh = new THREE.Mesh( new THREE.Plane( img.width, img.height ), new THREE.MeshBasicMaterial( { color: 0xffffff, map: loadingTexture } ) );
			mesh.width = img.width;
			mesh.height = img.height;
							
			imageMeshes.push( mesh );
			scene.addObject( mesh );
		}
		
		rebuildPositions();
	}
	
	function onMouseMove( event )
	{
		mouseScenePos.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouseScenePos.y = ( ( window.innerHeight - event.clientY ) / window.innerHeight ) * 2 - 1;
		mouseScenePos.z = camera.near;
		
		handleMousePick();
		
		if( lastPickedMesh != null && pickedMesh != lastPickedMesh )
		{
			lastPickedMesh.scale.x /= pickScaleIncrease;
			lastPickedMesh.scale.y /= pickScaleIncrease;
		}
		
		if( pickedMesh != null && pickedMesh != lastPickedMesh )
		{
			pickedMesh.scale.x *= pickScaleIncrease;
			pickedMesh.scale.y *= pickScaleIncrease;
		}
		
		lastPickedMesh = pickedMesh;
	}
	
	function onKeyUp( event ) 
	{
		switch( event.keyCode ) 
		{
			case 82: /*R*/ 
				rebuildPositions_3D();
			break;
			
			case 70: /*F*/ 
				rebuildPositions_2Dgrid();
			break;
		}
	}
	
	function onDoubleClick( event )
	{
		if( pickedMesh != null )
		{
			var endPos = new THREE.Vector3();
			endPos.copy( pickedMesh.position );
			var zVert = pickedMesh.height / 2 * Math.tan( camera.fov / 2 );
			var zHor = pickedMesh.width / 2 * Math.tan( camera.fovHorizontal / 2 );
			
			if( viewedMesh == pickedMesh ) //move back overview mode
				endPos.z += cameraGridBaseOffset;
				
			else //move towards image
				endPos.z -= Math.max( zVert / 3, zHor / 3 );
			
			animator.AddAnimation( { 
				interpolationType: "weighted average",
				dataType: "Vector3", 
				startValue: camera.position, 
				endValue: endPos, 
				animValue: camera.position,
				duration: 1000,
				repetition: "oneShot"
			  } );
			
			viewedMesh = pickedMesh;
		}
	}
	
	function handleMousePick()
	{
		var viewProjI = new THREE.Matrix4();
		viewProjI.identity();
		var projI = new THREE.Matrix4();
		var viewI = new THREE.Matrix4();
		THREE.Matrix4.makeInvert( camera.projectionMatrix, projI );
		THREE.Matrix4.makeInvert( camera.matrixWorldInverse, viewI );
		viewProjI.multiply( viewI, projI );
		
		var rayNear = new THREE.Vector4();
		
		rayNear.x = mouseScenePos.x;
		rayNear.y = mouseScenePos.y;
		rayNear.z = 0;
		rayNear.w = 1;
		
		rayNear = viewProjI.multiplyVector4( rayNear );
						
		mouseRay.origin.copy( camera.position );
        
		mouseRay.direction.x = rayNear.x - camera.position.x;
		mouseRay.direction.y = rayNear.y - camera.position.y;
		mouseRay.direction.z = rayNear.z - camera.position.z;
		mouseRay.direction.normalize();
        
        
		var intersects = mouseRay.intersectScene( scene );
		if( intersects.length > 0 )
		{
			if( intersects[ 0 ].object !== null )
			{
				pickedMesh = intersects[ 0 ].object;
			}
		}
		
		else
		{
			pickedMesh = null;
		}
	}		
	
	function onMouseDown( event )
	{	
	
	}
	
	function onMouseUp( event )
	{
		
	}
	
	function loadTexture( path, mapping, callback, i )
	{
		var newImg = new Image(),
			texture = new THREE.Texture( newImg, mapping, THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter );
		
		newImg.onload = function() { texture.needsUpdate = true; if( callback ) callback( i, texture ); };
		newImg.src = path;
		
		return texture; 
	}
	
	
	function applyNewImage( iElement, texture )
	{
		var mesh = imageMeshes[ iElement ];
		var fXscale = texture.image.width / mesh.width;
		var fYscale = texture.image.height / mesh.height;
		mesh.scale.x = fXscale;
		mesh.scale.y = fYscale;
		mesh.width = texture.image.width;
		mesh.height = texture.image.height;
		mesh.materials[0].map = texture;
		//imageMeshes[ iElement ]
		
		rebuildPositions();
	}
	
	
	function rebuildPositions()
	{
		switch (imagePositionMode)
		{
			case 0:
				rebuildPositions_line();
			break;
			
			case 1:
				rebuildPositions_2Dgrid();
			break;
			
			case 2:
				rebuildPositions_3D();
			break;
			
			default:
				rebuildPositions_2dgrid();
			break;
		}
	}
	
	function updateBounds( pos, boundMin, boundMax )
	{
		if( pos.x < boundMin.x )
			boundMin.x = pos.x;
		if( pos.x > boundMax.x )
			boundMax.x = pos.x;
			
		if( pos.y < boundMin.y )
			boundMin.y = pos.y;
		if( pos.y > boundMax.y )
			boundMax.y = pos.y;
			
		if( pos.z < boundMin.z )
			boundMin.z = pos.z;
		if( pos.z > boundMax.z )
			boundMax.z = pos.z;
	}
	
			
	function rebuildPositions_line()
	{
		renderer.setDepthTest( false );
		var currPosX = 0;
		
		var boundMin = new THREE.Vector3();
		var boundMax = new THREE.Vector3();
		
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			var posY = 0;
			var posX = 0;
			var mesh = imageMeshes[ i ];
			
			var posXAdd = mesh.width + imageOffset;
			
			posX = currPosX + posXAdd - mesh.width / 2;
			currPosX += posXAdd;
			
			animator.AddAnimation( { 
				interpolationType: "smoothstep", 
				dataType: "Vector3", 
				startValue: mesh.position, 
				endValue: new THREE.Vector3( posX, posY, 0 ), 
				animValue: mesh.position,
				duration: 1000,
				repetition: "oneShot"
			  } );
			
			updateBounds( mesh, boundMin, boundMax );
		}
		
		boundMin.x -= imageMeshes[ 0 ].width / 2;
		boundMax.x += imageMeshes[ imageMeshes.length - 1 ].width / 2;
		
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			imageMeshes[ i ].position.x -= ( boundMax.x - boundMin.x ) / 2;
		}
		
		imageBoundsMin.copy( boundMin );
		imageBoundsMax.copy( boundMax );
	}
	
	function rebuildPositions_2Dgrid()
	{
		//renderer.setDepthTest( false );
		var currPosX = 0;
		
		var maxPosY = 0;
		var currMaxPosY = 0;
		
		var boundMin = new THREE.Vector3();
		var boundMax = new THREE.Vector3();
		
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			var posY = 0;
			var posX = 0;
			var mesh = imageMeshes[ i ];
			
			if( i  % imageRowCount == 0 )
			{
				currPosX = 0;
				maxPosY = currMaxPosY;
			}
							
			if( i >= imageRowCount )
			{
				var meshAbove = imageMeshes[ i - imageRowCount ];
				posY = maxPosY - imageOffset - mesh.height / 2;
			}
			
			var posXAdd = mesh.width + imageOffset;
			
			posX = currPosX + posXAdd - mesh.width / 2;
			currPosX += posXAdd;
			
			if( posY - mesh.height / 2 < currMaxPosY )
			{
				currMaxPosY = posY - mesh.height / 2;
			}
					
			mesh.tempPos = new THREE.Vector3();
			mesh.tempPos.x = posX;
			mesh.tempPos.y = posY;
			
			updateBounds( mesh.tempPos, boundMin, boundMax );
		}
		
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			var mesh = imageMeshes[ i ];
			
			mesh.tempPos.x -= ( boundMax.x - boundMin.x ) / 2;
			mesh.tempPos.y += ( boundMax.y - boundMin.y ) / 2;
												
			animator.AddAnimation( { 
				interpolationType: "smoothstep", 
				dataType: "Vector3", 
				startValue: mesh.position, 
				endValue: mesh.tempPos,
				animValue: mesh.position,
				duration: 2000,
				repetition: "oneShot"
			  } );
		}
		
		imageBoundsMin.copy( boundMin );
		imageBoundsMax.copy( boundMax );
	}
	
	function rebuildPositions_3D()
	{
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			var mesh = imageMeshes[ i ];
			var max = 2000;
			var min = -2000;
			var endPos = new THREE.Vector3();
			
			endPos.x = min + ( max - min ) * Math.random();
			endPos.y = min + ( max - min ) * Math.random();
			endPos.z = 3000 * Math.random();
			
			animator.AddAnimation( { 
				interpolationType: "smoothstep", 
				dataType: "Vector3", 
				startValue: mesh.position, 
				endValue: endPos,
				animValue: mesh.position,
				duration: 2000,
				repetition: "oneShot"
			  } );
		}
	}
		
	function animate()
	{
		requestAnimationFrame( animate );
		camera.update( imageBoundsMin, imageBoundsMax );
		stats.update();
		
		
		animator.animate();
		render();
	}
	
	function render()
	{
		renderer.clear();
		renderer.render( scene, camera );
	}