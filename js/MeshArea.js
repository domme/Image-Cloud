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
	this.loadingTexture = params.loadingTexture;
	this.urls = params.urls;
	this.debugMesh;

	// var loadingImg = new Image();
	// loadingImg.src = "textures/loading.jpg";
	// 
	// for( var i = this.iStart; i <= this.iEnd; ++i )
	// {
	// 	this.meshes[ i ].materials = [ new THREE.MeshBasicMaterial ]
	// }	
	
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
	
	// GetNewPhotos : function( )
	// {
	// 	var meshArea = this;
	// 	
	// 	for( var i = this.iStart; i <= this.iEnd; ++i )
	// 			{
	// 				var currMesh = this.meshes[ i ];
	// 				currMesh.materials[ 0 ].map.image = this.loadingTexture;
	// 				currMesh.materials[ 0 ].map.needsUpdate = true;
	// 			}
	// 	
	// 	console.log( "http://img.ly/beautiful.json?page=" + meshArea.pageNumber + "&per_page=" + meshArea.count + "&jsoncallback=?" );
	// 	$.getJSON("http://img.ly/beautiful.json?page=" + meshArea.pageNumber + "&per_page=" + meshArea.count + "&jsoncallback=?", function (data) 
	// 	{
	// 		$.each(data, function (i, item) 
	// 		{	
	// 			var scr_temp = item.scape_image_url;
	// 			var scr_temp_large = item.image_url;
	// 
	// 			if( scr_temp.substr( 0,7 ) !== "http://" )		
	// 				scr_temp = 'http://img.ly' + scr_temp;
	// 
	// 			if( scr_temp_large.substr( 0, 7 ) !== "http://" )
	// 				scr_temp_large = 'http://img.ly' + scr_temp_large;
	// 				
	// 			var currMesh = meshArea.meshes[ meshArea.iStart + i ];
	// 				
	// 			currMesh.geometry = new THREE.Plane( currMesh.width, currMesh.height );
	// 			currMesh.geometry.computeBoundingSphere();
	// 						
	// 			meshArea.loadTexture( meshArea, scr_temp, meshArea.applyNewImageInit, meshArea.iStart + i );
	// 
	// 			currMesh.textureSrc_small = scr_temp;
	// 			currMesh.textureSrc_large = scr_temp_large;
	// 		});
	// 	});
	// },
	
	
	GetNewPhotos : function()
	{	
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			var currMesh = this.meshes[ i ];
			currMesh.materials[ 0 ].map.image = this.loadingTexture;
			currMesh.materials[ 0 ].map.needsUpdate = true;
		}
		
		var iUrlStart = this.pageNumber * this.count;
		var iUrlEnd = this.count + this.pageNumber * this.count - 1;
		
		var i = this.iStart;
		for( var iUrl = iUrlStart; iUrl <= iUrlEnd; ++iUrl )
		{
			var currMesh = this.meshes[ i ];
				
			currMesh.geometry = new THREE.Plane( currMesh.width, currMesh.height );
			currMesh.geometry.computeBoundingSphere();
						
			this.loadTexture( this, this.urls[ iUrl ].small, this.applyNewImageInit, i );
			
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
			this.loadTexture( this, this.meshes[ i ].textureSrc_small, this.applyNewImageSwitchSize, i );
			//this.loadTexture( this, "http://www.martin-professional.de/color/small/blue101.1.gif", this.applyNewImageSwitchSize, i );
		}
	},
	
	switchToLarge : function()
	{
		if( !this.bVisited )
		for( var i = this.iStart; i <= this.iEnd; ++i )
		{
			//console.log( "Loading large pic at: " + this.meshes[ i ].textureSrc_large );
			
			this.loadTexture( this, this.meshes[ i ].textureSrc_large, this.applyNewImageSwitchSize, i );
			//this.loadTexture( this, "http://www.martin-professional.de/color/large/red301.1.gif", this.applyNewImageSwitchSize, i );
		}
	},
	
	loadTexture : function( meshArea, path, callback, i )
	{
		var newImg = new Image();
		//var newImg = meshArea.meshes[ i ].materials[ 0 ].map.image;
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
			
		mesh.materials[ 0 ].map.image = img;
		mesh.materials[ 0 ].map.needsUpdate = true;
	},
	
	applyNewImageSwitchSize : function( img, meshArea, iElement )
	{
		var mesh = meshArea.meshes[ iElement ];
		mesh.materials[ 0 ].map.image = img;
		mesh.materials[ 0 ].map.needsUpdate = true;
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


