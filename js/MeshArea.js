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
	this.debugMesh;
	
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
				animator.AddAnimation( { 
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
	
	GetNewPhotos : function( )
	{
		var meshArea = this;
		console.log( "http://img.ly/beautiful.json?page=" + meshArea.pageNumber + "&per_page=" + meshArea.count + "&jsoncallback=?" );
		$.getJSON("http://img.ly/beautiful.json?page=" + meshArea.pageNumber + "&per_page=" + meshArea.count + "&jsoncallback=?", function (data) 
		{
			$.each(data, function (i, item) 
			{	
				var scr_temp = item.scape_image_url;
				var scr_temp_large = item.image_url;

				if( scr_temp.substr( 0,7 ) !== "http://" )		
					scr_temp = 'http://img.ly' + scr_temp;

				if( scr_temp_large.substr( 0, 7 ) !== "http://" )
					scr_temp_large = 'http://img.ly' + scr_temp_large;
					
				var currMesh = meshArea.meshes[ meshArea.iStart + i ];
					
				currMesh.geometry = new THREE.Plane( currMesh.startWidth, currMesh.startHeight );
				currMesh.geometry.computeBoundingSphere();
				currMesh.width = currMesh.startWidth;
				currMesh.height = currMesh.startHeight;

				meshArea.loadTexture( meshArea, scr_temp, new THREE.UVMapping(), meshArea.applyNewImageInit, meshArea.iStart + i );

				currMesh.textureSrc_small = scr_temp;
				currMesh.textureSrc_large = scr_temp_large;
			});
		});
	},
	
	switchToSmall : function()
	{
		if( this.bVisited )
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			//this.loadTexture( this, this.meshes[ i ].textureSrc_small, new THREE.UVMapping(), this.applyNewImageSwitchSize, i );
			this.loadTexture( this, "http://www.martin-professional.de/color/small/blue101.1.gif", new THREE.UVMapping(), this.applyNewImageSwitchSize, i );
		}
	},
	
	switchToLarge : function()
	{
		if( !this.bVisited )
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			//console.log( "Loading large pic at: " + this.meshes[ i ].textureSrc_large );
			
			//this.loadTexture( this, this.meshes[ i ].textureSrc_large, new THREE.UVMapping(), this.applyNewImageSwitchSize, i );
			this.loadTexture( this, "http://www.martin-professional.de/color/large/red301.1.gif", new THREE.UVMapping(), this.applyNewImageSwitchSize, i );
		}
	},
	
	loadTexture : function( meshArea, path, mapping, callback, i )
	{
		var newImg = new Image(),
			texture = new THREE.Texture( newImg, mapping, THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping, THREE.LinearMipMapLinearFilter, THREE.LinearMipMapLinearFilter );

		newImg.onload = function() { texture.needsUpdate = true; if( callback ) callback( meshArea, i, texture ); };
		newImg.src = path;

		return texture; 
	},

	applyNewImageInit : function ( meshArea, iElement, texture )
	{
		var mesh = meshArea.meshes[ iElement ];
		var fXscale = texture.image.width / mesh.width;
		var fYscale = texture.image.height / mesh.height;
		mesh.scale.x = fXscale;
		mesh.scale.y = fYscale;
		mesh.width = texture.image.width;
		mesh.height = texture.image.height;
		
		mesh.materials[ 0 ].map = texture;
		
		
	},
	
	applyNewImageSwitchSize : function( meshArea, iElement, texture )
	{
		var mesh = meshArea.meshes[ iElement ];
		mesh.materials[ 0 ].map = texture;
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


