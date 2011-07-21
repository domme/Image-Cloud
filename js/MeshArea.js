MeshArea = function( params )
{
	this.count = params.count !== undefined ? params.count : 20;
	this.pageNumber = params.pageNumber !== undefined ? params.pageNumber : 0;
	this.v3Min = params.v3Min !== undefined ? params.v3Min : new THREE.Vector3( 0.0, 0.0, 0.0 );
	this.v3Max = params.v3Max !== undefined ? params.v3Max : new THREE.Vector3( 1.0, 1.0, 1.0 );
	this.iStart = params.iStart !== undefined ? params.iStart : 0;
	this.iEnd = params.iEnd !== undefined ? params.iEnd : this.count - 1;
	this.meshes = params.meshes;
	this.meshMaterials = params.meshMaterials;
	this.animator = params.animator;
	this.loadingTexture = params.loadingTexture;
	this.urls = params.urls;
	this.clearColor = params.clearColor;
	this.ThreeScene = params.scene;
	this.debugMesh;
	this.particleMesh;

	
	this.particleMat = new THREE.MeshBasicMaterial( {color: this.clearColor == 0x000000 ? 0xD6D6D6 : 0x050505/*, map: particleImage */ } );
	var geometry = new THREE.Geometry();

	for( var i = 0; i < 20; ++i )
	{
		var tempParticleMesh = new THREE.Mesh( new THREE.PlaneGeometry( 10, 10 ) );
		var endPos = new THREE.Vector3();

		endPos.x = this.v3Min.x + ( this.v3Max.x - this.v3Min.x ) * Math.random();
		endPos.y = this.v3Min.y + ( this.v3Max.y - this.v3Min.y ) * Math.random();
		endPos.z = this.v3Min.z + ( this.v3Max.z - this.v3Min.z ) * Math.random();

		tempParticleMesh.position.x = endPos.x;
		tempParticleMesh.position.y = endPos.y;
		tempParticleMesh.position.z = endPos.z;

		GeometryUtils.merge( geometry, tempParticleMesh );
	}

	this.particleMesh = new THREE.Mesh(  geometry, this.particleMat );
	this.ThreeScene.addObject( this.particleMesh );
	
	this.GetNewPhotos();
};

MeshArea.prototype =
{
	RebuildPositions : function( bAnimate )
	{
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			var currMesh = this.meshes[ i ];
			
			var endPos = new THREE.Vector3();
			
			endPos.x = this.v3Min.x + ( this.v3Max.x - this.v3Min.x ) * Math.random();
			endPos.y = this.v3Min.y + ( this.v3Max.y - this.v3Min.y ) * Math.random();
			endPos.z = this.v3Min.z + ( this.v3Max.z - this.v3Min.z ) * Math.random();
			
			if( bAnimate )
				this.animator.AddAnimation( { 
					interpolationType: "smoothstep", 
					dataType: "Vector3", 
					startValue: currMesh.position, 
					endValue: endPos,
					animValue: currMesh.position,
					duration: 2000,
					repetition: "oneShot"
				  } );
			
			else
				currMesh.position = endPos;
		}
	},
	
	GetNewPhotos : function()
	{	
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			var currMat = this.meshMaterials[ i ];
			currMat.map.image = this.loadingTexture;
			currMat.map.needsUpdate = true;
		}
		
		var iUrlStart = this.pageNumber * this.count;
		var iUrlEnd = this.count + this.pageNumber * this.count - 1;
		
		var i = this.iStart;
		for( var iUrl = iUrlStart; iUrl <= iUrlEnd; ++iUrl )
		{
			var currMesh = this.meshes[ i ];
						
			this.replaceTexture( this, this.urls[ iUrl ].small, this.applyNewImageInit, i );
			
			currMesh.textureSrc_small = this.urls[ iUrl ].small;
			currMesh.textureSrc_large = this.urls[ iUrl ].large;
			
			++i;
		}
	},
	
	switchToSmall : function()
	{
		if( this.bVisited )
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			this.replaceTexture( this, this.meshes[ i ].textureSrc_small, this.applyNewImageSwitchSize, i );
			//this.loadTexture( this, "http://www.martin-professional.de/color/small/blue101.1.gif", this.applyNewImageSwitchSize, i );
		}
	},
	
	switchToLarge : function()
	{
		if( !this.bVisited )
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			//console.log( "Loading large pic at: " + this.meshes[ i ].textureSrc_large );
			
			this.replaceTexture( this, this.meshes[ i ].textureSrc_large, this.applyNewImageSwitchSize, i );
			//this.loadTexture( this, "http://www.martin-professional.de/color/large/red301.1.gif", this.applyNewImageSwitchSize, i );
		}
	},
	
	replaceTexture : function( meshArea, path, callback, i )
	{
		var newImg = new Image();
		//var newImg = meshArea.meshMaterials[ i ].map.image;
		newImg.src = path;
		newImg.onload = function() { if( callback ) callback( newImg, meshArea, i ); };
		
	},

	applyNewImageInit : function ( img, meshArea, iElement )
	{
		var mesh = meshArea.meshes[ iElement ];
		//var img = mesh.materials[ 0 ].map.image;
		var fXscale = img.width / mesh.width;
		var fYscale = img.height / mesh.height;
		mesh.scale.x = fXscale;
		mesh.scale.y = fYscale;
			
		var currMat = meshArea.meshMaterials[ iElement ];
		delete currMat.map.image;
		currMat.map.image = img;
		currMat.map.needsUpdate = true;
	},
	
	applyNewImageSwitchSize : function( img, meshArea, iElement )
	{
		var currMat = meshArea.meshMaterials[ iElement ];
		delete currMat.map.image;
		currMat.map.image = img;
		currMat.map.needsUpdate = true;
	},
	
	cameraEnter : function()
	{
		this.switchToLarge();
	},
	
	cameraLeave : function()
	{
		this.switchToSmall();
	}
};


