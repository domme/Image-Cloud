Postpro = function ( colorRT, depthRT )
{
	this.colorTexture = colorRT;
	this.depthTexture = depthRT;
	this.RT_1 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false } );
	this.RT_2 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, depthBuffer: false, stencilBuffer: false } );
	
	this.scene = new THREE.Scene();
	
	this.camera = new THREE.Camera();
	this.camera.projectionMatrix = THREE.Matrix4.makeOrtho( -window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, -10000, 10000 );
	this.camera.position.z = 100;
	this.effects = {};
	
	this.depthFocus = { value: 0.5 };
	
	
	//////////////////// Create Blur Material //////////////////////////////
	var blurShader = AdditionalShaders[ "gauss" ];
	var blurUniforms = THREE.UniformsUtils.clone( blurShader.uniforms );
	var gaussKernelSize = 5;
	var gaussTexture = new THREE.Texture( createGaussTexture( gaussKernelSize ), new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.NearestFilter, THREE.NearestFilter );
	gaussTexture.needsUpdate = true;
	
	blurUniforms[ "tImg" ].texture = this.colorTexture;
	blurUniforms[ "tGauss" ].texture = gaussTexture;
	blurUniforms[ "tDepth" ].texture = this.depthTexture;
	blurUniforms[ "v2ImageSize" ].value = new THREE.Vector2( this.colorTexture.width, this.colorTexture.height );
	blurUniforms[ "v2SamplingDir" ].value = new THREE.Vector2( 1.0, 0.0 );
	
	var matGauss = new THREE.MeshShaderMaterial( {
		uniforms: blurUniforms,
		vertexShader: "#define KERNEL_SIZE " + gaussKernelSize + ".0\n" + blurShader.vertexShader,
		fragmentShader: "#define KERNEL_SIZE " + gaussKernelSize + ".0\n" + blurShader.fragmentShader,
		blending: THREE.NormalBlending,
		transparent: false
	} );
	
	this.effects[ "gauss" ] = matGauss;
	this.quad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), this.effects[ "gauss" ] );
	this.scene.addObject( this.quad );
	
	
	///////////////// Create DOF-Interpolation Material ////////////////////////
	var dofShader = AdditionalShaders[ "dofInterpolate" ];
	var dofUniforms = THREE.UniformsUtils.clone( dofShader.uniforms );
	
	dofUniforms[ "tImg" ].texture = this.colorTexture;
	dofUniforms[ "tBlurred" ].texture = this.RT_2;
	dofUniforms[ "tDepth" ].texture = this.depthTexture;
	
	var matDof = new THREE.MeshShaderMaterial( { 
		uniforms: dofUniforms,
		vertexShader: dofShader.vertexShader,
		fragmentShader: dofShader.fragmentShader,
		blending: THREE.NormalBlending,
		transparent: false
	   } );
	
	this.effects[ "dof" ] = matDof;
	
	this.applyGauss = function( renderer )
	{
		
		//////////////////// STEP 1: Blur entire Screen into RT_2 //////////////////////////////
		//Setup gauss effect
		var gaussMat = this.effects[ "gauss" ];
		this.quad.materials = [ gaussMat ];
		
		//Horizontal blur to RT_1
		gaussMat.uniforms[ "v2SamplingDir" ].value = new THREE.Vector2( 1.0, 0.0 );
		gaussMat.uniforms[ "tImg" ].texture = this.colorTexture;
		
		renderer.render( this.scene, this.camera, this.RT_1, true );
		
		//Vertical blur to RT_2
		gaussMat.uniforms[ "v2SamplingDir" ].value = new THREE.Vector2( 0.0, 1.0 );
		gaussMat.uniforms[ "tImg" ].texture = this.RT_1;
		 	
		renderer.render( this.scene, this.camera, this.RT_2, true );
		
		///////////////////////////////////////////////////////////////////////////////////////////////////////
		// STEP 2: Interpolate Between blurred Screen and sharp screen depending on focus depth onto screen ///
		///////////////////////////////////////////////////////////////////////////////////////////////////////
		var dofMat = this.effects[ "dof" ];
		this.quad.materials = [ dofMat ];
		
		dofMat.uniforms[ "fFocusDepth" ].value = this.depthFocus.value;
		renderer.render( this.scene, this.camera, null, true );
	};
	
	
	
	
	
	
};

Postpro.prototype.constructor = Postpro;



function createGaussTexture( kernelSize )
{
	var gaussValues = [ ];
	
	var sigma = kernelSize + 1;
	var e = 2.718281828;
	var gaussSum = 0.0;
	for( var i = 0; i <= kernelSize; ++i )
	{
		var x = Math.abs( i );
		var gauss = ( 1.0 / Math.sqrt( 2.0 * Math.PI * sigma * sigma ) ) * Math.pow( e, ( ( -x * x ) / ( 2.0 * sigma * sigma ) ) );
		gaussSum += gauss;
		gaussValues.push( gauss );
	}

	for( var i = 0; i < gaussValues.length; ++i )
	{
		gaussValues[ i ] /= gaussSum;
	}

	var canvas = document.createElement( 'canvas' );
	canvas.width = sigma;
	canvas.height = 1;
	var context = canvas.getContext( '2d' );
	var image = context.getImageData( 0, 0, sigma, i );


	var x = 0, y = 0;

	for ( var i = 0, j = 0, l = image.data.length; i < l; i += 4, j ++ ) 
	{
		image.data[ i ]		= gaussValues[ j ] * 255;
		image.data[ i + 1 ] = gaussValues[ j ] * 255;
		image.data[ i + 2 ] = gaussValues[ j ] * 255;
		image.data[ i + 3 ] = 255;
	}

	context.putImageData( image, 0, 0 );
	return canvas;
}