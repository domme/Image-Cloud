Postpro = function ( colorRT, depthRT )
{
	this.colorTexture = colorRT;
	this.depthTexture = depthRT;
	this.RT_1 = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBFormat, stencilBuffer: false } );
	this.scene = new THREE.Scene();
	
	this.camera = new THREE.Camera();
	this.camera.projectionMatrix = THREE.Matrix4.makeOrtho( -window.innerWidth / 2, window.innerWidth / 2, window.innerHeight / 2, -window.innerHeight / 2, -10000, 10000 );
	this.camera.position.z = 100;
	this.effects = {};
	
	//////////////////// Create Blur Material //////////////////////////////
	var blurShader = AdditionalShaders[ "gaussDof" ];
	var blurUniforms = THREE.UniformsUtils.clone( blurShader.uniforms );
	
	blurUniforms[ "tDepth" ].texture = this.depthTexture;
	blurUniforms[ "tImg" ].texture = this.colorTexture;
	blurUniforms[ "v2ImageSize" ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
	blurUniforms[ "v2SamplingDir" ].value = new THREE.Vector2( 1.0, 0.0 );
	
	var matGauss = new THREE.MeshShaderMaterial( {
		uniforms: blurUniforms,
		vertexShader: blurShader.vertexShader,
		fragmentShader: blurShader.fragmentShader,
		blending: THREE.NormalBlending,
		transparent: true
	} );
	
	this.effects[ "gauss" ] = matGauss;
	this.quad = new THREE.Mesh( new THREE.Plane( 2, 2 ), this.effects[ "gauss" ] );
	this.scene.addObject( this.quad );
	
	this.applyGauss = function( renderer )
	{
		//Setup gauss effect
		var gaussMat = this.effects[ "gauss" ];
		this.quad.materials = [ gaussMat ];
		
		//Horizontal blur to RT_1
		gaussMat.uniforms[ "v2SamplingDir" ].value = new THREE.Vector2( 1.0, 0.0 );
		gaussMat.uniforms[ "tImg" ].texture = this.colorTexture;
		
		renderer.render( this.scene, this.camera, this.RT_1, true );
		//renderer.render( this.scene, this.camera );
		
		//Vertical blur to the screen
		gaussMat.uniforms[ "v2SamplingDir" ].value = new THREE.Vector2( 0.0, 1.0 );
		gaussMat.uniforms[ "tImg" ].texture = this.RT_1;
		 	
		renderer.render( this.scene, this.camera );
	};
};

Postpro.prototype.constructor = Postpro;