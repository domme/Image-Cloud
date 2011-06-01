AdditionalShaders = {
	
	
	'gaussDof':
	{
		uniforms: { "tDepth" : { type: "t", value: 0, texture: null },
					"tImg" : { type: "t", value: 1, texture: null },
					"v2ImageSize": { type: "v2", value: new THREE.Vector2( 1024, 768 ) },
					"v2SamplingDir": { type: "v2", value: new THREE.Vector2( 1, 0 ) },
		 			},
		
		vertexShader:
		[
			"precision highp float;",
			"varying vec2 v2uv;",
			
			"void main() {",
				"v2uv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = vec4( position, 1.0 );",	
			"}"
		].join( "\n" ),
		
		fragmentShader:
		[
			"precision highp float;",
			"uniform sampler2D tDepth;",
			"uniform sampler2D tImg;",
			"uniform vec2 v2ImageSize;",
			"uniform vec2 v2SamplingDir;",
			"varying vec2 v2uv;",
			
			"float e = 2.718281828;",
			"float pi = 3.14159265;",
			
			"float gauss( float x )",
			"{",
				"float o = 5.0;",
				"return ( 1.0 / sqrt( 2.0 * pi * o * o ) ) * pow( e, ( ( -x * x ) / ( 2.0 * o * o ) ) );",
			"}",
			
			"float gaussNorm(  )",
			"{",
				"return gauss( 0.0 ) + 2.0*gauss( 1.0 ) + 2.0*gauss( 2.0 ) + 2.0*gauss( 3.0 );",
			"}",
			
			"vec4 blurGauss( )",
			"{",
				"float step;",
				"vec2 stepBackHalf;",
				
				"if( v2SamplingDir.x > 0.0 )",
				"{",
					"step = 1.0 / v2ImageSize.x;",
					"stepBackHalf = vec2( 0.5, 0.0 ) * step;",
				"}",
				
				"else",
				"{",
					"step = 1.0 / v2ImageSize.y;",
					"stepBackHalf = vec2( 0.0, 0.5 ) * step;",
				"}",
				
				"float fthisWeight = 0.0;",
				"float fWeights = 0.0;",
				"float fGaussNorm = gaussNorm();",

				"vec4 v4Color = vec4( 0.0, 0.0, 0.0, 0.0 );",
				"vec2 v2SamplingPos;",
				
				"for( int i = -2; i <= 2; ++i )",
				"{",
					"v2SamplingPos = ( v2uv + stepBackHalf ) + v2SamplingDir * float( float( i ) ) * step;",
					"fthisWeight = gauss( float( i ) )/ fGaussNorm;",
					"fWeights += fthisWeight;",
					"v4Color += texture2D( tImg, v2SamplingPos ) * fthisWeight;",					
				"}",
					
				"return v4Color / fWeights;",
			"}",
			
			"void main() {",
				"float fDepth = texture2D( tDepth, v2uv ).x;",
				
				"if( fDepth > 0.001 )",
				"{",
					"gl_FragColor = vec4( blurGauss().xyz, 1.0 );",
				"}",
				
				"else",
					"gl_FragColor = texture2D( tImg, v2uv );",
			"}"
		].join( "\n" ),
	},
	
	
	
		
	'depthOfField' :
	{
		
		uniforms: { "tDepth" : { type: "t", value: 0, texture: null },
					"tImg" : { type: "t", value: 1, texture: null },
					"v2ImageSize": { type: "v2", value: new THREE.Vector2( 1024, 768 ) },
		 			},
		
		vertexShader:
		[
			"precision highp float;",
			"varying vec2 v2uv;",
			
			"void main() {",
				"v2uv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = vec4( position, 1.0 );",	
			"}"
		].join( "\n" ),
		
		fragmentShader:
		[
			"precision highp float;",
			"uniform sampler2D tDepth;",
			"uniform sampler2D tImg;",
			"uniform vec2 v2ImageSize;",
			"varying vec2 v2uv;",
			
			"void main() {",
				"float fDepth = texture2D( tDepth, v2uv ).x;",
				
				"if( fDepth > 0.001 )",
				"{",
					"float fUstep = 1.0 / v2ImageSize.x;",
					"float fVstep = 1.0 / v2ImageSize.y;",
								
					"vec3 v3Color = vec3( 0.0, 0.0, 0.0 );",
					"int iCount = 0;",
								
					"for( int u = -4; u < 4; u++ )",
					"{",
							"for( int v = -4; v < 4; v++ )",
							"{",
									"float currU = v2uv.x + float( u ) * fUstep * ( 1.0 - fDepth );",
									"float currV = v2uv.y + float( v ) * fVstep * ( 1.0 - fDepth );",
									"v3Color += texture2D( tImg, vec2( currU, currV ) ).xyz;",
									"iCount++;",
							"}",
					"}",
				
					"v3Color = v3Color / max( 1.0, float( iCount ) );",
								
					"gl_FragColor = vec4( v3Color, 1.0 );",
				"}",
				
				"else",
					"gl_FragColor = texture2D( tImg, v2uv );",
			"}"
		].join( "\n" ),
	},

	'depthLinear' : 
	{
		uniforms : { "mNear" : { type: "f", value: 1.0 }, 
					 "mFar": { type:"f", value: 2000.0 },
					 "opacity" : { type: "f", value: 1.0 } 
					},
							
		vertexShader: 
		[
			"precision highp float;",
			"uniform float mNear;",
			"uniform float mFar;",
			
			"varying float fDepth;",
			
			"void main() {",
				"vec4 v4ViewPos  = modelViewMatrix * vec4( position, 1.0 );",
				"fDepth = abs( v4ViewPos.z / mFar );",
				
				"gl_Position = projectionMatrix * v4ViewPos;",	
			"}"
		].join( "\n" ),
				
		fragmentShader: 
		[
			"precision highp float;",
			"uniform float opacity;",
			"varying float fDepth;",

			"void main() {",
				"gl_FragColor = vec4( vec3( fDepth ), opacity );",
			"}"
		].join("\n"),
	},
	
	
	'ssaoPostpro' : 
	{
		
		uniforms: 	{
						"tDepth" : { type: "t", value: 0, texture: null },
						"tRandoms" : { type: "t", value: 1, texture: null },
						"mNear" : { type: "f", value: 1.0 },
						"mFar" : { type: "f", value: 2000.0 },
						"opacity" : { type: "f", value: 1.0 },
						"screenWidth" : { type: "i", value: 512 },
						"screenHeight": { type: "i", value: 512 }
					},
					
		fragmentShader: [
				"precision highp float;",
				"uniform sampler2D tDepth;",
				"uniform sampler2D tRandoms;",
				"uniform float mNear;",
				"uniform float mFar;",
				"uniform int screenWidth;",
				"uniform int screenHeight;",
				"uniform float opacity;",
				"varying vec2 vUv;",

				"float fBaseDepth;",
				"vec2 v2UV;",
								
				"void main() {",
				
					"fBaseDepth = texture2D( tDepth, vUv ).x;",
					
					"if( fBaseDepth > 0.001 )",
					"{",
						"vec3 v3SSPos = vec3( vUv.x, vUv.y, fBaseDepth );",
						"vec2 v2Rot = vec2( vUv.x * float( screenWidth ), vUv.y * float( screenHeight ) ) / 4.0;",
						"vec3 v3Rot = normalize( texture2D( tRandoms, v2Rot ).xyz );",
						"float fAccess = 0.0;",
		
						"for( float ux = 0.0; ux < 1.0; ux += 0.25 )",
						"{",			
							"for( float vy = 0.0; vy < 1.0; vy += 0.25 )",
							"{",
									"vec3 v3Sample = reflect( texture2D( tRandoms, vec2( ux, vy ) ).xyz, v3Rot );",
									//"vec3 v3Sample = texture2D( tRandoms, vec2( ux, vy ) ).xyz * 1.0 / fBaseDepth;",
									"vec3 v3PosDir = vec3( v3Sample.x * (  1.0 / ( float( screenWidth ) / 10.0 ) ), v3Sample.y * ( 1.0 / ( float( screenHeight ) / 10.0 ) ), v3Sample.z * ( 1.0 / mFar ) );",
									"vec3 v3CurrSamplePos = v3SSPos + v3PosDir;",
							
									"float fSampleDepth = texture2D( tDepth, vec2( v3CurrSamplePos.x, v3CurrSamplePos.y ) ).x;",
							
									"fAccess += float( fSampleDepth + 0.01 > v3CurrSamplePos.z );",														
							"}",
						"}",
						
						"fAccess /= 16.0;",
						
						//"gl_FragColor = vec4( vec3( fBaseDepth ), opacity );",
						"gl_FragColor = vec4( vec3( fAccess ), opacity );",
					"}",
					
					"else",
					"{",
						"gl_FragColor = vec4( vec3( 1.0, 1.0, 1.0 ), opacity );",
					"}",
					
				"}"
		].join( "\n" ),
		
		vertexShader: [
			
			"precision highp float;",
			"varying vec2 vUv;",

			"void main() {",

				"vUv = vec2( uv.x, 1.0 - uv.y );",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

			"}"

		].join("\n"),
		
	}
	
	
		
};