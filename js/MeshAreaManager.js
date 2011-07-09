MeshAreaManager = function( params )
{
	this.meshAreas = [];
	
	this.numMeshesMax = params.numMeshesMax;
	this.numMeshesPerArea = params.numMeshesPerArea;
	this.camera = params.camera;
	this.meshes = params.meshes;
	this.meshMaterials = params.meshMaterials;
	this.v3DimensionsMin = params.v3DimensionsMin;
	this.v3DimensionsMax = params.v3DimensionsMax;
	this.animator = params.animator;
	this.ThreeScene = params.scene;
	
	
	this.numAreas = Math.ceil( this.numMeshesMax / this.numMeshesPerArea );
	this.bDebug = true;
	this.bVisited = false;
	this.iTriggerOffset = 2;
	
	this.iLast = this.numAreas - 1;
	this.iFirst = 0;
	this.bDebug = true;	
	
	var lengthZ = Math.abs( this.v3DimensionsMax.z - this.v3DimensionsMin.z );
	var stepZ = lengthZ / this.numAreas;
	
	for( var i = 0; i < this.numAreas; ++i )
	{
		var currMin = new THREE.Vector3( this.v3DimensionsMin.x, this.v3DimensionsMin.y, - i * stepZ );
		var currMax = new THREE.Vector3( this.v3DimensionsMax.x, this.v3DimensionsMax.y, - ( i + 1 ) * stepZ );
		this.meshAreas.push( new MeshArea( { count : this.numMeshesPerArea,
			 							pageNumber : i + 1,
										v3Min : currMin,
										v3Max : currMax,
			 							iStart : i * this.numMeshesPerArea,
			 							iEnd : ( i * this.numMeshesPerArea ) + ( this.numMeshesPerArea - 1 ),
										meshes : this.meshes
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
};

MeshAreaManager.prototype =
{
	Update : function()
	{
		var cPos = this.camera.position;
		var iNext = -1;
		
		var iPageTrigger = this.iFirst;	
		for( var i = 0; i < this.iTriggerOffset; ++i )
		{
			iPageTrigger = iPageTrigger < this.numAreas - 1 ? iPageTrigger + 1 : 0;
		}
		
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
					if( i == iPageTrigger )
					{
						var firstArea = this.meshAreas[ this.iFirst ];
						var lastArea = this.meshAreas[ this.iLast ];
						
						var fDistanceMoved = Math.abs( lastArea.v3Min.z - firstArea.v3Min.z );
						
						firstArea.v3Min = new THREE.Vector3( lastArea.v3Min.x, lastArea.v3Min.y, lastArea.v3Max.z );
						firstArea.v3Max = new THREE.Vector3( lastArea.v3Max.x, lastArea.v3Max.y, lastArea.v3Max.z - Math.abs( lastArea.v3Max.z - lastArea.v3Min.z ) );
						
						if( this.bDebug )
							firstArea.debugMesh.position = new THREE.Vector3( firstArea.debugMesh.position.x, firstArea.debugMesh.position.y, firstArea.debugMesh.position.z - fDistanceMoved );
						
						firstArea.pageNumber = lastArea.pageNumber + 1;
						
						firstArea.GetNewPhotos();
						firstArea.RebuildPositions( true );

						this.iLast = this.iFirst;
						this.iFirst = this.iFirst < this.numAreas - 1 ? this.iFirst + 1 : 0;
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
			///////////////////////////////////////////////////////
					
		}
	},
	
	RebuildPositions : function()
	{
		for( var i = 0; i < this.numAreas; ++i )
		{
			this.meshAreas[ i ].RebuildPositions( true );
		}
	}
};