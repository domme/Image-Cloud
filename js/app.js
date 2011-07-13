	var camera;
	var scene;
	var renderer;
	var stats;
	var animator;
	var postpro = {};
	
	var particleMesh;
	var particleImage;
	
	var numImages = 200;

	var imageMeshes = [];
	var imageMats = [];
	var imageTexture = [];
	var depthMat;
	var imageOffset = 25;
	var imageRowCount = 20;
	var cameraGridBaseOffset = 2000;
	var loadingTexture;
	var imageMat;
	var imageBoundsMin = new THREE.Vector3();
	var imageBoundsMax = new THREE.Vector3();
	var imagePositionMode = 2;
	
	var bDof = false;
	
	var mouseScenePos = new THREE.Vector3();
	var mouseRay = new THREE.Ray();
	
	var lastPickedMesh = null;
	var pickedMesh = null;
	var viewedMesh = null;
	var pickScaleIncrease = 1.1;
	var postpro;
	var colorRT;
	var depthRT;
	
	var meshAreaManager;
	
	var imgMode = false;
	
	var button_togglePositions;
	
	function init()
	{
		container = document.createElement('div');
		document.body.appendChild(container);
		
		var clearColor = 0x000000;
		renderer	= new THREE.WebGLRenderer( { stencil: true, antialias: false, clearColor: clearColor, clearAlpha : 1 } );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.autoClear = false;
		container.appendChild( renderer.domElement );
		
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top = '0px';
		container.appendChild( stats.domElement );
	
		animator = new Animator();
		
		camera = new THREE.CloudCamera( { fov:60, aspect: window.innerWidth / window.innerHeight, near: 1, far: 10000, domElement: renderer.domElement } );
		camera.position.z = 1000;
		camera.position.y = 10;

		camera.farHeight = 2 * ( Math.tan( camera.fov / 2 ) * camera.far );
		camera.farWidth = camera.aspect * camera.farHeight;
		camera.fovHorizontal = 2 *( Math.atan( ( camera.farWidth / 2 ) / camera.far ) );
	
		scene 		= new THREE.Scene( );
		scene.fog = new THREE.FogExp2( clearColor, 0.0003 );
		//var cube = new THREE.Mesh( new THREE.Cube( 20, 20, 20 ), new THREE.MeshBasicMaterial( { color: 0xff0000 } ) );
		//scene.addObject( cube );
	
		colorRT = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, stencilBuffer: false } );
		depthRT = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat, stencilBuffer: false } );
		postpro = new Postpro( colorRT, depthRT );
		
		var depthShader = AdditionalShaders[ 'depthLinear' ];
		var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
		depthUniforms[ 'mFar' ].value = camera.far;

		depthMat = new THREE.MeshShaderMaterial(
							{
								uniforms: depthUniforms,
								fragmentShader: depthShader.fragmentShader,
								vertexShader: depthShader.vertexShader,
								blending: THREE.NormalBlending,
								transparent: true
							} );
		
		var bTexLoaded = false;
		
		var tex = THREE.ImageUtils.loadTexture( "textures/loading.jpg", new THREE.UVMapping(), function( img ) {
			
					for( var i = 0; i < numImages; ++i )
					{
						var newTex = tex.clone();
						newTex.needsUpdate = true;
						var mat = new THREE.MeshBasicMaterial( { color: 0xffffff, map : newTex } );
						var newMesh = new THREE.Mesh( new THREE.Plane( 256, 256 ), mat );
						newMesh.width = 256;
						newMesh.height = 256;
						imageMeshes.push( newMesh );
						imageMats.push( mat );
					}
		
					loadingTexture = imageMeshes[ 0 ].materials[ 0 ];
	
			
					meshAreaManager = new MeshAreaManager( {
						numMeshesMax : numImages,
						numMeshesPerArea : 10,
						camera : camera,
						meshes : imageMeshes,
						meshMaterials : imageMats,
						v3DimensionsMin : new THREE.Vector3( -2050.0, -2050.0, 0.0 ),
						v3DimensionsMax : new THREE.Vector3( 2050.0, 2050.0, 9000.0 ),
						animator : animator,
						scene : scene,
						loadingTexture : img	
					} );
		
					particleImage = THREE.ImageUtils.loadTexture( "textures/particle1.png", new THREE.UVMapping() );
					var particleMat = new THREE.MeshBasicMaterial( {color: clearColor == 0x000000 ? 0xD6D6D6 : 0x050505/*, map: particleImage */ } );
					var geometry = new THREE.Geometry();
		
					for( var i = 0; i < 2000; ++i )
					{
						var tempParticleMesh = new THREE.Mesh( new THREE.Plane( 10, 10 ) );
			
						var max = 5000;
						var min = -5000;
						var endPos = new THREE.Vector3();
			
						endPos.x = min + ( max - min ) * Math.random();
						endPos.y = min + ( max - min ) * Math.random();
						endPos.z = -10000 * Math.random();
			
						tempParticleMesh.position.x = endPos.x;
						tempParticleMesh.position.y = endPos.y;
						tempParticleMesh.position.z = endPos.z;
			
						GeometryUtils.merge( geometry, tempParticleMesh );
					}
		
					particleMesh = new THREE.Mesh(  geometry, particleMat );
					scene.addObject( particleMesh );
				
		
					container.onmousemove = onMouseMove;
					container.onmousedown = onMouseUp;
					container.onmouseup = onMouseUp;
					container.onclick = onMouseClick;
		
					container.ondblclick = onDoubleClick;
					document.body.onkeyup = onKeyUp;
		
					rebuildPositions();
		
					//Start loop:
					animate();	
		
			 } );
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
		
		
		//calculate the current depth of the picked element
		if( pickedMesh != null )
		{
			var posVS = new THREE.Vector3();
			posVS.clone( pickedMesh.position );
			var posVS4 = new THREE.Vector4( posVS.x, posVS.y, posVS.z, 1.0 );
			
			var view = camera.matrixWorldInverse;
			posVS4 = view.multiplyVector4( posVS4 );
			
			//postpro.depthFocus = Math.abs( posVS4.z / camera.far );
			animator.AddAnimation( { 
		 		 		interpolationType: "smoothstep", 
		 		 		dataType: "float", 
		 		 		startValue: postpro.depthFocus.value, 
		 		 		endValue: Math.abs( pickedMesh.position.z - camera.position.z ) / camera.far, 
		 		 		animValue: postpro.depthFocus,
		 		 		duration: 500,
		 		 		repetition: "oneShot"
		 		 	  } );
		}
		
		lastPickedMesh = pickedMesh;
	}
	
	function onKeyUp( event ) 
	{
		switch( event.keyCode ) 
		{
			case 82: /*R*/ 
				togglePerspective();
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
			{
				endPos.z -= Math.max( zVert / 3, zHor / 3 );
				camera.bImageViewMode = true;
			}
				

			
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
	
	function onMouseClick( event )
	{
		//Handle Gui
		// var intersectsGui = intersectWithMouse( gui.scene, gui.camera );
		// 	if( intersectsGui.length > 0 )
		// 	{
		// 		intersectsGui[ 0 ].object.onMouseClick();
		// 	}
	}
	
	function intersectWithMouse( scene, camera )
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
   
		return mouseRay.intersectScene( scene );
	}
	
	function handleMousePick()
	{
		var intersects = intersectWithMouse( scene, camera );
		if( intersects.length > 0 )
		{
			if( intersects[ 0 ].object !== null && intersects[ 0 ].object !== particleMesh )
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
	
	
	function togglePerspective()
	{
		imagePositionMode++;
		
		if( imagePositionMode > 2 )
			imagePositionMode = 0;
			
		rebuildPositions();
		
		//camera.setViewMode( imagePositionMode );
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
				meshAreaManager.RebuildPositions();
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
			
			mesh.tempPos = new THREE.Vector3();
			mesh.tempPos.x = posX;
			mesh.tempPos.y = posY;
			
			updateBounds( mesh.tempPos, boundMin, boundMax );
		}
		
		boundMin.x -= imageMeshes[ 0 ].width / 2;
		boundMax.x += imageMeshes[ imageMeshes.length - 1 ].width / 2;
		
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			var mesh = imageMeshes[ i ];
			mesh.tempPos.x -= ( boundMax.x - boundMin.x ) / 2;
			
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
			var dim = new THREE.Vector3( imageBoundsMax.x - imageBoundsMin.x, imageBoundsMax.y - imageBoundsMin.y, imageBoundsMax.z - imageBoundsMin.z );
			var fDim = dim.length();
			
			var mesh = imageMeshes[ i ];
			var max = fDim / 3.0;
			var min = -fDim / 3.0;
			var endPos = new THREE.Vector3();
			
			endPos.x = min + ( max - min ) * Math.random();
			endPos.y = min + ( max - min ) * Math.random();
			endPos.z = fDim * 2.0 * Math.random();
			
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
	
	function setDepthMats()
	{
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			imageMeshes[ i ].materials = [ depthMat ];
		}
	}
	
	function setRegularMats()
	{
		for( var i = 0; i < imageMeshes.length; ++i )
		{
			imageMeshes[ i ].materials = [ imageMats[ i ] ];
		}
	}
		
	function animate()
	{
		requestAnimationFrame( animate );
		camera.update();
		stats.update();
		
		meshAreaManager.Update();
		animator.animate();
		render();
	}
	
	function render()
	{
		renderer.clear();
		
		if( !bDof )
			renderer.render( scene, camera );
		
		else
		{
			// //Render scene in colorRT
			setRegularMats();
			renderer.render( scene, camera, colorRT, true );

			//Render depth in depthRT
			setDepthMats();
			renderer.render( scene, camera, depthRT, true );

		//	Render Postpro effect
			renderer.render( postpro.scene, postpro.camera );
			postpro.applyGauss( renderer );

			renderer.render( scene, camera );
		}
	
	}