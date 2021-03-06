AdditionalShaders = {
	
	
	'depthLinear' : 
	{
		uniforms : { "mNear" : { type: "f", value: 1.0 }, 
					 "mFar": { type:"f", value: 10000.0 },
					 "opacity" : { type: "f", value: 1.0 } 
					},
							
		vertexShader: 
		[
			"precision highp float;",
			"uniform float mNear;",
			"uniform float mFar;",
			
			"varying highp float fDepth;",
			
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
			"varying highp float fDepth;",
			
			"highp vec3 packFloatXYZ( float fValue )",
			"{",
				"highp vec3 packValues = vec3( 256.0 * 256.0, 256.0, 1.0 );",
				"return fract( packValues * vec3( fValue ) );",
			"}",

			"void main() {",
				"highp vec3 packedDepth = packFloatXYZ( fDepth );",
				"gl_FragColor = vec4( packedDepth.x, packedDepth.y, packedDepth.z, 1.0 );",
			"}"
		].join("\n"),
	},
	
	'dofInterpolate':
	{
		uniforms: { "tImg" : { type: "t", value: 0, texture: null },
					"tBlurred" : { type: "t", value: 1, texture: null },
					"tDepth" : { type: "t", value: 2, texture: null },
					"fFocusDepth": { type: "f", value: 0.5 },
					},
					
					
		vertexShader:
		  "precision highp float;				   \n\
		  varying vec2 v2uv;                       \n\
		                                           \n\
		  void main() {                            \n\
		     v2uv = vec2( uv.x, 1.0 - uv.y );      \n\
		     gl_Position = vec4( position, 1.0 );  \n\
		  }",
		
		fragmentShader:                  
			"precision highp float;                                                                                               \n\
			uniform sampler2D tImg;                                                                                               \n\
			uniform sampler2D tBlurred;                                                                                           \n\
			uniform sampler2D tDepth;                                                                                             \n\
			uniform float fFocusDepth;                                                                                            \n\
			                                                                                                                      \n\
			varying vec2 v2uv; 			                                                                                          \n\
			                                                                                                                      \n\
																																  \n\
			highp float unpackFloatRGB( vec3 vValue )                                                                             \n\
			{                                                                                                                     \n\
				highp vec3 v3UnpackValues = vec3( 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );   								  \n\
				return dot( vValue, v3UnpackValues );                                                                             \n\
			}                                                                				   							 		  \n\
			                                                                                           							  \n\
			void main()                                                                                							  \n\
			{                                                                                          							  \n\
				float fDepth = unpackFloatRGB( texture2D( tDepth, v2uv ).xyz );                        							  \n\
				mediump vec4 imgCol = texture2D( tImg, v2uv );                                                                    \n\
				mediump vec4 blurredCol = texture2D( tBlurred, v2uv );                                                            \n\
				                                                                                                                  \n\
				if( fDepth < 1.00 )                                                                                               \n\
				{                                                                                                                 \n\
				    float fFocus = abs( abs( fDepth ) - abs( fFocusDepth ) );                 			   						  \n\
					gl_FragColor = mix( imgCol, blurredCol, clamp( fFocus, 0.0, 1.0 ) );      									  \n\
				}                                                                                                                 \n\
				                                                                                                                  \n\
				else                                                                                                              \n\
				{                                                                                                                 \n\
					gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );                                                                    \n\
				}                                                                                                                 \n\
			}"					
	},
	
	
	'gauss':
	{
		uniforms: { "tImg" : { type: "t", value: 0, texture: null },
					"tGauss" : { type: "t", value: 1, texture: null },
					"tDepth" : { type: "t", value: 2, texture: null },
					"v2ImageSize": { type: "v2", value: new THREE.Vector2( 1024, 768 ) },
					"v2SamplingDir": { type: "v2", value: new THREE.Vector2( 1, 0 ) },
		 			},
		
		vertexShader:
		  "precision highp float;				   \n\
		  varying vec2 v2uv;                       \n\
		  uniform vec2 v2SamplingDir;              \n\
		                                           \n\
		  void main() {                            \n\
		     v2uv = uv;                            \n\
		     gl_Position = vec4( position, 1.0 );  \n\
		  }",                             
		
		
		fragmentShader:
			"precision highp float;	  \n\
			uniform sampler2D tImg;   \n\
			uniform sampler2D tGauss; \n\
			uniform sampler2D tDepth; \n\
			uniform vec2 v2ImageSize; \n\
			uniform vec2 v2SamplingDir;     \n\
			                                \n\
			varying vec2 v2uv;              \n\
			                                \n\
			float fGaussStep = 1.0 / ( KERNEL_SIZE + 1.0 );                                             \n\
			float fGaussStepHalf = fGaussStep / 2.0;                                                    \n\
			                                                                                            \n\
			float gauss( float x )                                                                      \n\
			{                                                                                           \n\
			   x = abs( x );                                                                            \n\
			   return texture2D( tGauss, vec2( x * fGaussStep + fGaussStepHalf, fGaussStepHalf ) ).x;   \n\
			}                                                                                           \n\
			                                                                                            \n\
			vec4 blurGauss()                                                                            \n\
			{                                                                                           \n\
			   float step;                                                                              \n\
			   vec2 stepBackHalf;                                                                       \n\
			                                                                                            \n\
			   if( v2SamplingDir.x > 0.0 )                                                              \n\
			   {                                                                                        \n\
			   		step = 1.0 / v2ImageSize.x;                                                         \n\
			   		stepBackHalf = vec2( 0.5, 0.0 ) * step;                                             \n\
			   }                                                                                        \n\
			                                                                                            \n\
			   else                                                                                     \n\
			   {                                                                                        \n\
			   		step = 1.0 / v2ImageSize.y;                                                         \n\
			   		stepBackHalf = vec2( 0.0, 0.5 ) * step;                                             \n\
			   }                                                                                        \n\
			                                                                                            \n\
			   float fthisWeight = 0.0;                                                                 \n\
			   float fWeights = 0.0;                                                                    \n\
			                                                                                            \n\
			   vec4 v4Color = vec4( 0.0, 0.0, 0.0, 0.0 );                                               \n\
			   vec2 v2SamplingPos;                                                                      \n\
			                                                                                            \n\
			   for( float i = -KERNEL_SIZE; i <= KERNEL_SIZE; ++i )                                     \n\
			   {                                                                                        \n\
			   		v2SamplingPos = ( v2uv + stepBackHalf ) + v2SamplingDir * i * step;                 \n\
					fthisWeight = gauss( i );                                                           \n\
					fWeights += fthisWeight;                                                            \n\
					v4Color += texture2D( tImg, v2SamplingPos ) * fthisWeight;				            \n\
			   }                                                                                        \n\
			   	                                                                                        \n\
			   return v4Color / fWeights;                                                               \n\
			}                                                                                           \n\
			                                                                                            \n\
			void main()                                                                                 \n\
			{                                                                                           \n\
				float fDepth = texture2D( tDepth, v2uv ).z;                                             \n\
				                                                                                        \n\
				if( fDepth < 0.99 )                                                                     \n\
					gl_FragColor = vec4( blurGauss().xyz, 1.0 );                                        \n\
				                                                                                        \n\
				else                                                                                    \n\
					gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );								            \n\
			}"
	},                                            
	
	
	

	
	'gaussDof':
	{
		uniforms: { "tDepth" : { type: "t", value: 0, texture: null },
					"tImg" : { type: "t", value: 1, texture: null },
					"tGauss" : { type: "t", value: 2, texture: null },
					"v2ImageSize": { type: "v2", value: new THREE.Vector2( 1024, 768 ) },
					"v2SamplingDir": { type: "v2", value: new THREE.Vector2( 1, 0 ) },
					"fFocusDepth": { type: "f", value: 0.5 },
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
			"uniform sampler2D tGauss;",
			"uniform vec2 v2ImageSize;",
			"uniform vec2 v2SamplingDir;",
			"uniform float fFocusDepth;",
			
			"varying vec2 v2uv;",
						
			"float e = 2.718281828;",
			"float pi = 3.14159265;",
			"float fGaussStep = 1.0 / ( KERNEL_SIZE + 1.0 );",
			"float fGaussStepHalf = fGaussStep / 2.0;",
			
			"float gauss( float x )",
			"{",
				"x = abs( x );",
				"return texture2D( tGauss, vec2( x * fGaussStep + fGaussStepHalf, fGaussStepHalf ) ).x;",
			"}",
			
			"vec4 blurGauss( float fDepth )",
			"{",
				"float fFocus = max( fDepth, fFocusDepth ) - min( fDepth, fFocusDepth );",
				//"float fFocus = fFocus;",
			
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
				
				"vec4 v4Color = vec4( 0.0, 0.0, 0.0, 0.0 );",
				"vec2 v2SamplingPos;",
				
				"step *= min( 1.0, fFocus );",
				
				"for( float i = -KERNEL_SIZE; i <= KERNEL_SIZE; ++i )",
				"{",
					"v2SamplingPos = v2uv + v2SamplingDir * i * step; //min( 1.0, fDepth * 2.0 );",
					"fthisWeight = gauss( float( i ) );",
					"fWeights += fthisWeight;",
					"v4Color += texture2D( tImg, v2SamplingPos ) * fthisWeight;",					
				"}",
					
				"return v4Color / fWeights;",
			"}",
			
			"void main()", 
			"{",
				"float fDepth = texture2D( tDepth, v2uv ).x;",
							
				"if( fDepth < 0.99 )",
				"{",
					"gl_FragColor = vec4( blurGauss( fDepth ).xyz, 1.0 );",
				"}",
				
				"else",
				"{",
					"gl_FragColor = texture2D( tImg, v2uv );",
				"}",
				
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
				
				"if( fDepth < 0.9 )",
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