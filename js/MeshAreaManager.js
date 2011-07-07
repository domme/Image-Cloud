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
	
	this.numAreas = Math.ceil( this.numMeshesMax / this.numMeshesPerArea );
	this.bDebug = true;
	
	var lengthZ = Math.abs( this.v3DimensionsMax.z - this.v3DimensionsMin.z );
	var stepZ = lengthZ / this.numAreas;
	
	for( var i = 0; i < this.numAreas; ++i )
	{
		var currMin = new THREE.Vector3( this.v3DimensionsMin.x, this.v3DimensionsMin.y, i * stepZ );
		var currMax = new THREE.Vector3( this.v3DimensionsMax.x, this.v3DimensionsMax.y, ( i + 1 ) * stepZ );
		this.meshAreas.push( new MeshArea( { count : this.numMeshesPerArea,
			 							pageNumber : i,
										v3Min : currMin,
										v3Max : currMax,
			 							iStart : i * this.numMeshesPerArea,
			 							iEnd : ( i * this.numMeshesPerArea ) + ( this.numMeshesPerArea - 1 ),
										meshes : this.meshes
									  } ) );
	}
};

MeshAreaManager.prototype =
{
	Update : function()
	{
		
	},
	
	RebuildPositions : function()
	{
		for( var i = 0; i < this.numAreas; ++i )
		{
			this.meshAreas[ i ].RebuildPositions();
		}
	}
};