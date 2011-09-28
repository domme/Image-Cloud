var AdditionalShaders;
AdditionalShaders = {
  'depthLinear': {
    uniforms: {
      "mNear": {
        type: "f",
        value: 1.0
      },
      "mFar": {
        type: "f",
        value: 10000.0
      },
      "opacity": {
        type: "f",
        value: 1.0
      }
    },
    vertexShader: "precision highp float;			uniform float mNear;			uniform float mFar;						varying highp float fDepth;						void main() {				vec4 v4ViewPos  = modelViewMatrix * vec4( position * 1.3, 1.0 );				fDepth = abs( v4ViewPos.z / mFar );								gl_Position = projectionMatrix * v4ViewPos;			}",
    fragmentShader: "precision highp float;			uniform float opacity;			varying highp float fDepth;						highp vec3 packFloatXYZ( float fValue )			{				highp vec3 packValues = vec3( 256.0 * 256.0, 256.0, 1.0 );				return fract( packValues * vec3( fValue ) );			}			void main() {				highp vec3 packedDepth = packFloatXYZ( fDepth );				gl_FragColor = vec4( packedDepth.x, packedDepth.y, packedDepth.z, 1.0 );			}"
  },
  'dofInterpolate': {
    uniforms: {
      "tImg": {
        type: "t",
        value: 0,
        texture: null
      },
      "tBlurred": {
        type: "t",
        value: 1,
        texture: null
      },
      "tDepth": {
        type: "t",
        value: 2,
        texture: null
      },
      "fFocusDepth": {
        type: "f",
        value: 0.5
      }
    },
    vertexShader: "precision highp float;		  varying vec2 v2uv;		                                          		  void main() {                           		     v2uv = vec2( uv.x, 1.0 - uv.y );     		     gl_Position = vec4( position, 1.0 ); 		  }",
    fragmentShader: "precision highp float;			uniform sampler2D tImg;    			uniform sampler2D tBlurred;			uniform sampler2D tDepth;  			uniform float fFocusDepth;                                        			varying vec2 v2uv;         									   			highp float unpackFloatRGB( vec3 vValue )                            			{                                                                                 				highp vec3 v3UnpackValues = vec3( 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );				return dot( vValue, v3UnpackValues );                                         			}                                                                				  			                                                                                  			void main()                                                                       			{                                                                                 				float fDepth = unpackFloatRGB( texture2D( tDepth, v2uv ).xyz );               				mediump vec4 imgCol = texture2D( tImg, v2uv );                                				mediump vec4 blurredCol = texture2D( tBlurred, v2uv );                        				float fFocus = abs( fDepth - fFocusDepth );                 								gl_FragColor = mix( imgCol, blurredCol, clamp( fFocus * 5.0, 0.0, 1.0 ) );				/*gl_FragColor = vec4( fFocus, fFocus, fFocus, 1.0 ); */			}"
  },
  'gauss': {
    uniforms: {
      "tImg": {
        type: "t",
        value: 0,
        texture: null
      },
      "tGauss": {
        type: "t",
        value: 1,
        texture: null
      },
      "tDepth": {
        type: "t",
        value: 2,
        texture: null
      },
      "v2ImageSize": {
        type: "v2",
        value: new THREE.Vector2(1024, 768)
      },
      "v2SamplingDir": {
        type: "v2",
        value: new THREE.Vector2(1, 0)
      }
    },
    vertexShader: "precision highp float;		   varying vec2 v2uv;		   uniform vec2 v2SamplingDir;		                                          		  void main() {		     v2uv = uv;		     gl_Position = vec4( position, 1.0 );		  }",
    fragmentShader: "precision highp float;	 			uniform sampler2D tImg;  			uniform sampler2D tGauss;			uniform sampler2D tDepth;			uniform vec2 v2ImageSize;  			uniform vec2 v2SamplingDir;			                           			varying vec2 v2uv;         			                                                                                         			float fGaussStep = 1.0 / ( KERNEL_SIZE + 1.0 );                                          			float fGaussStepHalf = fGaussStep / 2.0;                                                 			                                                                                         			float gauss( float x )                                                                   			{                                                                                        			   x = abs( x );                                                                         			   return texture2D( tGauss, vec2( x * fGaussStep + fGaussStepHalf, fGaussStepHalf ) ).x;			}                                                                                        			                                                                                         			vec4 blurGauss()                                                                         			{                                                                                        			   float step;                                                                           			   vec2 stepBackHalf;                                                                    			                                                                                         			   if( v2SamplingDir.x > 0.0 )                                                           			   {                                                                                     			   		step = 1.0 / v2ImageSize.x;                                                      			   		stepBackHalf = vec2( 0.5, 0.0 ) * step;                                          			   }                                                                                     			                                                                                         			   else                                                                                  			   {                                                                                     			   		step = 1.0 / v2ImageSize.y;                                                      			   		stepBackHalf = vec2( 0.0, 0.5 ) * step;                                          			   }                                                                                     			                                                                                         			   float fthisWeight = 0.0;                                                              			   float fWeights = 0.0;                                                                 			                                                                                         			   vec4 v4Color = vec4( 0.0, 0.0, 0.0, 0.0 );                                            			   vec2 v2SamplingPos;                                                                   			                                                                                         			   for( float i = -KERNEL_SIZE; i <= KERNEL_SIZE; ++i )                                  			   {                                                                                     			   		v2SamplingPos = ( v2uv + stepBackHalf ) + v2SamplingDir * i * step;              					fthisWeight = gauss( i );                                                        					fWeights += fthisWeight;                                                         					v4Color += texture2D( tImg, v2SamplingPos ) * fthisWeight;				         			   }                                                                                     			   	                                                                                     			   return v4Color / fWeights;                                                            			}						highp float unpackFloatRGB( vec3 vValue )                            			{                                                                                 				highp vec3 v3UnpackValues = vec3( 1.0 / ( 256.0 * 256.0 ), 1.0 / 256.0, 1.0 );				return dot( vValue, v3UnpackValues );                                         			}                                                                                   			                                                                                         			void main()                                                                              			{   				/*float fDepth = unpackFloatRGB( texture2D( tDepth, v2uv ).xyz );*/			    gl_FragColor = vec4( blurGauss().xyz, 1.0 );			}"
  }
};