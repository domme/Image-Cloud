MeshArea = function( params )
{
	this.count = params.count !== undefined ? params.count : 20;
	this.pageNumber = params.pageNumber !== undefined ? params.pageNumber : 0;
	this.v3Min = params.v3Min !== undefined ? params.v3Min : new THREE.Vector3( 0.0, 0.0, 0.0 );
	this.v3Max = params.v3Max !== undefined ? params.v3Max : new THREE.Vector3( 1.0, 1.0, 1.0 );
	this.iStart = params.iStart !== undefined ? params.iStart : 0;
	this.iEnd = params.iEnd !== undefined ? params.iEnd : this.count - 1;
	this.meshes = params.meshes;
	this.animator = params.animator;
};

MeshArea.prototype =
{
	RebuildPositions : function()
	{
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			var currMesh = this.meshes[ i ];
			
			var endPos = new THREE.Vector3();
			
			endPos.x = this.v3Min.x + ( this.v3Max.x - this.v3Min.x ) * Math.random();
			endPos.y = this.v3Min.y + ( this.v3Max.y - this.v3Min.y ) * Math.random();
			endPos.z = this.v3Min.z + ( this.v3Max.z - this.v3Min.z ) * Math.random();
			
			animator.AddAnimation( { 
				interpolationType: "smoothstep", 
				dataType: "Vector3", 
				startValue: currMesh.position, 
				endValue: endPos,
				animValue: currMesh.position,
				duration: 2000,
				repetition: "oneShot"
			  } );
		}
	}
};
