

ImageCloudApp = function()
{
		this.numImages = 150;
		this.imageMeshes = [];
		this.imageMats = [];
		this.postpro = {};
		this.meshAreaManager = null;
		this.pickedMesh = null;
		this.lastPickedMesh = null;
		this.clickedMesh = null;
		this.lastClickedMesh = null;
		this.pickScaleIncrease = 1.1;
		this.mouseScenePos = new THREE.Vector3();
		this.particleMesh = null;
		this.inputWrapper = new AppInputWrapper( this );
		this.imagePositionMode = 2;
		this.boundMin = new THREE.Vector3();
		this.boundMax = new THREE.Vector3();
		this.bDof = false;
	
		this.container = document.getElementById('webgl_div');
		//document.body.appendChild( this.container );
		
		this.clearColor = 0xffffff;
		this.renderer	= new THREE.WebGLRenderer( { stencil: false, antialias: false, clearColor: this.clearColor, clearAlpha : 1 } );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
		this.renderer.autoClear = false;
		
		this.container.appendChild( this.renderer.domElement );
		
		this.stats = new Stats();
		this.stats.domElement.style.position = 'absolute';
		this.stats.domElement.style.top = '0px';
		this.container.appendChild( this.stats.domElement );
	
		this.animator = new Animator();
		
		this.camera = new THREE.CloudCamera( { fov:90, aspect: window.innerWidth / window.innerHeight, near: 1, far: 10000, domElement: this.renderer.domElement } );
		this.camera.position.z = 100;
		this.camera.position.y = 0;
		this.camera.farHeight = 2 * ( Math.tan( this.camera.fov / 2 ) * this.camera.far );
		this.camera.farWidth = this.camera.aspect * this.camera.farHeight;
		this.camera.fovHorizontal = 2 *( Math.atan( ( this.camera.farWidth / 2 ) / this.camera.far ) );
	
		this.scene= new THREE.Scene( );
		this.scene.fog = new THREE.FogExp2( this.clearColor, 0.0005 );
	
		this.colorRT = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false } );
		this.depthRT = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, depthBuffer: true, stencilBuffer: false } );
		this.postpro = new Postpro( this.colorRT, this.depthRT );
		
		var depthShader = AdditionalShaders[ 'depthLinear' ];
		var depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );
		depthUniforms[ 'mFar' ].value = this.camera.far;

		this.depthMat = new THREE.MeshShaderMaterial(
							{
								uniforms: depthUniforms,
								fragmentShader: depthShader.fragmentShader,
								vertexShader: depthShader.vertexShader,
								blending: THREE.NormalBlending,
								transparent: false
							} );
		
		var bTexLoaded = false;
		
		var tex = loadTexture( "textures/loading.jpg", new THREE.UVMapping(), this, function( img, app ) {
			
					for( var i = 0; i < app.numImages; ++i )
					{
						var newTex = tex.clone();
						newTex.needsUpdate = true;
						var mat = new THREE.MeshBasicMaterial( { color: 0xffffff, map : newTex } );
						var newMesh = new THREE.Mesh( new THREE.PlaneGeometry( 256, 256 ), mat );
						newMesh.width = 256;
						newMesh.height = 256;
						app.imageMeshes.push( newMesh );
						app.imageMats.push( mat );
					}
		
					var loadingTexture = app.imageMeshes[ 0 ].materials[ 0 ];
					
					var v3ImageAreaMin = new THREE.Vector3( -900.0, -700.0, 0.0 );
					var v3ImageAreaMax = new THREE.Vector3( 900.0, 700.0, 6000.0 );
					
					app.camera.moveBBoxMax = v3ImageAreaMax;
					app.camera.moveBBoxMin = v3ImageAreaMin;
			
					app.meshAreaManager = new MeshAreaManager( {
						numMeshesMax : app.numImages,
						numMeshesPerArea : 25,
						camera : app.camera,
						meshes : app.imageMeshes,
						meshMaterials : app.imageMats,
						v3DimensionsMin : v3ImageAreaMin,
						v3DimensionsMax : v3ImageAreaMax,
						animator : app.animator,
						scene : app.scene,
						loadingTexture : img,
						clearColor : this.clearColor,
						useParticles : false
					} );
		
					app.container.onmousemove = app.inputWrapper.onMouseMove;
					app.container.onmousedown = app.inputWrapper.onMouseDown;
					app.container.onmouseup = app.inputWrapper.onMouseUp;
				//app.container.onclick = app.inputWrapper.onMouseClick;
		
				//	app.container.ondblclick = app.inputWrapper.onDoubleClick;
					document.body.onkeyup = app.inputWrapper.onKeyUp;
		
					app.rebuildPositions();
		
					//Start loop:
					app.inputWrapper.animate();
 			} );


	this.intersectWithMouse = function()
	{
		var viewProjI = new THREE.Matrix4();
		viewProjI.identity();
		var projI = new THREE.Matrix4();
		var viewI = new THREE.Matrix4();
		THREE.Matrix4.makeInvert( this.camera.projectionMatrix, projI );
		THREE.Matrix4.makeInvert( this.camera.matrixWorldInverse, viewI );
		viewProjI.multiply( viewI, projI );
		
		var rayNear = new THREE.Vector4();
		
		rayNear.x = this.mouseScenePos.x;
		rayNear.y = this.mouseScenePos.y;
		rayNear.z = this.mouseScenePos.z;
		rayNear.w = 1.0;
		
		rayNear = viewProjI.multiplyVector4( rayNear );
		rayNear.x /= rayNear.w;
		rayNear.y /= rayNear.w;
		rayNear.z /= rayNear.w;
		rayNear.w = 1.0;
				
		var mouseRay = new THREE.Ray();		
		mouseRay.origin.copy( this.camera.position );
        
		mouseRay.direction.x = rayNear.x - this.camera.position.x;
		mouseRay.direction.y = rayNear.y - this.camera.position.y;
		mouseRay.direction.z = rayNear.z - this.camera.position.z;
		mouseRay.direction.normalize();
   
		return mouseRay.intersectScene( this.scene );
	}
	
	this.handleMousePick = function()
	{
		var intersects = this.intersectWithMouse();
		if( intersects.length > 0 )
		{
			if( intersects[ 0 ].object !== null && intersects[ 0 ].object !== this.particleMesh )
			{
				return intersects[ 0 ].object;
			}
		}
		
		else
		{
			return null;
		}
	}
	
	this.togglePerspective = function()
	{
		this.imagePositionMode++;
		
		if( this.imagePositionMode > 2 )
			this.imagePositionMode = 0;
			
		this.rebuildPositions();
	}
	
	
	this.rebuildPositions = function()
	{
		switch (this.imagePositionMode)
		{
			case 0:
				this.rebuildPositions_line();
			break;
			
			case 1:
				this.rebuildPositions_2Dgrid();
			break;
			
			case 2:
				this.meshAreaManager.RebuildPositions();
			break;
			
			default:
				rebuildPositions_2dgrid();
			break;
		}
	}
	
	this.rebuildPositions_line = function()
	{
		var currPosX = 0;
		
		var boundMin = new THREE.Vector3();
		var boundMax = new THREE.Vector3();
		var imageOffset = 10;
		
		for( var i = 0; i < this.imageMeshes.length; ++i )
		{
			var posY = 0;
			var posX = 0;
			var mesh = this.imageMeshes[ i ];
			
			var posXAdd = mesh.width + imageOffset;
			
			posX = currPosX + posXAdd - mesh.width / 2;
			currPosX += posXAdd;
			
			mesh.tempPos = new THREE.Vector3();
			mesh.tempPos.x = posX;
			mesh.tempPos.y = posY;
			
			updateBounds( mesh.tempPos, boundMin, boundMax );
		}
		
		boundMin.x -= this.imageMeshes[ 0 ].width / 2;
		boundMax.x += this.imageMeshes[ this.imageMeshes.length - 1 ].width / 2;
		
		for( var i = 0; i < this.imageMeshes.length; ++i )
		{
			var mesh = this.imageMeshes[ i ];
			mesh.tempPos.x -= ( boundMax.x - boundMin.x ) / 2;
			
			this.animator.AddAnimation( { 
				interpolationType: "smoothstep", 
				dataType: "Vector3", 
				startValue: mesh.position, 
				endValue: mesh.tempPos,
				animValue: mesh.position,
				duration: 2000,
				repetition: "oneShot"
			 } );
		}
	}
	
	this.rebuildPositions_2Dgrid = function()
	{
		//renderer.setDepthTest( false );
		var currPosX = 0;
		
		var maxPosY = 0;
		var currMaxPosY = 0;
		
		var boundMin = new THREE.Vector3();
		var boundMax = new THREE.Vector3();
		
		var imageRowCount = 30;
		
		for( var i = 0; i < this.imageMeshes.length; ++i )
		{
			var posY = 0;
			var posX = 0;
			var mesh = this.imageMeshes[ i ];
			
			if( i  % imageRowCount == 0 )
			{
				currPosX = 0;
				maxPosY = currMaxPosY;
			}
							
			if( i >= imageRowCount )
			{
				var meshAbove = this.imageMeshes[ i - imageRowCount ];
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
		
		for( var i = 0; i < this.imageMeshes.length; ++i )
		{
			var mesh = this.imageMeshes[ i ];
			
			mesh.tempPos.x -= ( boundMax.x - boundMin.x ) / 2;
			mesh.tempPos.y += ( boundMax.y - boundMin.y ) / 2;
												
			this.animator.AddAnimation( { 
				interpolationType: "smoothstep", 
				dataType: "Vector3", 
				startValue: mesh.position, 
				endValue: mesh.tempPos,
				animValue: mesh.position,
				duration: 3000,
				repetition: "oneShot"
			  } );
		}
	}
	
	this.toggleAutoMove = function()
	{
		this.camera.bAllowAutoMove = !this.camera.bAllowAutoMove;
	}
	
	this.setBrightTheme = function()
	{
		this.clearColor = 0xffffff;
		this.renderer.setClearColorHex( this.clearColor, 1 );
		this.meshAreaManager.setBrightTheme();
		this.scene.fog.color = new THREE.Color( this.clearColor );
	}
	
	this.setDarkTheme = function()
	{
		this.clearColor = 0x000000;
		this.renderer.setClearColorHex( this.clearColor, 1 );
		this.meshAreaManager.setDarkTheme();
		this.scene.fog.color = new THREE.Color( this.clearColor );
	}
	
	this.enableDOF = function( enable )
	{
		if( !enable && this.bDof )
		{
			this.setRegularMats();
		}
		
		this.bDof = enable;
	}
	
	this.setDepthMats = function()
	{
		for( var i = 0; i < this.imageMeshes.length; ++i )
		{
			this.imageMeshes[ i ].materials = [ this.depthMat ];
		}
	}
	
	this.setRegularMats = function()
	{
		for( var i = 0; i < this.imageMeshes.length; ++i )
		{
			this.imageMeshes[ i ].materials = [ this.imageMats[ i ] ];
		}
	}
		
	this.render = function()
	{
		if( !this.bDof )
			this.renderer.render( this.scene, this.camera, null, true );
		
		else
		{		
			// //Render scene in colorRT
			this.setRegularMats();
			this.renderer.render( this.scene, this.camera, this.colorRT, true );

			//Render depth in depthRT
			this.setDepthMats();
			this.renderer.render( this.scene, this.camera, this.depthRT, true );

		//	Render Postpro effect
			this.postpro.applyGauss( this.renderer );
		}
	}
};

function loadTexture( path, mapping, app, callback )
{
	var image = new Image(),
		texture = new THREE.Texture( image, mapping );

	image.onload = function () { texture.needsUpdate = true; if ( callback ) callback( this, app ); };
	image.src = path;

	return texture;
};

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
};


AppInputWrapper = function( cloudApp )
{
	var app = cloudApp;
	var wrapper = this;
	
	this.acceptFocus = function()
	{
		app.animator.bAcceptFocus = true;
	};

	this.onMouseMove = function( event )
	{
		app.mouseScenePos.x = ( event.clientX / window.innerWidth ) * 2.0 - 1.0;
		app.mouseScenePos.y = ( ( window.innerHeight - event.clientY ) / window.innerHeight ) * 2.0 - 1.0;
		app.mouseScenePos.z = -1.0;
		
		app.pickedMesh = app.handleMousePick();
		
		
		//calculate the current depth of the picked element
		if( app.pickedMesh != null )
		{
			var posVS = new THREE.Vector3();
			posVS.clone( app.pickedMesh.position );
			var posVS4 = new THREE.Vector4( posVS.x, posVS.y, posVS.z, 1.0 );
			
			if( app.animator.bAcceptFocus )
			{
				app.animator.AddAnimation( { 
			 		 		interpolationType: "linear", 
			 		 		dataType: "float", 
			 		 		startValue: app.postpro.depthFocus.value, 
			 		 		endValue: Math.abs( app.pickedMesh.position.z - app.camera.position.z ) / app.camera.far, 
			 		 		animValue: app.postpro.depthFocus,
			 		 		duration: 500,
			 		 		repetition: "oneShot",
							onFinish: wrapper.acceptFocus
						  } );
			
				app.animator.bAcceptFocus = false;
			}
		}
		
		// if( app.pickedMesh != null && Math.abs( app.pickedMesh.position.z - app.camera.position.z ) < app.camera.currViewModeDistance + 400.0 )
		// 		app.pickedMesh = null;
		
		if( app.pickedMesh != null && app.pickedMesh != app.lastPickedMesh )
		{
			app.pickedMesh.scale.x *= app.pickScaleIncrease;
			app.pickedMesh.scale.y *= app.pickScaleIncrease;
		}
		
		if( app.lastPickedMesh != null && app.pickedMesh != app.lastPickedMesh )
		{
			app.lastPickedMesh.scale.x /= app.pickScaleIncrease;
			app.lastPickedMesh.scale.y /= app.pickScaleIncrease;
		}
		
		app.lastPickedMesh = app.pickedMesh;
		
	}
	
	this.onMouseDown = function( event )
	{
		app.mouseScenePos.x = ( event.clientX / window.innerWidth ) * 2.0 - 1.0;
		app.mouseScenePos.y = ( ( window.innerHeight - event.clientY ) / window.innerHeight ) * 2.0 - 1.0;
		app.mouseScenePos.z = -1.0;

		app.clickedMesh = app.handleMousePick();
		app.lastClickedMesh = app.clickedMesh;
	}
	
	this.onKeyUp = function( event ) 
	{
		/*switch( event.keyCode ) 
		{
			case 82: 
				app.togglePerspective();
			break;
		} */
	}
	
	this.onMouseUp = function( event )
	{
		app.mouseScenePos.x = ( event.clientX / window.innerWidth ) * 2.0 - 1.0;
		app.mouseScenePos.y = ( ( window.innerHeight - event.clientY ) / window.innerHeight ) * 2.0 - 1.0;
		app.mouseScenePos.z = -1.0;

		app.clickedMesh = app.handleMousePick();
		
		if( app.clickedMesh != null && app.clickedMesh == app.lastClickedMesh )
		{	
			if( app.camera.viewMesh != app.clickedMesh )
			{
				var endPos = new THREE.Vector3();
				endPos.copy( app.clickedMesh.position );
				var zVert = ( app.clickedMesh.height * app.clickedMesh.scale.y ) / 2 * Math.tan( app.camera.fov / 2 );
				var zHor = ( app.clickedMesh.width * app.clickedMesh.scale.x ) / 2 * Math.tan( app.camera.fovHorizontal / 2 );

				endPos.z += Math.max( zVert / 2.5, zHor / 2.5 );
				app.camera.currViewModeDistance = Math.max( zVert / 2.5, zHor / 2.5 );
				app.camera.bImageViewMode = true;


				var v3Forward = new THREE.Vector3( 0, 0, -1 );
				var v3Aim = new THREE.Vector3( app.clickedMesh.position.x - app.camera.position.x, app.clickedMesh.position.y - app.camera.position.y, app.clickedMesh.position.z - app.camera.position.z );
				v3Aim.normalize();

				var v3Axis = new THREE.Vector3();
				v3Axis.cross( v3Forward, v3Aim );
				v3Axis.normalize();

				var fAngle = v3Aim.dot( v3Forward ) / 3;

				var endRot = new THREE.Quaternion();
				endRot.setFromAxisAngle( v3Axis, fAngle );

				app.animator.AddAnimation( { 
					interpolationType: "smoothstep2",
					dataType: "Quaternion",
					startValue: app.camera.quaternion,
					endValue: endRot,
					animValue: app.camera.quaternion,
					duration: 1000,
					//repetition: "fourthAndBackLoop"
					repetition: "fourthAndBack"
					 } );

				app.animator.AddAnimation( { 
					interpolationType: "smoothstep2",
					dataType: "Vector3", 
					startValue: app.camera.position, 
					endValue: endPos, 
					animValue: app.camera.position,
					duration: 3000,
					repetition: "oneShot"
				  } );
				
				app.camera.viewMesh = app.clickedMesh;
			}
			
			else if( app.camera.viewMesh != null && app.camera.viewMesh == app.clickedMesh )
			{
				app.animator.AddAnimation( { 
					interpolationType: "smoothstep2",
					dataType: "Vector3", 
					startValue: app.camera.position, 
					endValue: new THREE.Vector3( app.camera.position.x, app.camera.position.y, app.camera.position.z + 300 ), 
					animValue: app.camera.position,
					duration: 2000,
					repetition: "oneShot"
				  } );
				
				app.camera.viewMesh = null;
			}	
		}
	}
	
	/*this.onMouseClick = function( event )
	{
		//Handle Gui
		// var intersectsGui = intersectWithMouse( gui.scene, gui.camera );
		// 	if( intersectsGui.length > 0 )
		// 	{
		// 		intersectsGui[ 0 ].object.onMouseClick();
		// 	}
	} */
	
	this.animate = function()
	{
		requestAnimationFrame( wrapper.animate );	
		app.camera.update();
		app.stats.update();
		
		app.meshAreaManager.Update();
		app.animator.animate();
		app.render();
	}
}

