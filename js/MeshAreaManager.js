
MeshAreaManager = function( params )
{
	this.meshAreas = [];
	this.urls = [];
	
	this.numMeshesMax = params.numMeshesMax;
	this.numMeshesPerArea = params.numMeshesPerArea;
	this.camera = params.camera;
	this.meshes = params.meshes;
	this.meshMaterials = params.meshMaterials;
	this.v3DimensionsMin = params.v3DimensionsMin;
	this.v3DimensionsMax = params.v3DimensionsMax;
	this.animator = params.animator;
	this.ThreeScene = params.scene;
	this.loadingTexture = params.loadingTexture;
	this.clearColor = params.clearColor;
	this.urlFetchTimes = 1;
	this.bInit = false;
	
	
	this.numAreas = Math.ceil( this.numMeshesMax / this.numMeshesPerArea );
	this.bDebug = true;
	this.bVisited = false;
	this.iTriggerOffset = 3;
	
	this.iLast = this.numAreas - 1;
	this.iFirst = 0;
	this.bDebug = false;	
	this.urlFetchLock = false;
	
	this.oldCamPos = new THREE.Vector3( 0.0, 0.0, 0.0 );
	
	var lengthZ = Math.abs( this.v3DimensionsMax.z - this.v3DimensionsMin.z );

	this.stepZ = lengthZ / this.numAreas;
	
	this.GetNextURLs( 2000 );
};

MeshAreaManager.prototype =
{
	GetNextURLs : function( amount )
	{
		this.urlFetchLock = true;
		var manager = this;
				
		$.getJSON("http://img.ly/beautiful.json?page=" + manager.urlFetchTimes + "&per_page=" + amount + "&jsoncallback=?", function (data) 
		{
			$.each(data, function (i, item) 
			{	
				var scr_temp = item.scape_image_url;
				var scr_temp_large = item.image_url;

				if( scr_temp.substr( 0,7 ) !== "http://" )		
					scr_temp = 'http://img.ly' + scr_temp;

				if( scr_temp_large.substr( 0, 7 ) !== "http://" )
					scr_temp_large = 'http://img.ly' + scr_temp_large;
					
				manager.urls.push( { small : scr_temp, large : scr_temp_large } );
			});
			
			delete data;
			
			manager.urlFetchLock = false;
			
			if( !manager.bInit )
				manager.Init();

		});
		
		manager.urlFetchTimes++;
	},
	
	Init : function()
	{
		for( var i = 0; i < this.numAreas; ++i )
		{
			var currMin = new THREE.Vector3( this.v3DimensionsMin.x, this.v3DimensionsMin.y, - i * this.stepZ );
			var currMax = new THREE.Vector3( this.v3DimensionsMax.x, this.v3DimensionsMax.y, - ( i + 1 ) * this.stepZ );
			this.meshAreas.push( new MeshArea( { count : this.numMeshesPerArea,
				 							pageNumber : i + 1,
											v3Min : currMin,
											v3Max : currMax,
				 							iStart : i * this.numMeshesPerArea,
				 							iEnd : ( i * this.numMeshesPerArea ) + ( this.numMeshesPerArea - 1 ),
											meshes : this.meshes,
											meshMaterials : this.meshMaterials,
											loadingTexture : this.loadingTexture,
											animator : this.animator,
											urls : this.urls,
											clearColor: this.clearColor,
											scene : this.ThreeScene
										  } ) );


			if( this.bDebug )
			{
				var geometry = new THREE.Geometry();

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMin.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMin.y, currMin.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMin.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMax.y, currMin.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMax.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMax.y, currMin.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMax.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMin.y, currMin.z ) ) );



				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMin.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMin.y, currMax.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMax.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMax.y, currMax.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMax.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMax.y, currMax.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMin.y, currMin.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMin.y, currMax.z ) ) );



				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMin.y, currMax.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMin.y, currMax.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMin.y, currMax.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMax.y, currMax.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMax.x, currMax.y, currMax.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMax.y, currMax.z ) ) );

				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMax.y, currMax.z ) ) );
				geometry.vertices.push( new THREE.Vertex( new THREE.Vector3( currMin.x, currMin.y, currMax.z ) ) );

				var line_material = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 0.9 } );
				var line = new THREE.Line( geometry, line_material, THREE.LinePieces );

				this.meshAreas[ this.meshAreas.length - 1 ].debugMesh = line;

				this.ThreeScene.addObject( line );
			}
		}

		for( var i = 0; i < this.meshes.length; ++i )
		{
			this.ThreeScene.addObject( this.meshes[ i ] );
		}

		this.areaPageTravelZ = Math.abs( this.meshAreas[ this.iLast ].v3Max.z - this.meshAreas[ this.iFirst ].v3Max.z ) + this.stepZ;
		
		this.bInit = true;
		this.camera.bInit = true;
		

		this.animator.bInit = true;
		this.RebuildPositions();
	},

	Update : function()
	{
		if( !this.bInit )
			return;
			
		var cPos = this.camera.position;
		var cHeadingZ = cPos.z - this.oldCamPos.z;
		
		var iRemainingURLs = this.urls.length - this.meshAreas[ this.iLast ].pageNumber * this.meshAreas[ this.iLast ].count;
		
		if( iRemainingURLs < 500 && !this.urlFetchLock )
			this.GetNextURLs( 1000 );
		
		
		//if( Math.abs( cHeadingZ ) < 0.0001 ) //camera hasn't moved since last frame
		//	return;
		
		var iNext = -1;
		
		var iPageTriggerForward = this.iFirst;	
		var iPageTriggerBackward = this.iFirst < this.numAreas - 1 ? this.iFirst + 1 : 0;
		
		for( var i = 0; i < this.iTriggerOffset; ++i )
		{
			iPageTriggerForward = iPageTriggerForward < this.numAreas - 1 ? iPageTriggerForward + 1 : 0;
		}
		
		//DEBUG
		if( this.bDebug )
		for( var i = 0; i < this.numAreas; ++i )
		{
			var currArea = this.meshAreas[ i ];
			
			if( i == iPageTriggerForward )
				currArea.debugMesh.materials[ 0 ] = new THREE.LineBasicMaterial( { color: 0x00ff00, opacity: 0.9, linewidth : 3 } );
				
			else if( i == iPageTriggerBackward )
				currArea.debugMesh.materials[ 0 ] = new THREE.LineBasicMaterial( { color: 0x0000ff, opacity: 0.9, linewidth : 3 } );
				
			else
				currArea.debugMesh.materials[ 0 ] = new THREE.LineBasicMaterial( { color: 0xff0000, opacity: 0.9 } );	
		}
		// /Debug
		
		
		
				
		for( var i = 0; i < this.numAreas; ++i )
		{
			var area = this.meshAreas[ i ];
			
			var min = area.v3Min;
			var max = area.v3Max;
			
			if( cPos.x > min.x && cPos.x < max.x &&
				cPos.y > min.y && cPos.y < max.y &&
				cPos.z < min.z && cPos.z > max.z )
				{
					// LOD-Switching between lowres and highres pictures
					iNext = i < this.numAreas - 1 ? i + 1 : 0;
					var area_next = this.meshAreas[ iNext ];
				
					area.switchToLarge();
					area.bVisited = true;
						
					area_next.switchToLarge();
					area_next.bVisited = true;
						
					for( var k = 0; k < this.numAreas; ++k )
					{
						var kArea = this.meshAreas[ k ];
						if( kArea.bVisited && kArea !== area && kArea !== area_next )
						{
							kArea.switchToSmall();
							kArea.bVisited = false;
						}
					}
					

					
					//Page-Streaming forward
					if( i == iPageTriggerForward && cHeadingZ < -0.00001 )
					{
						var firstArea = this.meshAreas[ this.iFirst ];
						var lastArea = this.meshAreas[ this.iLast ];
						
						firstArea.v3Min = new THREE.Vector3( lastArea.v3Min.x, lastArea.v3Min.y, lastArea.v3Max.z );
						firstArea.v3Max = new THREE.Vector3( lastArea.v3Max.x, lastArea.v3Max.y, lastArea.v3Max.z - this.stepZ );
						
						if( this.bDebug )
							firstArea.debugMesh.position = new THREE.Vector3( firstArea.debugMesh.position.x, firstArea.debugMesh.position.y, firstArea.debugMesh.position.z - this.areaPageTravelZ );
						
						firstArea.particleMesh.position.z -= this.areaPageTravelZ
						
						firstArea.pageNumber = lastArea.pageNumber + 1;
						
						firstArea.GetNewPhotos();
						firstArea.RebuildPositions( false );

						this.iLast = this.iFirst;
						this.iFirst = this.iFirst < this.numAreas - 1 ? this.iFirst + 1 : 0;
					}
					
					//Page Streaming backward
					else if( i == iPageTriggerBackward && cHeadingZ > 0.00001 )
					{
						var firstArea = this.meshAreas[ this.iFirst ];
						var lastArea = this.meshAreas[ this.iLast ];
						
						if( firstArea.pageNumber < 1 )
							break;
						
						var fDistanceMoved = Math.abs( lastArea.v3Min.z - firstArea.v3Min.z );
						
						lastArea.v3Min = new THREE.Vector3( firstArea.v3Min.x, firstArea.v3Min.y, firstArea.v3Min.z + this.stepZ );
						lastArea.v3Max = new THREE.Vector3( firstArea.v3Max.x, firstArea.v3Max.y, firstArea.v3Min.z );
						
						if( this.bDebug )
							lastArea.debugMesh.position =  new THREE.Vector3( lastArea.debugMesh.position.x, lastArea.debugMesh.position.y, lastArea.debugMesh.position.z + this.areaPageTravelZ );
						
						lastArea.particleMesh.position.z += this.areaPageTravelZ;
						
						lastArea.pageNumber = firstArea.pageNumber - 1;	
						
						lastArea.GetNewPhotos();
						lastArea.RebuildPositions( false );
						
						this.iFirst = this.iLast;
						this.iLast = this.iLast > 0 ? this.iLast - 1 : this.numAreas - 1;
					}
					
				}
				
				else
				{
					if( i !== iNext )
					{
						area.switchToSmall();
						area.bVisited = false;
					}
				}		
		}
		
		this.oldCamPos = this.camera.position.clone();
	},
	
	RebuildPositions : function()
	{
		if( !this.bInit )
			return;
		
		for( var i = 0; i < this.numAreas; ++i )
		{
			this.meshAreas[ i ].RebuildPositions( true );
		}
	},
	
	setBrightTheme : function()
	{
		for( var i = 0; i < this.numAreas; ++i )
		{
			this.meshAreas[ i ].particleMat.color = new THREE.Color( 0x050505 );
		}
	},
	
	setDarkTheme : function()
	{
		for( var i = 0; i < this.numAreas; ++i )
		{
			this.meshAreas[ i ].particleMat.color = new THREE.Color( 0xD6D6D6 );
		}
	}
};